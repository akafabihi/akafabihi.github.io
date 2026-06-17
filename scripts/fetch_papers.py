#!/usr/bin/env python3
"""Aggregate recent papers from the journal RSS/Atom feeds listed in
_data/journal_feeds.yml and write the merged result to _data/papers.json.

Runs in CI (see .github/workflows/fetch_papers.yml); the live site stays
fully static — it just reads the committed JSON via site.data.papers.

Dependencies (CI-only): feedparser, pyyaml.
"""

import calendar
import difflib
import hashlib
import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

import feedparser
import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FEEDS_FILE = os.path.join(ROOT, "_data", "journal_feeds.yml")
OUT_FILE = os.path.join(ROOT, "_data", "papers.json")

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 "
      "akafabihi-site-feed/1.0")

PER_FEED_LIMIT = 20    # newest N entries kept per journal
TOTAL_LIMIT = 120      # newest N entries kept overall
SUMMARY_MAX = 320      # characters
AUTHORS_MAX = 180      # characters

# Crossref is queried by title to recover authors when a feed omits them
# (e.g. AACR / Silverchair feeds). Free, no key; the mailto opts into the
# "polite pool". stdlib urllib only — no extra dependency.
CROSSREF_API = "https://api.crossref.org/works"
CROSSREF_UA = "akafabihi-site-feed/1.0 (mailto:fabifuu.sama@gmail.com)"
TITLE_MATCH_MIN = 0.90  # similarity required to trust a Crossref match

_TAGS = re.compile(r"<[^>]+>")
_WS = re.compile(r"\s+")
_ALNUM = re.compile(r"[^a-z0-9]+")


def clean(text):
    """Strip HTML, unescape entities, collapse whitespace."""
    text = _TAGS.sub(" ", text or "")
    text = html.unescape(text)
    return _WS.sub(" ", text).strip()


def _similar(a, b):
    norm = lambda s: _ALNUM.sub(" ", s.lower()).strip()
    return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()


def crossref_authors(title):
    """Look up a paper's authors on Crossref by title. Returns a formatted
    author string, or '' if no confident match is found."""
    try:
        query = urllib.parse.urlencode({
            "query.bibliographic": title,
            "rows": 1,
            "select": "title,author",
        })
        req = urllib.request.Request(
            CROSSREF_API + "?" + query,
            headers={"User-Agent": CROSSREF_UA},
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            items = json.load(resp).get("message", {}).get("items", [])
        if not items:
            return ""
        item = items[0]
        candidate = (item.get("title") or [""])[0]
        if not candidate or _similar(title, candidate) < TITLE_MATCH_MIN:
            return ""
        names = []
        for a in item.get("author", []):
            name = (a.get("given", "") + " " + a.get("family", "")).strip()
            names.append(name or a.get("name", "").strip())
        names = [n for n in names if n]
        return truncate(", ".join(names), AUTHORS_MAX)
    except Exception:  # noqa: BLE001 — enrichment is best-effort
        return ""


def truncate(text, limit):
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0].rstrip(",.;:") + "…"


def get_authors(entry):
    names = []
    if entry.get("authors"):
        names = [a.get("name", "").strip() for a in entry["authors"]]
    elif entry.get("author"):
        names = [entry["author"].strip()]
    names = [n for n in names if n]
    return truncate(", ".join(names), AUTHORS_MAX)


def get_date(entry):
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if not parsed:
        return 0, "", ""
    ts = calendar.timegm(parsed)
    dt = datetime.fromtimestamp(ts, tz=timezone.utc)
    return ts, dt.strftime("%Y-%m-%dT%H:%M:%SZ"), dt.strftime("%-d %b %Y")


def parse_feed(journal):
    name, url, category = journal["name"], journal["url"], journal.get("category", "")
    parsed = feedparser.parse(url, agent=UA)
    if parsed.bozo and not parsed.entries:
        raise RuntimeError(parsed.get("bozo_exception", "unknown parse error"))

    papers = []
    for entry in parsed.entries[:PER_FEED_LIMIT]:
        link = entry.get("link", "").strip()
        title = clean(entry.get("title", ""))
        if not link or not title:
            continue
        ts, date_iso, date_display = get_date(entry)
        summary = truncate(clean(entry.get("summary", "")), SUMMARY_MAX)
        authors = get_authors(entry)
        if not authors:                       # feed omitted authors — try Crossref
            authors = crossref_authors(title)
        papers.append({
            "id": hashlib.sha1(link.encode("utf-8")).hexdigest()[:10],
            "title": title,
            "link": link,
            "journal": name,
            "category": category,
            "authors": authors,
            "summary": summary,
            "date": date_iso,
            "date_display": date_display,
            "_ts": ts,
        })
    return papers


def main():
    with open(FEEDS_FILE, encoding="utf-8") as fh:
        feeds = yaml.safe_load(fh) or []

    all_papers, ok, failed = [], 0, 0
    for journal in feeds:
        try:
            items = parse_feed(journal)
            all_papers.extend(items)
            ok += 1
            print(f"  [ok]   {journal['name']}: {len(items)} entries")
        except Exception as exc:  # noqa: BLE001 — log and keep going
            failed += 1
            print(f"  [skip] {journal['name']}: {exc}", file=sys.stderr)

    # De-duplicate by link, keep newest, sort, cap.
    seen, deduped = set(), []
    for paper in sorted(all_papers, key=lambda p: p["_ts"], reverse=True):
        if paper["link"] in seen:
            continue
        seen.add(paper["link"])
        deduped.append(paper)
    deduped = deduped[:TOTAL_LIMIT]
    for paper in deduped:
        paper.pop("_ts", None)

    if not deduped:
        print("No papers fetched — leaving existing papers.json untouched.",
              file=sys.stderr)
        return 0

    payload = {
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "papers": deduped,
    }
    with open(OUT_FILE, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)
        fh.write("\n")

    print(f"\nWrote {len(deduped)} papers from {ok} feeds "
          f"({failed} failed) -> {os.path.relpath(OUT_FILE, ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

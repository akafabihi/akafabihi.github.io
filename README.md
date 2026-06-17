# kafabihi.com — Personal Academic Site

Personal site of **Abdulloh Kafa Bihi** (Fabi), researcher in cancer metabolism and immunometabolism.
Live at **[kafabihi.com](https://kafabihi.com)**.

Built on [Academic Pages](https://github.com/academicpages/academicpages.github.io), a Jekyll template for academic personal sites hosted on GitHub Pages. At this point the template has been heavily modified — the layout system, theme, blog, and reading experience are largely custom.

---

## What's been changed from the template

### Layout system

The original template uses a simple single-column or author-sidebar layout. This site replaces that with a **three-column rail system** on all content pages:

| Column | Role |
|--------|------|
| Left rail | Scroll-tracking Table of Contents |
| Center | Page content |
| Right rail | Persistent utility panel (font size, PDF, RSS, tags, links) |

Key files:
- `_sass/layout/_page.scss` — three-column CSS grid
- `_layouts/reading.html` — used for blog posts and long-form pages
- `_layouts/archive.html` — used for blog listing and tag pages
- `_includes/utility-rail.html` — right rail content
- `assets/js/reading.js` — scroll-tracking ToC via IntersectionObserver

### Theme

Uses the `default` theme (`site_theme: "default"` in `_config.yml`) with a heavily customised color palette:

- **Light mode**: teal primary (`#2f7f93`), white background, accessible link colors
- **Dark mode**: near-black teal background (`#020B0D`), muted teal headings/links, elevated panel surfaces
- Text selection colors are theme-aware (light teal in light mode, bright teal in dark mode) — defined in `_sass/theme/_default_light.scss` and `_sass/theme/_default_dark.scss`
- Dark mode toggled via `data-theme="dark"` on `<html>`, persisted in `localStorage` (`assets/js/theme.js`)

### Blog

The blog lives in `_posts/` and diverges from the template defaults in several ways:

| Feature | Default template | This site |
|---------|-----------------|-----------|
| Archive grouping | By year | By `yyyy-mm` |
| Post excerpt | First paragraph | First 60 words of full content |
| Teaser image | Grid view only | List view too (when `header.teaser` is set) |
| Tag pages | All tags on one page, hash scroll | Hash-filtered: `/tags/#meta` shows only `meta` posts |
| Tags navigation | None | Tags box in right rail on posts and archive pages |

Key files:
- `_pages/year-archive.html` — blog listing page (`/year-archive/`)
- `_pages/tag-archive.html` — tag listing page (`/tags/`)
- `_includes/archive-single.html` — post card for listings
- `assets/js/tag-filter.js` — hash-based tag filtering + ToC sync

### Reading experience

- **Font size controls** — A− / A / A+ buttons in the right rail, persisted in `localStorage` (`assets/js/utility-rail.js`)
- **Back-to-top button** — fixed teal circle (bottom-right), appears after 300px scroll, on posts and archive pages (`_includes/back-to-top.html`)
- **Footnotes** — custom styling for readability
- **Open Graph / Twitter cards** — social preview metadata configured in `_config.yml`

### Accessibility and mobile

- Color contrast fixes throughout (links, muted text, masthead)
- Mobile author profile layout fixed
- Mobile menu UX improvements
- Dark mode `::selection` color has sufficient contrast

---

## Running locally

**With Bundler (recommended):**
```bash
bundle exec jekyll serve
```

**With Docker:**
```bash
docker-compose up
```

The Docker config lives in `Dockerfile` and `docker-compose.yaml`, with Jekyll config overrides in `_config_docker.yml`.

---

## Content structure

| Directory | Content |
|-----------|---------|
| `_posts/` | Blog posts (`YYYY-MM-DD-title.md`) |
| `_publications/` | Publications list |
| `_pages/` | Static pages (CV, research, activities, etc.) |
| `_data/` | Navigation, links, UI strings |
| `images/` | Images and profile photo |

### Writing a blog post

Create `_posts/YYYY-MM-DD-your-slug.md` with this front matter:

```yaml
---
title: "Your Post Title"
date: 2026-06-17
permalink: /posts/2026/06/your-slug/
tags:
  - sometag
---
```

No `layout:` needed — `_config.yml` defaults all posts to `layout: reading`.

---

## License

Site content: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
Template base: [Academic Pages](https://github.com/academicpages/academicpages.github.io) (MIT).

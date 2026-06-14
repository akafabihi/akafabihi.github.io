/* reading.js — TOC + scrollspy + collapsible contextual panel
   Loaded as <script type="module"> only on pages using _layouts/reading.html.
   Does NOT go through the uglify bundle; edit here and push directly. */

const MASTHEAD_HEIGHT = 70; // keep in sync with $masthead-height in theme SCSS

/* ── TOC ───────────────────────────────────────────────────────────────── */

function buildToc() {
  const content  = document.getElementById('reading-content');
  const menu     = document.getElementById('toc-menu');
  const tocAside = document.querySelector('.site-left-rail');
  if (!content || !menu || !tocAside) return;

  const headings = Array.from(content.querySelectorAll('h1, h2, h3'));
  if (headings.length < 2) {
    tocAside.style.display = 'none';
    document.getElementById('main').classList.add('toc-hidden');
    return;
  }

  const minLevel = Math.min(...headings.map(h => parseInt(h.tagName[1])));
  let html = '';
  let prevLevel = minLevel;

  headings.forEach(h => {
    const level = parseInt(h.tagName[1]);
    const id    = h.id;
    const text  = h.textContent.trim();
    if (!id) return;

    if (level > prevLevel) {
      html += '<ul>'.repeat(level - prevLevel);
    } else if (level < prevLevel) {
      html += '</ul></li>'.repeat(prevLevel - level);
    } else if (prevLevel !== minLevel) {
      html += '</li>';
    }

    html += `<li><a href="#${id}" data-toc-id="${id}">${text}</a>`;
    prevLevel = level;
  });
  html += '</li>' + '</ul></li>'.repeat(prevLevel - minLevel);

  menu.innerHTML = html;

  /* ── Scrollspy via IntersectionObserver ── */
  const links = menu.querySelectorAll('a[data-toc-id]');
  const linkMap = {};
  links.forEach(a => { linkMap[a.dataset.tocId] = a; });

  let activeId = null;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const id = entry.target.id;
      if (entry.isIntersecting) {
        if (activeId) linkMap[activeId]?.classList.remove('is-active');
        activeId = id;
        linkMap[id]?.classList.add('is-active');
      }
    });
  }, {
    rootMargin: `-${MASTHEAD_HEIGHT + 8}px 0px -70% 0px`,
    threshold: 0,
  });

  headings.forEach(h => { if (h.id) observer.observe(h); });
}

/* ── Contextual panel collapse/expand ──────────────────────────────────── */

function initCtxPanel() {
  const aside  = document.querySelector('.site-right-rail');
  const toggle = document.querySelector('.ctx-panel__toggle');
  if (!aside || !toggle) return;

  const STORAGE_KEY = 'reading-ctx-open';

  function setCollapsed(collapsed) {
    if (collapsed) {
      aside.setAttribute('data-collapsed', '');
      toggle.setAttribute('aria-expanded', 'false');
    } else {
      aside.removeAttribute('data-collapsed');
      toggle.setAttribute('aria-expanded', 'true');
    }
    try { localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0'); } catch (_) {}
  }

  /* Restore persisted state (collapsed = default) */
  let stored = null;
  try { stored = localStorage.getItem(STORAGE_KEY); } catch (_) {}
  setCollapsed(stored !== '0'); /* default collapsed unless explicitly opened */

  toggle.addEventListener('click', () => {
    setCollapsed(!aside.hasAttribute('data-collapsed') ? true : false);
  });
}

/* ── Init ──────────────────────────────────────────────────────────────── */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { buildToc(); initCtxPanel(); });
} else {
  buildToc();
  initCtxPanel();
}

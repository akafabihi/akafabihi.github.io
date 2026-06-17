/* tag-filter.js — on /tags/, show only the selected tag section when a hash is present */

function setVisible(h2, show) {
  h2.hidden = !show;
  let el = h2.nextElementSibling;
  while (el && !el.matches('h2.archive__subtitle')) {
    el.hidden = !show;
    el = el.nextElementSibling;
  }
}

function syncToc(hash) {
  const tocItems = document.querySelectorAll('#toc-menu li');
  if (!tocItems.length) return;
  tocItems.forEach(li => {
    const a = li.querySelector('a');
    if (!a) return;
    const itemHash = a.getAttribute('href').slice(1);
    li.hidden = hash ? itemHash !== hash : false;
  });
}

function applyFilter() {
  const sections = document.querySelectorAll('h2.archive__subtitle');
  if (!sections.length) return;

  const hash = window.location.hash.slice(1);
  const backLink = document.getElementById('tag-back-link');

  if (!hash) {
    sections.forEach(h2 => setVisible(h2, true));
    syncToc('');
    if (backLink) backLink.hidden = true;
    return;
  }

  let matched = false;
  sections.forEach(h2 => {
    const show = h2.id === hash;
    if (show) matched = true;
    setVisible(h2, show);
  });

  syncToc(matched ? hash : '');
  if (backLink) backLink.hidden = !matched;
}

function injectBackLink() {
  if (document.getElementById('tag-back-link')) return;
  const firstSection = document.querySelector('h2.archive__subtitle');
  if (!firstSection) return;

  const p = document.createElement('p');
  p.id = 'tag-back-link';
  p.hidden = true;
  p.innerHTML = '<a href="' + window.location.pathname + '">← All tags</a>';
  firstSection.parentNode.insertBefore(p, firstSection);
}

function init() {
  if (!window.location.pathname.match(/\/tags\/?$/)) return;
  injectBackLink();
  applyFilter();
  window.addEventListener('hashchange', applyFilter);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

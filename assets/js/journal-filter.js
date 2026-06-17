/* journal-filter.js — on /journal-feed/, toggle which journals are shown.
   Chips are unselected by default (= show everything). Selecting one or more
   chips narrows the list to those journals. Empty category headings and the
   matching "On This Page" TOC items are hidden automatically.

   Visibility is toggled via inline style.display rather than the [hidden]
   attribute: the theme sets `display` on headings/articles, which overrides
   the low-specificity `[hidden] { display: none }` rule and would otherwise
   leave "hidden" entries on screen. */

function init() {
  const bar = document.querySelector('.feed-filter');
  if (!bar) return;

  const chips = Array.from(bar.querySelectorAll('.feed-filter__chip'));
  const entries = Array.from(document.querySelectorAll('.feed-entry'));
  const reset = document.getElementById('feed-filter-reset');
  if (!chips.length || !entries.length) return;

  const show = (el, visible) => {
    el.style.display = visible ? '' : 'none';
    el.hidden = !visible;            // keep attribute in sync (clears initial `hidden`)
  };
  const isVisible = el => el.style.display !== 'none';

  function apply() {
    const active = new Set(
      chips.filter(c => c.getAttribute('aria-pressed') === 'true')
           .map(c => c.dataset.journal)
    );
    const showAll = active.size === 0;

    entries.forEach(e => show(e, showAll || active.has(e.dataset.journal)));

    // Hide category heading + its list when nothing inside is visible.
    document.querySelectorAll('.feed-list').forEach(list => {
      const visible = Array.from(list.querySelectorAll('.feed-entry')).some(isVisible);
      show(list, visible);
      const heading = list.previousElementSibling;
      if (heading && heading.tagName === 'H2') show(heading, visible);
    });

    // Keep the "On This Page" TOC in sync with visible categories.
    document.querySelectorAll('#toc-menu li').forEach(li => {
      const a = li.querySelector('a');
      if (!a) return;
      const target = document.getElementById(a.getAttribute('href').slice(1));
      show(li, target ? isVisible(target) : true);
    });

    if (reset) show(reset, !showAll);
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const pressed = chip.getAttribute('aria-pressed') === 'true';
      chip.setAttribute('aria-pressed', pressed ? 'false' : 'true');
      apply();
    });
  });

  if (reset) {
    reset.addEventListener('click', () => {
      chips.forEach(c => c.setAttribute('aria-pressed', 'false'));
      apply();
    });
  }

  apply();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

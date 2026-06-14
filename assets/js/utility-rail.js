/* utility-rail.js — persistent font-size controls with localStorage.
   Loaded as <script type="module"> on all pages (via scripts.html).
   Applies stored scale on every load; wires buttons when present. */

const FONT_KEY     = 'reader-font-scale';
const FONT_MIN     = 0.85;
const FONT_MAX     = 1.30;
const FONT_STEP    = 0.05;
const FONT_DEFAULT = 1.00;

function getScale() {
  try {
    const s = parseFloat(localStorage.getItem(FONT_KEY));
    return isNaN(s) ? FONT_DEFAULT : s;
  } catch (_) { return FONT_DEFAULT; }
}

function setScale(scale) {
  const clamped = Math.round(Math.min(FONT_MAX, Math.max(FONT_MIN, scale)) * 1000) / 1000;
  document.documentElement.style.setProperty('--reader-font-scale', clamped);
  try { localStorage.setItem(FONT_KEY, clamped); } catch (_) {}
}

function init() {
  setScale(getScale());

  const smaller = document.getElementById('font-smaller');
  const reset   = document.getElementById('font-reset');
  const larger  = document.getElementById('font-larger');
  if (!smaller) return;

  smaller.addEventListener('click', () => setScale(getScale() - FONT_STEP));
  reset.addEventListener('click',   () => setScale(FONT_DEFAULT));
  larger.addEventListener('click',  () => setScale(getScale() + FONT_STEP));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

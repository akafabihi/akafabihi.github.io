// lightbox.js — click any content image (or same-site image link) to view it
// full-size over a dark backdrop. Close with the ✕ button, a backdrop click,
// or Escape. Opt out per image/link with {: .no-zoom} in the markdown.

const IMG_RE = /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i;

// Build the single reusable overlay; returns an open(src, caption) function.
function build() {
  const box = document.createElement("div");
  box.className = "lightbox";
  box.innerHTML =
    '<button class="lightbox__close" type="button" aria-label="Close">&times;</button>' +
    '<img class="lightbox__img" alt="">' +
    '<p class="lightbox__caption"></p>';
  document.body.appendChild(box);

  const img = box.querySelector(".lightbox__img");
  const cap = box.querySelector(".lightbox__caption");

  const close = () => {
    box.classList.remove("is-open");
    document.body.style.overflow = "";
  };
  box.addEventListener("click", (e) => {
    if (e.target === box || e.target.closest(".lightbox__close")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  return (src, caption) => {
    img.src = src;
    img.alt = caption || "";
    cap.textContent = caption || "";
    cap.style.display = caption ? "" : "none";
    box.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };
}

function init() {
  const root = document.querySelector(".page__content");
  if (!root) return;
  const open = build();

  // Same-site image links: [word](/photo.jpg) → pop the image instead of navigating.
  root.querySelectorAll("a[href]:not(.no-zoom)").forEach((a) => {
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !IMG_RE.test(url.pathname)) return;
    a.classList.add("is-zoomable");
    a.addEventListener("click", (e) => {
      e.preventDefault();
      open(a.href, a.title || a.textContent.trim());
    });
  });

  // Inline images, minus opt-outs and any already wrapped in their own link.
  root.querySelectorAll("img:not(.no-zoom)").forEach((im) => {
    if (im.closest("a")) return;
    im.classList.add("is-zoomable");
    im.addEventListener("click", () => open(im.currentSrc || im.src, im.alt));
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

import { fromHTML } from "../dom.ts";
import { CONTACT_EMAIL, SITE } from "../data.ts";
import { initRipple } from "../ripple.ts";

export function hero(): HTMLElement {
  const iconSrc = import.meta.env.BASE_URL + "icon.png";
  const section = fromHTML(`
    <section class="hero" id="top">
      <div class="hero-text">
        <p class="eyebrow">${SITE.eyebrow}</p>
        <h1 class="hero-title">${SITE.headline}</h1>
        <p class="hero-sub">${SITE.subcopy}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="mailto:${CONTACT_EMAIL}">${SITE.ctaPrimary}</a>
          <a class="btn btn-ghost" href="#services">${SITE.ctaSecondary}</a>
        </div>
      </div>
      <div class="hero-visual">
        <canvas class="hero-ripple" aria-hidden="true"></canvas>
      </div>
    </section>
  `);

  const canvas = section.querySelector<HTMLCanvasElement>(".hero-ripple")!;

  // Defer initRipple until the section is in the DOM. Observing a detached
  // element makes IntersectionObserver fire isIntersecting:false once and
  // never re-fire true after the parent is appended, which left the ripple
  // blank until the user scrolled. Deferring one frame (~16ms) ensures
  // resize() gets real dimensions and the IO fires true immediately.
  let cleanupRipple = () => {};
  let removed = false;

  requestAnimationFrame(() => {
    if (removed) return;
    cleanupRipple = initRipple(canvas, iconSrc);
  });

  const originalRemove = section.remove.bind(section);
  section.remove = () => {
    removed = true;
    cleanupRipple();
    originalRemove();
  };

  return section;
}

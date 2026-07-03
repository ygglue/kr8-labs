import { fromHTML } from "../dom.ts";
import { CONTACT_EMAIL, SITE } from "../data.ts";
import { initRipple } from "../ripple.ts";

export function hero(): HTMLElement {
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
  const cleanup = initRipple(canvas);

  const originalRemove = section.remove.bind(section);
  section.remove = () => {
    cleanup();
    originalRemove();
  };

  return section;
}

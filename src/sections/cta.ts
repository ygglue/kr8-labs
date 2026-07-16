import { fromHTML } from "../dom.ts";
import { CONTACT_EMAIL, SITE } from "../data.ts";
import { initBlackHole } from "../blackhole.ts";

export function cta(): HTMLElement {
  const section = fromHTML(`
    <section class="cta" id="contact">
      <canvas class="cta-blackhole" aria-hidden="true"></canvas>
      <div class="cta-inner">
        <p class="eyebrow">LET'S BUILD</p>
        <h2 class="cta-title">Ready to build without limits?</h2>
        <p class="cta-sub">
          Tell us what you're creating. We'll help you craft it.
        </p>
        <a class="btn btn-primary btn-lg" href="mailto:${CONTACT_EMAIL}">
          ${SITE.ctaPrimary}
        </a>
      </div>
    </section>
  `);

  const canvas = section.querySelector<HTMLCanvasElement>(".cta-blackhole")!;
  let removed = false;
  let cleanup = () => {};

  // Same reasoning as the hero's particle canvas: defer until the section is
  // in the DOM, since measuring a detached canvas gets zero dimensions.
  requestAnimationFrame(() => {
    if (removed) return;
    cleanup = initBlackHole(canvas);
  });

  const originalRemove = section.remove.bind(section);
  section.remove = () => {
    removed = true;
    cleanup();
    originalRemove();
  };

  return section;
}

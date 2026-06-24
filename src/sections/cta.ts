import { fromHTML } from "../dom.ts";
import { CONTACT_EMAIL, SITE } from "../data.ts";

export function cta(): HTMLElement {
  return fromHTML(`
    <section class="cta" id="contact">
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
}

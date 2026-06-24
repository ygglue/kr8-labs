import { fromHTML } from "../dom.ts";
import { CONTACT_EMAIL, SITE } from "../data.ts";

export function hero(): HTMLElement {
  return fromHTML(`
    <section class="hero" id="top">
      <p class="eyebrow">${SITE.eyebrow}</p>
      <h1 class="hero-title">${SITE.headline}</h1>
      <p class="hero-sub">${SITE.subcopy}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="mailto:${CONTACT_EMAIL}">${SITE.ctaPrimary}</a>
        <a class="btn btn-ghost" href="#services">${SITE.ctaSecondary}</a>
      </div>
    </section>
  `);
}

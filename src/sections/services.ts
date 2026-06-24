import { fromHTML } from "../dom.ts";
import { SERVICES } from "../data.ts";

function card(icon: string, title: string, description: string): string {
  return `
    <article class="card">
      <span class="card-icon">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
             stroke="currentColor" stroke-width="1.6"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          ${icon}
        </svg>
      </span>
      <h3 class="card-title">${title}</h3>
      <p class="card-desc">${description}</p>
    </article>`;
}

export function services(): HTMLElement {
  return fromHTML(`
    <section class="services" id="services">
      <div class="section-head">
        <p class="eyebrow">02 · WHAT WE DO</p>
        <h2 class="section-title">Everything you need to ship and scale</h2>
      </div>
      <div class="card-grid">
        ${SERVICES.map((s) => card(s.icon, s.title, s.description)).join("")}
      </div>
    </section>
  `);
}

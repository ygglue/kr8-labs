import { fromHTML } from "../dom.ts";
import { WORKS } from "../data.ts";

export function works(): HTMLElement {
  return fromHTML(`
    <section class="works" id="works">
      <div class="works-header">
        <p class="eyebrow">03 · RECENT WORK</p>
        <h2>Selected Projects</h2>
      </div>
      <div class="works-grid">
        ${WORKS.map((w) => `
          <a class="work-card" href="${w.url}" target="_blank" rel="noopener noreferrer">
            <div class="work-card-frame">
              <div class="work-card-chrome">
                <span></span><span></span><span></span>
              </div>
              <img class="work-card-image" src="${w.image}" alt="${w.name} website preview" loading="lazy" />
            </div>
            <div class="work-card-text">
              <div class="work-card-heading">
                <h3 class="work-card-title">${w.name}</h3>
                <span class="work-card-arrow" aria-hidden="true">&#8599;</span>
              </div>
              <p class="work-card-tagline">${w.tagline}</p>
              <p class="work-card-desc">${w.description}</p>
            </div>
          </a>
        `).join("")}
      </div>
    </section>
  `);
}

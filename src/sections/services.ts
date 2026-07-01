import { fromHTML } from "../dom.ts";
import { SERVICES } from "../data.ts";
import { initServices3D } from '../services-3d.ts';

export function services(): HTMLElement {
  const section = fromHTML(`
    <section class="services" id="services">
      <div class="services-header">
        <p class="eyebrow">02 · WHAT WE DO</p>
        <h2>Capabilities</h2>
      </div>
      <div class="services-grid">
        ${SERVICES.map((s, i) => `
          <div class="service-card" data-index="${i}">
            <div class="service-card-icon" aria-hidden="true"></div>
            <h3 class="service-card-title">${s.title}</h3>
            <p class="service-card-desc">${s.description}</p>
          </div>
        `).join("")}
      </div>
    </section>
  `);

  requestAnimationFrame(() => {
    const canvasSlots = Array.from(section.querySelectorAll<HTMLElement>('.service-card-icon'));
    initServices3D(canvasSlots);
  });

  return section;
}

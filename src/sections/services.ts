import { fromHTML } from "../dom.ts";
import { SERVICES } from "../data.ts";
import { initServices3D } from '../services-3d.ts';

export function services(): HTMLElement {
  const section = fromHTML(`
    <section class="services" id="services">
      <div class="services-header">
        <p class="eyebrow">01 · WHAT WE DO</p>
        <h2>Capabilities</h2>
      </div>
      <div class="services-grid">
        ${SERVICES.map((s, i) => `
          <div class="service-card" data-index="${i}">
            <div class="service-card-icon" aria-hidden="true"></div>
            <div class="service-card-text">
              <h3 class="service-card-title">${s.title}</h3>
              <p class="service-card-desc">${s.description}</p>
            </div>
          </div>
        `).join("")}
      </div>
    </section>
  `);

  // Building the 6 WebGL renderers + bloom passes is a ~350ms synchronous
  // main-thread block. The grid is below the fold on load, so defer it until
  // the section approaches the viewport — this keeps it off the critical path
  // and avoids the cost entirely for visitors who never scroll here.
  const grid = section.querySelector<HTMLElement>('.services-grid')!;
  const initObserver = new IntersectionObserver(
    (entries, obs) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      obs.disconnect();
      const canvasSlots = Array.from(section.querySelectorAll<HTMLElement>('.service-card-icon'));
      initServices3D(canvasSlots);
    },
    { rootMargin: '200px 0px' },
  );
  initObserver.observe(grid);

  return section;
}

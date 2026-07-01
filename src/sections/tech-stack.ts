import { fromHTML } from "../dom.ts";
import { TECH_STACK } from "../data.ts";

export function techStack(): HTMLElement {
  return fromHTML(`
    <section class="tech-stack" id="stack">
      <div class="tech-stack-header">
        <p class="eyebrow">02 · TECHNOLOGY STACK</p>
        <h2>Technology Stack</h2>
      </div>
      <div class="tech-stack-grid">
        ${TECH_STACK.map(c => `
          <div class="tech-stack-col">
            <h3 class="tech-stack-category">${c.category}</h3>
            <ul class="tech-stack-list">
              ${c.items.map(item => `<li>${item}</li>`).join("")}
            </ul>
          </div>
        `).join("")}
      </div>
    </section>
  `);
}

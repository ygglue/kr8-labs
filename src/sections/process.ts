import { fromHTML } from "../dom.ts";
import { PROCESS } from "../data.ts";

export function process(): HTMLElement {
  return fromHTML(`
    <section class="process" id="process">
      <div class="process-header">
        <p class="eyebrow">04 · PROCESS</p>
        <h2>How We Work</h2>
      </div>
      <div class="process-steps">
        ${PROCESS.map((step, i) => `
          <div class="process-step">
            <span class="process-step-num">${String(i + 1).padStart(2, "0")}</span>
            <span class="process-step-name">${step}</span>
          </div>
        `).join("")}
      </div>
    </section>
  `);
}

import { fromHTML } from "../dom.ts";
import { WHY_KR8 } from "../data.ts";

export function whyKr8(): HTMLElement {
  return fromHTML(`
    <section class="why-kr8" id="why">
      <div class="why-kr8-header">
        <p class="eyebrow">03 · WHY KR8 LABS</p>
        <h2>Why KR8 Labs</h2>
      </div>
      <ul class="why-kr8-list">
        ${WHY_KR8.map(point => `
          <li class="why-kr8-item">${point}</li>
        `).join("")}
      </ul>
    </section>
  `);
}

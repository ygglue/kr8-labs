import { fromHTML } from "../dom.ts";
import { SERVICES } from "../data.ts";

export function services(): HTMLElement {
  const count = SERVICES.length;

  const section = fromHTML(`
    <section class="services" id="services">
      <div class="services-sticky">

        <div class="services-top">
          <p class="eyebrow">02 · WHAT WE DO</p>
          <span class="service-counter">
            <span class="counter-cur">01</span> / 0${count}
          </span>
        </div>

        <div class="services-slides">
          ${SERVICES.map((s, i) => `
            <div class="service-slide${i === 0 ? " is-active" : ""}" data-index="${i}">
              <span class="service-num">0${i + 1}</span>
              <div class="service-body">
                <span class="service-icon-wrap">
                  <svg viewBox="0 0 24 24" width="52" height="52" fill="none"
                       stroke="currentColor" stroke-width="1.4"
                       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    ${s.icon}
                  </svg>
                </span>
                <h3 class="service-name">${s.title}</h3>
                <p class="service-desc">${s.description}</p>
              </div>
            </div>
          `).join("")}
        </div>

        <div class="services-bottom">
          <div class="services-dots" role="tablist" aria-label="Services">
            ${SERVICES.map((s, i) => `
              <button class="dot${i === 0 ? " is-active" : ""}"
                      role="tab" aria-label="${s.title}" data-dot="${i}"></button>
            `).join("")}
          </div>
          <p class="scroll-hint">Scroll to explore</p>
        </div>

      </div>
    </section>
  `);

  const slides = Array.from(section.querySelectorAll<HTMLElement>(".service-slide"));
  const dots   = Array.from(section.querySelectorAll<HTMLElement>(".dot"));
  const counter = section.querySelector<HTMLElement>(".counter-cur")!;
  const hint    = section.querySelector<HTMLElement>(".scroll-hint")!;
  let current = 0;
  let hinted  = false;

  function activate(index: number) {
    if (index === current) return;
    slides[current].classList.remove("is-active");
    dots[current].classList.remove("is-active");
    current = index;
    slides[current].classList.add("is-active");
    dots[current].classList.add("is-active");
    counter.textContent = String(index + 1).padStart(2, "0");
  }

  function onScroll() {
    const rect    = section.getBoundingClientRect();
    const scrolled = -rect.top;

    if (!hinted && scrolled > 20) {
      hinted = true;
      hint.classList.add("hint-gone");
    }

    if (scrolled <= 0) { activate(0); return; }

    const range   = section.offsetHeight - window.innerHeight;
    const progress = Math.min(Math.max(scrolled / range, 0), 1);
    activate(Math.min(Math.floor(progress * count), count - 1));
  }

  window.addEventListener("scroll", onScroll, { passive: true });

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      const rect     = section.getBoundingClientRect();
      const top      = window.scrollY + rect.top;
      const range    = section.offsetHeight - window.innerHeight;
      const target   = top + (i / count) * range;
      window.scrollTo({ top: target, behavior: "smooth" });
    });
  });

  return section;
}

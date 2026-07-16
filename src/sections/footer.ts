import { fromHTML } from "../dom.ts";
import { logoLockup } from "../logo.ts";
import { ABOUT, SOCIALS } from "../data.ts";

export function footer(): HTMLElement {
  return fromHTML(`
    <footer class="footer">
      <div class="footer-left">
        <a class="nav-brand" href="#top" aria-label="KR8 Labs home">
          ${logoLockup("footer", 26)}
        </a>
        <p class="footer-about-title">${ABOUT.title}</p>
        <p class="footer-about-body">${ABOUT.body}</p>
      </div>
      <div class="footer-right">
        <p class="footer-tag">Build without limits.</p>
        <div class="footer-socials">
          ${SOCIALS.map((s) => `
            <a href="${s.url}" aria-label="${s.name}" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${s.icon}</svg>
            </a>
          `).join("")}
        </div>
        <p class="footer-copy">© 2026 KR8 Labs</p>
      </div>
    </footer>
  `);
}

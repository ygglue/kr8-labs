import { fromHTML } from "../dom.ts";
import { logoLockup } from "../logo.ts";
import { ABOUT } from "../data.ts";

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
        <p class="footer-copy">© 2026 KR8 Labs</p>
      </div>
    </footer>
  `);
}

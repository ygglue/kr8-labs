import { fromHTML } from "../dom.ts";
import { logoLockup } from "../logo.ts";

export function footer(): HTMLElement {
  return fromHTML(`
    <footer class="footer">
      <a class="nav-brand" href="#top" aria-label="KR8 Labs home">
        ${logoLockup("footer", 26)}
      </a>
      <p class="footer-tag">Build without limits.</p>
      <p class="footer-copy">© 2026 KR8 Labs</p>
    </footer>
  `);
}

import { fromHTML } from "../dom.ts";
import { logoLockup } from "../logo.ts";
import { CONTACT_EMAIL, SITE } from "../data.ts";

export function nav(): HTMLElement {
  const header = fromHTML(`
    <header class="nav">
      <a class="nav-brand" href="#top" aria-label="KR8 Labs home">
        ${logoLockup("nav")}
      </a>
      <nav class="nav-links">
        <a href="#services">Services</a>
        <a href="#process">Process</a>
        <a href="#faq">FAQ</a>
      </nav>
      <a class="btn btn-primary btn-sm" href="mailto:${CONTACT_EMAIL}">
        ${SITE.ctaPrimary}
      </a>
    </header>
  `);

  const mql = window.matchMedia("(max-width: 768px)");

  function updateNav() {
    if (!mql.matches) {
      header.classList.remove("nav-visible");
      return;
    }
    if (window.scrollY > window.innerHeight * 0.8) {
      header.classList.add("nav-visible");
    } else {
      header.classList.remove("nav-visible");
    }
  }

  window.addEventListener("scroll", updateNav, { passive: true });
  mql.addEventListener("change", updateNav);
  updateNav();

  return header;
}

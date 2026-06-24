import { fromHTML } from "../dom.ts";
import { logoLockup } from "../logo.ts";
import { CONTACT_EMAIL, SITE } from "../data.ts";

export function nav(): HTMLElement {
  return fromHTML(`
    <header class="nav">
      <a class="nav-brand" href="#top" aria-label="KR8 Labs home">
        ${logoLockup("nav")}
      </a>
      <a class="btn btn-primary btn-sm" href="mailto:${CONTACT_EMAIL}">
        ${SITE.ctaPrimary}
      </a>
    </header>
  `);
}

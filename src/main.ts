import "./style.css";
import { mountBackground } from "./background.ts";
import { nav } from "./sections/nav.ts";
import { hero } from "./sections/hero.ts";
import { services } from "./sections/services.ts";
import { cta } from "./sections/cta.ts";
import { footer } from "./sections/footer.ts";

// Content first — background failure must never block the page.
const app = document.getElementById("app")!;
app.append(nav(), hero(), services(), cta(), footer());

// Background mounts asynchronously (waits for noise texture to load).
const bg = document.getElementById("bg");
if (bg) mountBackground(bg).catch(() => { /* shader unavailable, page still works */ });

import "./style.css";
import { mountBackground } from "./background.ts";
import { nav } from "./sections/nav.ts";
import { hero } from "./sections/hero.ts";
import { services } from "./sections/services.ts";
import { cta } from "./sections/cta.ts";
import { footer } from "./sections/footer.ts";

// Nav is full-bleed (outside the max-width container).
const app = document.getElementById("app")!;
document.body.insertBefore(nav(), app);
app.append(hero(), services(), cta(), footer());

// Background mounts asynchronously (waits for noise texture to load).
const bg = document.getElementById("bg");
if (bg) mountBackground(bg).catch(() => { /* shader unavailable, page still works */ });

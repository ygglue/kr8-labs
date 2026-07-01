import "./style.css";
import { nav } from "./sections/nav.ts";
import { hero } from "./sections/hero.ts";
import { services } from "./sections/services.ts";
import { cta } from "./sections/cta.ts";
import { footer } from "./sections/footer.ts";

const app = document.getElementById("app")!;
document.body.insertBefore(nav(), app);
app.append(hero(), services(), cta(), footer());

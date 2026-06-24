/** Site copy + service definitions, kept in one place for easy editing. */

export const CONTACT_EMAIL = "hello@kr8labs.com";

export const SITE = {
  eyebrow: "CRAFT · ∞ · BUILD WITHOUT LIMITS",
  headline: "Building digital experiences that scale infinitely",
  subcopy:
    "KR8 Labs is a modern web development company building scalable, high-performance digital experiences.",
  ctaPrimary: "Start a project",
  ctaSecondary: "View our work",
};

export interface Service {
  /** Inline SVG path/markup for a 24×24 line icon (stroke = currentColor). */
  icon: string;
  title: string;
  description: string;
}

// 24×24, stroke-based line icons matching the spec's "clean line" aesthetic.
export const SERVICES: Service[] = [
  {
    title: "Development",
    description: "Robust, maintainable code engineered for the long run.",
    icon: `<polyline points="8 7 3 12 8 17"/><polyline points="16 7 21 12 16 17"/>`,
  },
  {
    title: "UI / UX",
    description: "Interfaces that feel effortless and look unmistakable.",
    icon: `<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18"/><path d="M8 21h8"/>`,
  },
  {
    title: "Cloud",
    description: "Scalable infrastructure that grows with your traffic.",
    icon: `<path d="M7 18a4 4 0 0 1 .6-7.96 5 5 0 0 1 9.7 1.46A3.5 3.5 0 0 1 17 18H7Z"/>`,
  },
  {
    title: "Database",
    description: "Fast, reliable data layers designed to never lose a byte.",
    icon: `<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/>`,
  },
  {
    title: "Security",
    description: "Hardened by default — your users and data stay protected.",
    icon: `<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z"/><path d="M9 12l2 2 4-4"/>`,
  },
  {
    title: "Performance",
    description: "Sub-second load times tuned to the millisecond.",
    icon: `<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>`,
  },
];

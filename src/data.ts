/** Site copy + content definitions, kept in one place for easy editing. */

export const CONTACT_EMAIL = "hello@kr8labs.com";

export const SITE = {
  eyebrow: "CUSTOM SOFTWARE • WEB DEVELOPMENT • UI/UX",
  headline: "Custom web development that scales",
  subcopy:
    "We build custom websites, SaaS, and web apps for growing businesses — fast, secure, and built to last.",
  ctaPrimary: "Let's Talk",
  ctaSecondary: "View Our Work",
};

export interface Service {
  icon: string;
  title: string;
  description: string;
}

export const SERVICES: Service[] = [
  {
    title: "Development",
    description: "Custom websites, SaaS products, APIs, and business platforms engineered with clean, maintainable code for long-term growth.",
    icon: `<polyline points="8 7 3 12 8 17"/><polyline points="16 7 21 12 16 17"/>`,
  },
  {
    title: "UI / UX",
    description: "User-centered interfaces designed to improve usability, increase conversions, and strengthen your brand.",
    icon: `<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18"/><path d="M8 21h8"/>`,
  },
  {
    title: "Cloud",
    description: "Cloud architecture and deployment pipelines that keep your applications fast, reliable, and ready to scale.",
    icon: `<path d="M7 18a4 4 0 0 1 .6-7.96 5 5 0 0 1 9.7 1.46A3.5 3.5 0 0 1 17 18H7Z"/>`,
  },
  {
    title: "Database",
    description: "Well-structured databases optimized for speed, security, and long-term scalability.",
    icon: `<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/>`,
  },
  {
    title: "Security",
    description: "Industry-standard authentication, encryption, and security best practices to protect your users and your business.",
    icon: `<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z"/><path d="M9 12l2 2 4-4"/>`,
  },
  {
    title: "Performance",
    description: "Optimized applications with fast load times, Core Web Vitals improvements, and efficient code that keeps users engaged.",
    icon: `<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>`,
  },
];

export const TECH_STACK = [
  { category: "Frontend", items: ["Flutter", "React", "Next.js"] },
  { category: "Backend",  items: ["Node.js", "Go", "Laravel"] },
  { category: "Database", items: ["PostgreSQL", "Supabase", "Firebase", "Neon", "Turso"] },
  { category: "Infrastructure", items: ["Cloudflare", "Docker"] },
];

export const WHY_KR8 = [
  "Performance-first development",
  "Clean, maintainable code",
  "Transparent communication",
  "Scalable architecture",
  "Modern design systems",
  "Long-term technical support",
];

export const PROCESS = [
  "Discovery",
  "Planning",
  "Design",
  "Development",
  "Testing",
  "Launch",
  "Ongoing Support",
];

export const FAQ = [
  {
    q: "How long does a project take?",
    a: "Most projects run between 4 and 12 weeks, depending on scope. A focused marketing site can ship in 4–6 weeks; a full SaaS platform or custom web app typically takes 8–12. We'll give you a clear timeline after our first call.",
  },
  {
    q: "Do you redesign existing websites?",
    a: "Yes. Whether it's a visual refresh, a performance overhaul, or a full rebuild on better foundations, we work with what you already have. We start with an audit so you know exactly what's working, what isn't, and what's worth keeping.",
  },
  {
    q: "Can you build SaaS applications?",
    a: "Yes — SaaS is part of what we build most. Authentication, dashboards, billing, APIs, and scalable architecture are standard parts of our process, not add-ons. If you have an idea, we can turn it into a product your customers can actually use.",
  },
  {
    q: "What technologies do you use?",
    a: "We use modern, well-supported tools like React, Next.js, Node.js, and Go, paired with reliable data platforms like PostgreSQL, Supabase, and Neon. We choose the stack based on what your project needs — not on what's trendy.",
  },
  {
    q: "Do you offer maintenance and support?",
    a: "Yes. Launch isn't the end. We offer ongoing plans covering updates, performance monitoring, security patches, and feature work as your product grows.",
  },
];

export const ABOUT = {
  title: "Built for ambitious ideas.",
  body: "KR8 Labs is an independent software studio focused on building modern web applications, business platforms, and digital products. We believe software should be fast, intuitive, and built to evolve—not become technical debt after launch.",
};

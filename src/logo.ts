/**
 * KR8 Labs logo — a recreation of the hexagonal "infinity" mark from the brand
 * spec as a self-contained inline SVG (a gradient infinity ribbon set inside a
 * hairline hexagon). `id` keeps the gradient def unique when used more than once.
 */
export function logoMark(id = "kr8", size = 32): string {
  const g = `grad-${id}`;
  return `
  <svg class="logo-mark" width="${size}" height="${size}" viewBox="0 0 48 48"
       fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="${g}" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
        <stop stop-color="#C4B5FD" />
        <stop offset="0.5" stop-color="#8B5CF6" />
        <stop offset="1" stop-color="#6C40FF" />
      </linearGradient>
    </defs>
    <polygon points="24,3 42,13.5 42,34.5 24,45 6,34.5 6,13.5"
             stroke="url(#${g})" stroke-width="1.75" stroke-linejoin="round"
             opacity="0.55" />
    <path d="M24 24 C 20.5 19, 12.5 19, 12.5 24 C 12.5 29, 20.5 29, 24 24
             C 27.5 19, 35.5 19, 35.5 24 C 35.5 29, 27.5 29, 24 24 Z"
          stroke="url(#${g})" stroke-width="3.6" stroke-linecap="round"
          stroke-linejoin="round" />
  </svg>`;
}

/** Full lockup: mark + "KR8 Labs" wordmark. */
export function logoLockup(id = "kr8", size = 30): string {
  return `
  <span class="logo">
    ${logoMark(id, size)}
    <span class="logo-word"><strong>KR8</strong> Labs</span>
  </span>`;
}

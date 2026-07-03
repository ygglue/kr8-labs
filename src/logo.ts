/**
 * KR8 Labs logo — the hexagon-plus-infinity mark from the brand icon,
 * rendered as a self-contained inline SVG with the purple gradient.
 * `id` keeps the gradient def unique when used more than once.
 */
export function logoMark(id = "kr8", size = 30): string {
  const g = `grad-${id}`;
  return `
  <svg class="logo-mark" width="${size}" height="${Math.round(size * 581 / 610)}" viewBox="0 0 610 581"
       fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="${g}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop stop-color="#C4B5FD" />
        <stop offset="0.5" stop-color="#8B5CF6" />
        <stop offset="1" stop-color="#6C40FF" />
      </linearGradient>
    </defs>
    <path d="M26.7262 159.615L138.393 212.01M584.393 160.615L472.726 213.01M282.226 316.615C243.226 352.615 211.835 376.615 163.339 376.615C64.1885 376.615 64.1885 203.615 163.339 203.615C284.568 203.615 328.64 376.615 438.819 376.615C549.016 376.615 549.02 203.627 438.83 203.615M333.214 265.728C366.223 234.118 388.427 203.62 438.83 203.615M438.83 203.615C438.835 203.615 438.839 203.615 438.843 203.615H438.819C438.823 203.615 438.827 203.615 438.83 203.615ZM304.726 27.6152L584.452 158.865V421.365L304.726 552.615L25 421.365V158.865L304.726 27.6152Z"
          stroke="url(#${g})" stroke-width="50" stroke-linecap="round" stroke-linejoin="round" />
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

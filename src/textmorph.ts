const GLITCH_CHARS = "abcdefghijklmnopqrstuvwxyz";

function randomChar(): string {
  return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
}

/**
 * Cycles `el`'s text through `words`, left-aligned. Adapted from Originkit's
 * ScrambleText: each character flickers through random glyphs, then locks
 * to its target character left-to-right, looped instead of a one-shot
 * entrance reveal.
 */
export function initTextMorph(el: HTMLElement, words: string[]): () => void {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion || words.length === 0) {
    el.textContent = words[0] ?? "";
    return () => {};
  }

  const SCRAMBLE = 1.1; // seconds spent decoding into the next word
  const HOLD = 3.2; // seconds a word stays locked before the next scramble
  const TICK = 45; // ms between glyph flickers

  el.style.display = "inline-block";

  const sizer = document.createElement("span");
  sizer.className = "hero-accent-word-sizer";
  sizer.textContent = words.reduce((a, b) => (b.length > a.length ? b : a), "");
  el.appendChild(sizer);

  const display = document.createElement("span");
  display.className = "hero-accent-word-display";
  el.appendChild(display);

  let chars: HTMLSpanElement[] = [];
  let cancelled = false;
  const timeouts: ReturnType<typeof setTimeout>[] = [];

  const after = (ms: number) =>
    new Promise<void>((resolve) => {
      timeouts.push(setTimeout(resolve, ms));
    });

  function setLength(len: number) {
    while (chars.length < len) {
      const span = document.createElement("span");
      span.className = "hero-accent-word-char";
      display.appendChild(span);
      chars.push(span);
    }
    while (chars.length > len) {
      chars.pop()!.remove();
    }
  }

  async function scrambleTo(word: string) {
    setLength(word.length);
    const lockAt = word.split("").map((_, i) => ((i + 1) / word.length) * SCRAMBLE * 1000);
    const start = performance.now();

    while (!cancelled) {
      const elapsed = performance.now() - start;
      let allLocked = true;
      chars.forEach((span, i) => {
        if (elapsed >= lockAt[i]) {
          span.textContent = word[i];
          span.classList.remove("is-scrambling");
        } else {
          span.textContent = randomChar();
          span.classList.add("is-scrambling");
          allLocked = false;
        }
      });
      if (allLocked) break;
      await after(TICK);
    }
  }

  (async () => {
    let idx = 0;
    while (!cancelled) {
      await scrambleTo(words[idx]);
      if (cancelled) return;
      await after(HOLD * 1000);
      idx = (idx + 1) % words.length;
    }
  })();

  return () => {
    cancelled = true;
    timeouts.forEach(clearTimeout);
    el.textContent = "";
  };
}

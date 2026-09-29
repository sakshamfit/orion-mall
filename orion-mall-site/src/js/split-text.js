/**
 * split-text.js — custom SplitText replacement (GSAP's SplitText is a
 * members-only plugin, so we ship our own word/char/line splitter).
 *
 * - splitWords(el)  : wraps each word in <span class="w"><span class="w-in">
 * - splitChars(el)  : wraps each character in <span class="w"><span class="w-in">
 * - splitLines(el)  : groups the split words into line wrappers
 *
 * Re-splitting is safe: call kill() first or just call again (it resets).
 */

function wrapWord(word) {
  const outer = document.createElement('span');
  outer.className = 'w';
  const inner = document.createElement('span');
  inner.className = 'w-in';
  inner.textContent = word;
  outer.appendChild(inner);
  return outer;
}

/** Split an element's text into word wrappers, preserving spaces. */
export function splitWords(el) {
  const text = el.textContent.replace(/\s+/g, ' ').trim();
  el.textContent = '';
  const frag = document.createDocumentFragment();
  const words = text.split(' ');
  words.forEach((word, i) => {
    frag.appendChild(wrapWord(word));
    if (i < words.length - 1) frag.appendChild(document.createTextNode(' '));
  });
  el.appendChild(frag);
  return el.querySelectorAll('.w');
}

/** Split into characters, each in its own overflow-hidden wrapper. */
export function splitChars(el) {
  const text = el.textContent.replace(/\s+/g, ' ').trim();
  el.textContent = '';
  const frag = document.createDocumentFragment();
  for (const ch of text) {
    if (ch === ' ') {
      frag.appendChild(document.createTextNode(' '));
    } else {
      frag.appendChild(wrapWord(ch));
    }
  }
  el.appendChild(frag);
  return el.querySelectorAll('.w');
}

/**
 * Split into lines: first split into words, then group consecutive words
 * whose offsetTop matches into <span class="line"> wrappers.
 */
export function splitLines(el) {
  const words = splitWords(el);
  const lines = [];
  let current = null;
  let currentTop = null;
  words.forEach((w) => {
    const top = Math.round(w.getBoundingClientRect().top);
    if (current === null || Math.abs(top - currentTop) > 2) {
      current = document.createElement('span');
      current.className = 'line';
      current.style.display = 'block';
      current.style.overflow = 'hidden';
      lines.push(current);
      currentTop = top;
    }
    // move the word (and any trailing space text node) into the line wrapper
    current.appendChild(w);
    if (w.nextSibling && w.nextSibling.nodeType === Node.TEXT_NODE) {
      current.appendChild(w.nextSibling);
    }
  });
  el.textContent = '';
  const frag = document.createDocumentFragment();
  lines.forEach((l) => frag.appendChild(l));
  el.appendChild(frag);
  return lines;
}

/** Restore an element to plain text. */
export function unsplit(el) {
  const text = el.textContent.replace(/\s+/g, ' ').trim();
  el.textContent = text;
}

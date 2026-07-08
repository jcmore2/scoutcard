// SVG ids like "cardBg" or "shieldClip" are hardcoded per style, so
// whenever more than one card is on the page at once — the hero showcase
// alongside a generated result card, or even just re-rendering after a
// style switch leaves stale nodes around — duplicate ids make url(#id)
// references resolve to whichever element happens to be first in the
// document, not necessarily the one that defined them. A per-render suffix
// keeps every card's internal references pointing only at its own defs.
let counter = 0;

export function renderId(): number {
  counter += 1;
  return counter;
}

export function getViewportScrollTop() {
  return window.scrollY || document.scrollingElement?.scrollTop || document.documentElement.scrollTop || document.body.scrollTop || 0;
}

export function scrollViewportTo(top: number) {
  const nextTop = Math.max(0, top);

  window.scrollTo({ top: nextTop, left: 0, behavior: 'auto' });

  const scrollElement = document.scrollingElement;
  scrollElement?.scrollTo({ top: nextTop, left: 0, behavior: 'auto' });

  if (scrollElement) {
    scrollElement.scrollTop = nextTop;
    scrollElement.scrollLeft = 0;
  }

  document.documentElement.scrollTop = nextTop;
  document.documentElement.scrollLeft = 0;
  document.body.scrollTop = nextTop;
  document.body.scrollLeft = 0;
}

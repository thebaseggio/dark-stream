import React, { useRef, useState, useEffect, useCallback } from 'react';

const SCROLL_STEP_PX = 600;
const DESKTOP_DRAG_QUERY = '(min-width: 769px)';

const ChevronLeftIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const ChevronRightIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export default function CarouselContainer({ children, className = '' }) {
  const rowRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [enableDragScroll, setEnableDragScroll] = useState(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollStart = useRef(0);
  const hasDragged = useRef(false);

  const updateScrollState = useCallback(() => {
    const container = rowRef.current;
    if (!container) return;

    const { scrollWidth, clientWidth } = container;
    setHasOverflow(scrollWidth > clientWidth + 4);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_DRAG_QUERY);
    const syncDragMode = () => setEnableDragScroll(mediaQuery.matches);

    syncDragMode();
    mediaQuery.addEventListener('change', syncDragMode);
    return () => mediaQuery.removeEventListener('change', syncDragMode);
  }, []);

  useEffect(() => {
    const container = rowRef.current;
    if (!container) return undefined;

    updateScrollState();
    container.addEventListener('scroll', updateScrollState, { passive: true });

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', updateScrollState);
      resizeObserver.disconnect();
    };
  }, [children, updateScrollState]);

  const scrollLeft = () => {
    const container = rowRef.current;
    if (!container) return;

    if (container.scrollLeft <= 0) {
      container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
      return;
    }

    container.scrollBy({ left: -SCROLL_STEP_PX, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const container = rowRef.current;
    if (!container) return;

    const isAtEnd =
      container.scrollLeft + container.clientWidth >= container.scrollWidth - 10;

    if (isAtEnd) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }

    container.scrollBy({ left: SCROLL_STEP_PX, behavior: 'smooth' });
  };

  const resetDragState = () => {
    const container = rowRef.current;
    if (!container) return;
    isDragging.current = false;
    container.style.scrollBehavior = '';
    container.style.cursor = '';
  };

  const handleMouseDown = (event) => {
    if (!enableDragScroll) return;

    const container = rowRef.current;
    if (!container) return;

    isDragging.current = true;
    hasDragged.current = false;
    dragStartX.current = event.pageX;
    scrollStart.current = container.scrollLeft;
    container.style.scrollBehavior = 'auto';
    container.style.cursor = 'grabbing';
  };

  const handleMouseMove = (event) => {
    if (!enableDragScroll || !isDragging.current) return;

    const container = rowRef.current;
    if (!container) return;

    const deltaX = event.pageX - dragStartX.current;
    if (Math.abs(deltaX) > 4) hasDragged.current = true;

    event.preventDefault();
    container.scrollLeft = scrollStart.current - deltaX;
  };

  const suppressClick = (event) => {
    if (hasDragged.current) {
      event.preventDefault();
      event.stopPropagation();
      hasDragged.current = false;
    }
  };

  const arrowBaseClass =
    'absolute top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-zinc-700/80 bg-black/80 text-white opacity-0 shadow-xl transition-all duration-300 hover:border-amber-500 hover:bg-amber-500 hover:text-black group-hover:opacity-100 hidden md:flex';

  return (
    <div className={`CarouselContainer group relative w-full max-w-full min-w-0 overflow-hidden ${className}`}>
      {hasOverflow && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            scrollLeft();
          }}
          className={`${arrowBaseClass} left-2`}
          aria-label="Rolar para a esquerda"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
      )}

      {hasOverflow && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            scrollRight();
          }}
          className={`${arrowBaseClass} right-2`}
          aria-label="Rolar para a direita"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      )}

      <div
        ref={rowRef}
        className="flex w-full min-w-0 touch-pan-x gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth scrollbar-hide transform-gpu [-webkit-overflow-scrolling:touch] [touch-action:pan-x_pan-y] md:cursor-grab"
        onMouseDown={enableDragScroll ? handleMouseDown : undefined}
        onMouseMove={enableDragScroll ? handleMouseMove : undefined}
        onMouseUp={enableDragScroll ? resetDragState : undefined}
        onMouseLeave={enableDragScroll ? resetDragState : undefined}
        onClickCapture={enableDragScroll ? suppressClick : undefined}
      >
        {children}
      </div>
    </div>
  );
}

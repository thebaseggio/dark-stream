import React, { useRef, useState, useEffect, useCallback } from 'react';

const GESTURE_LOCK_PX = 10;
const SCROLL_STEP_PX = 600;

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
  const isDragging = useRef(false);
  const isTouchGesture = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const scrollStart = useRef(0);
  const hasDragged = useRef(false);
  const gestureAxis = useRef(null);

  const updateScrollState = useCallback(() => {
    const container = rowRef.current;
    if (!container) return;

    const { scrollWidth, clientWidth } = container;
    setHasOverflow(scrollWidth > clientWidth + 4);
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
    isTouchGesture.current = false;
    gestureAxis.current = null;
    container.style.scrollBehavior = 'smooth';
    container.style.cursor = 'grab';
  };

  const handlePointerDown = (clientX, clientY, fromTouch = false) => {
    const container = rowRef.current;
    if (!container) return;
    isDragging.current = true;
    isTouchGesture.current = fromTouch;
    hasDragged.current = false;
    gestureAxis.current = null;
    dragStartX.current = clientX;
    dragStartY.current = clientY;
    scrollStart.current = container.scrollLeft;
    container.style.scrollBehavior = 'auto';
    container.style.cursor = 'grabbing';
  };

  const handlePointerMove = (clientX, clientY) => {
    if (!isDragging.current) return false;

    const container = rowRef.current;
    if (!container) return false;

    const deltaX = clientX - dragStartX.current;
    const deltaY = clientY - dragStartY.current;

    if (gestureAxis.current === null) {
      if (Math.abs(deltaX) < GESTURE_LOCK_PX && Math.abs(deltaY) < GESTURE_LOCK_PX) {
        return false;
      }

      if (isTouchGesture.current && Math.abs(deltaY) >= Math.abs(deltaX)) {
        gestureAxis.current = 'vertical';
        resetDragState();
        return false;
      }

      gestureAxis.current = 'horizontal';
    }

    if (gestureAxis.current !== 'horizontal') return false;

    if (Math.abs(deltaX) > 4) hasDragged.current = true;
    container.scrollLeft = scrollStart.current - deltaX;
    return true;
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
        className="flex w-full min-w-0 cursor-grab touch-pan-y gap-4 overflow-x-auto pb-4 scrollbar-hide"
        style={{ touchAction: 'pan-y pinch-zoom' }}
        onMouseDown={(e) => handlePointerDown(e.pageX, e.pageY)}
        onMouseMove={(e) => {
          if (isDragging.current) {
            e.preventDefault();
            handlePointerMove(e.pageX, e.pageY);
          }
        }}
        onMouseUp={resetDragState}
        onMouseLeave={resetDragState}
        onTouchStart={(e) => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY, true)}
        onTouchMove={(e) => {
          const isHorizontal = handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
          if (isHorizontal) e.preventDefault();
        }}
        onTouchEnd={resetDragState}
        onTouchCancel={resetDragState}
        onClickCapture={suppressClick}
      >
        {children}
      </div>
    </div>
  );
}

import React, { useRef, useState, useEffect, useCallback } from 'react';

const GESTURE_LOCK_PX = 10;

export default function CarouselContainer({ children, className = '' }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isDragging = useRef(false);
  const isTouchGesture = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const scrollStart = useRef(0);
  const hasDragged = useRef(false);
  const gestureAxis = useRef(null);

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
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

  const scrollByAmount = (direction) => {
    const container = scrollRef.current;
    if (!container) return;
    const amount = Math.max(container.clientWidth * 0.75, 280);
    container.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const resetDragState = () => {
    const container = scrollRef.current;
    if (!container) return;
    isDragging.current = false;
    isTouchGesture.current = false;
    gestureAxis.current = null;
    container.style.scrollBehavior = 'smooth';
    container.style.cursor = 'grab';
  };

  const handlePointerDown = (clientX, clientY, fromTouch = false) => {
    const container = scrollRef.current;
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

    const container = scrollRef.current;
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

  return (
    <div className={`CarouselContainer relative w-full max-w-full min-w-0 overflow-hidden ${className}`}>
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount('left')}
          className="touch-target absolute left-0 top-1/2 z-20 flex -translate-y-1/2 items-center justify-center border border-dark-border bg-dark-panel/90 p-2 text-white opacity-0 transition-all hover:bg-brand-primary hover:text-dark-pure group-hover/carousel:opacity-100"
          aria-label="Rolar para a esquerda"
        >
          &lt;
        </button>
      )}

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByAmount('right')}
          className="touch-target absolute right-0 top-1/2 z-20 flex -translate-y-1/2 items-center justify-center border border-dark-border bg-dark-panel/90 p-2 text-white opacity-0 transition-all hover:bg-brand-primary hover:text-dark-pure group-hover/carousel:opacity-100"
          aria-label="Rolar para a direita"
        >
          &gt;
        </button>
      )}

      <div
        ref={scrollRef}
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

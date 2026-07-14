import React, { useRef, useState, useEffect, useCallback } from 'react';

export default function CarouselContainer({ children, className = '' }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollStart = useRef(0);
  const hasDragged = useRef(false);

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

  const handlePointerDown = (clientX) => {
    const container = scrollRef.current;
    if (!container) return;
    isDragging.current = true;
    hasDragged.current = false;
    dragStartX.current = clientX;
    scrollStart.current = container.scrollLeft;
    container.style.scrollBehavior = 'auto';
    container.style.cursor = 'grabbing';
  };

  const handlePointerMove = (clientX) => {
    if (!isDragging.current) return;
    const container = scrollRef.current;
    if (!container) return;

    const delta = clientX - dragStartX.current;
    if (Math.abs(delta) > 4) hasDragged.current = true;
    container.scrollLeft = scrollStart.current - delta;
  };

  const handlePointerUp = () => {
    const container = scrollRef.current;
    if (!container) return;
    isDragging.current = false;
    container.style.scrollBehavior = 'smooth';
    container.style.cursor = 'grab';
  };

  const suppressClick = (event) => {
    if (hasDragged.current) {
      event.preventDefault();
      event.stopPropagation();
      hasDragged.current = false;
    }
  };

  return (
    <div className={`group/carousel relative ${className}`}>
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-dark-panel/90 border border-dark-border text-white opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-brand-primary hover:text-dark-pure -translate-x-2"
          aria-label="Rolar para a esquerda"
        >
          &lt;
        </button>
      )}

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByAmount('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-dark-panel/90 border border-dark-border text-white opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-brand-primary hover:text-dark-pure translate-x-2"
          aria-label="Rolar para a direita"
        >
          &gt;
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide cursor-grab select-none touch-pan-x"
        onMouseDown={(e) => handlePointerDown(e.pageX)}
        onMouseMove={(e) => {
          if (isDragging.current) {
            e.preventDefault();
            handlePointerMove(e.pageX);
          }
        }}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
        onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
        onTouchEnd={handlePointerUp}
        onClickCapture={suppressClick}
      >
        {children}
      </div>
    </div>
  );
}

// hooks/useScrollButtons.js
import { useEffect, useRef, useState, useCallback } from 'react';

export function useScrollButtons(deps = []) {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    if (scrollRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = scrollRef.current;
      const atStart = scrollLeft <= 10;
      const atEnd = scrollLeft + clientWidth >= scrollWidth - 10;
      setShowLeft(!atStart);
      setShowRight(!atEnd);
    }
  }, []);

  const scroll = useCallback((direction) => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    const refCurrent = scrollRef.current;
    if (!refCurrent) return;

    updateScrollButtons();
    refCurrent.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      refCurrent.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { scrollRef, showLeft, showRight, scroll };
}
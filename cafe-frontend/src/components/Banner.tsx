import { useEffect, useRef, useState } from "react";
import PageContainer from "./PageContainer";
import { ChevronLeft, ChevronRight } from "lucide-react";

const originalSlides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
    alt: "Delicious Pizza",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=1200&q=80",
    alt: "Gourmet Burger",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80",
    alt: "Fresh Pasta",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=1200&q=80",
    alt: "Breakfast Spread",
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
    alt: "Healthy Salad",
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=1200&q=80",
    alt: "Sushi Platter",
  },
];

const slides = [
  originalSlides[originalSlides.length - 1],
  ...originalSlides,
  originalSlides[0],
];

export default function Banner() {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startX = useRef<number | null>(null);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetAutoScroll = () => {
    if (autoTimer.current) clearInterval(autoTimer.current);
    autoTimer.current = setInterval(() => {
      goToSlide(currentIndex + 1);
    }, 6000);
  };

  useEffect(() => {
    resetAutoScroll();
    return () => clearInterval(autoTimer.current!);
  }, []);

  useEffect(() => {
    resetAutoScroll();
  }, [currentIndex]);

  const goToSlide = (index: number) => {
    if (isTransitioning) return;
    setTransitionEnabled(true);
    setIsTransitioning(true);
    setCurrentIndex(index);
  };

  const nextSlide = () => goToSlide(currentIndex + 1);
  const prevSlide = () => goToSlide(currentIndex - 1);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isTransitioning) return;
    startX.current = e.clientX;
    setIsDragging(true);
    setTransitionEnabled(false);
    clearInterval(autoTimer.current!);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || startX.current === null) return;
    const diff = e.clientX - startX.current;
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = 100;

    if (dragOffset > threshold) {
      prevSlide();
    } else if (dragOffset < -threshold) {
      nextSlide();
    } else {
      setTransitionEnabled(true);
    }

    setDragOffset(0);
    startX.current = null;
  };

  const handleMouseLeave = () => {
    if (isDragging) handleMouseUp();
  };

  const handleTransitionEnd = () => {
    setIsTransitioning(false);
    if (currentIndex === 0) {
      setTransitionEnabled(false);
      setCurrentIndex(slides.length - 2);
    } else if (currentIndex === slides.length - 1) {
      setTransitionEnabled(false);
      setCurrentIndex(1);
    }
  };

  const slideStyle = {
    transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
    transition: transitionEnabled ? "transform 0.3s ease" : "none",
  };

  return (
    <PageContainer>
      <div
        className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden rounded-2xl select-none cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="w-full h-full flex"
          style={slideStyle}
          onTransitionEnd={handleTransitionEnd}
        >
          {slides.map((slide, i) => (
            <img
              key={i}
              src={slide.image}
              alt={slide.alt}
              className="w-full h-full object-cover object-center flex-shrink-0 pointer-events-none"
              draggable={false}
            />
          ))}
        </div>

        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 z-10"
          disabled={isTransitioning}
        >
          <ChevronLeft />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 z-10"
          disabled={isTransitioning}
        >
          <ChevronRight />
        </button>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {originalSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => !isTransitioning && goToSlide(index + 1)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index + 1 === currentIndex ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}

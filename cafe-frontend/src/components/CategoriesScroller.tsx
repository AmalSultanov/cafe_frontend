import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from '../services/apiService';
import PageContainer from "./PageContainer";

interface MealCategory {
  id: number;
  name: string;
  created_at: string;
}

interface CategoriesResponse {
  total: number;
  page: number;
  total_pages: number;
  items: MealCategory[];
}

type CategoriesScrollerProps = {
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onCategorySelect: (categoryId: number) => void;
};

export default function CategoriesScroller({ scrollRef: externalRef, onCategorySelect }: CategoriesScrollerProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalRef ?? internalRef;
  const [categories, setCategories] = useState<MealCategory[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get<CategoriesResponse>(
          "/meal-categories?page=1&per_page=50"
        );
        setCategories(response.data.items ?? []);
      } catch (err: any) {
        console.error("Failed to fetch categories:", err);
        setError("Failed to load categories.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const updateScrollButtons = () => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    const maxScrollLeft = scrollEl.scrollWidth - scrollEl.clientWidth;
    setAtStart(scrollEl.scrollLeft <= 0);
    setAtEnd(scrollEl.scrollLeft >= maxScrollLeft - 1);
  };

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollAmount = direction === "left" ? -200 : 200;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });

    setTimeout(updateScrollButtons, 300);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
    updateScrollButtons();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScroll = () => updateScrollButtons();

  return (
    <div className="bg-white py-6 select-none">
      <PageContainer>
        <div className="relative">
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white shadow rounded-full disabled:opacity-30"
            onClick={() => scroll("left")}
            disabled={atStart}
            aria-label="Scroll left"
          >
            <ChevronLeft />
          </button>

          <div
            ref={scrollRef}
            className="flex overflow-x-auto gap-2 scrollbar-hide scroll-smooth cursor-grab active:cursor-grabbing px-12"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onScroll={handleScroll}
          >
            {loading ? (
              <div className="text-gray-500">Loading categories...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : categories.length === 0 ? (
              <div className="text-gray-400">No categories found.</div>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => onCategorySelect?.(cat.id)}
                  className="flex-shrink-0 px-3 py-3 text-md font-semibold text-gray-800 whitespace-nowrap cursor-pointer transition-all duration-200 rounded-lg hover:bg-yellow-100 hover:shadow"
                >
                  {cat.name}
                </div>
              ))
            )}
          </div>

          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white shadow rounded-full disabled:opacity-30"
            onClick={() => scroll("right")}
            disabled={atEnd}
            aria-label="Scroll right"
          >
            <ChevronRight />
          </button>
        </div>
      </PageContainer>
    </div>
  );
}

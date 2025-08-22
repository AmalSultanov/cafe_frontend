import { useEffect, useRef } from "react";
import Banner from "../components/Banner.tsx";
import CategoriesScroller from "../components/CategoriesScroller.tsx";
import MealsByCategory from "../components/MealsByCategory.tsx";

export default function Home() {
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    categoriesScrollRef.current?.scrollTo({ left: 0 });
  }, []);

  useEffect(() => {
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.substring(1));
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, []);

  const handleCategorySelect = (categoryId: number) => {
    const section = document.getElementById(`category-${categoryId}`);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  
  return (
    <div className="space-y-0">
      <Banner />
      <CategoriesScroller
        scrollRef={categoriesScrollRef}
        onCategorySelect={handleCategorySelect}
      />
      <MealsByCategory />
    </div>
  );
}

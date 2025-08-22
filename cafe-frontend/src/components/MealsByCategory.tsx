import { useEffect, useState } from "react";
import { api } from '../services/apiService';
import { Plus, Minus, Loader } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import RegistrationModal from "./RegistrationModal";
import { Link } from "react-router-dom";

type Meal = {
  id: number;
  name: string;
  description: string;
  unit_price: string;
  image_url: string;
};

type Category = {
  id: number;
  name: string;
};

type CategoryWithMeals = {
  id: number;
  name: string;
  meals: Meal[];
};

interface CartItem {
  id: number;
  meal_id: number;
  quantity: number;
  created_at: string;
}

export default function MealsByCategory() {
  const { user, isAuthenticated } = useAuth();
  const [categoriesWithMeals, setCategoriesWithMeals] = useState<CategoryWithMeals[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<{ cartItemId: number; mealName: string } | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const catRes = await api.get("/meal-categories?page=1&per_page=50");
        const categories: Category[] = catRes.data.items;

        const withMeals = await Promise.all(
          categories.map(async (cat) => {
            const mealsRes = await api.get(`/meal-categories/${cat.id}/meals`);
            return {
              id: cat.id,
              name: cat.name,
              meals: mealsRes.data.items,
            };
          })
        );

        setCategoriesWithMeals(withMeals);
      } catch (error) {
        console.error("Error loading meals by category:", error);
      }
    };

    fetchAll();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCartItems();
    } else {
      setCartItems([]);
    }
  }, [isAuthenticated, user]);

  const fetchCartItems = async () => {
    if (!user) return;

    try {
      const response = await api.get(`/users/${user.id}/cart/items`);

      const sortedItems = response.data.sort((a: CartItem, b: CartItem) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setCartItems(sortedItems);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error("Error fetching cart items:", error);
      }

      setCartItems([]);
    }
  };

  const addToCart = async (mealId: number) => {
    if (!isAuthenticated || !user) {
      setShowRegistrationModal(true);
      return;
    }

    try {
      setLoadingItems(prev => new Set(prev).add(mealId));

      await api.post(`/users/${user.id}/cart/items`, { meal_id: mealId, quantity: 1 });

      await fetchCartItems();

      window.dispatchEvent(new CustomEvent('cartUpdated'));

      const meal = categoriesWithMeals
        .flatMap(cat => cat.meals)
        .find(meal => meal.id === mealId);

      toast.success(`${meal?.name || 'Item'} was added to cart!`);
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      const message = error.response?.data?.detail || "Failed to add item to cart";
      toast.error(message);
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(mealId);
        return newSet;
      });
    }
  };

  const updateCartItemQuantity = async (cartItemId: number, newQuantity: number) => {
    if (!user || newQuantity < 0) return;

    if (newQuantity === 0) {
      const cartItem = cartItems.find(item => item.id === cartItemId);
      if (cartItem) {
        const meal = categoriesWithMeals
          .flatMap(cat => cat.meals)
          .find(meal => meal.id === cartItem.meal_id);

        setItemToRemove({
          cartItemId,
          mealName: meal?.name || 'Unknown item'
        });
      }
      return;
    }

    try {
      const mealId = cartItems.find(item => item.id === cartItemId)?.meal_id;
      if (mealId) {
        setLoadingItems(prev => new Set(prev).add(mealId));
      }

      await api.patch(`/users/${user.id}/cart/items/${cartItemId}`, { quantity: newQuantity });

      await fetchCartItems();

      window.dispatchEvent(new CustomEvent('cartUpdated'));

      const meal = categoriesWithMeals
        .flatMap(cat => cat.meals)
        .find(meal => meal.id === cartItems.find(item => item.id === cartItemId)?.meal_id);

      toast.success(`${meal?.name || 'Item'} quantity was updated!`);
    } catch (error: any) {
      console.error("Error updating cart item:", error);
      const message = error.response?.data?.detail || "Failed to update cart item";
      toast.error(message);
    } finally {
      const mealId = cartItems.find(item => item.id === cartItemId)?.meal_id;
      if (mealId) {
        setLoadingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(mealId);
          return newSet;
        });
      }
    }
  };

  const confirmRemoveItem = async () => {
    if (!itemToRemove || !user) return;

    try {
      const mealId = cartItems.find(item => item.id === itemToRemove.cartItemId)?.meal_id;
      if (mealId) {
        setLoadingItems(prev => new Set(prev).add(mealId));
      }

      await api.patch(`/users/${user.id}/cart/items/${itemToRemove.cartItemId}`, { quantity: 0 });

      await fetchCartItems();

      window.dispatchEvent(new CustomEvent('cartUpdated'));

      toast.success(`${itemToRemove.mealName} was removed from cart`);
    } catch (error: any) {
      console.error("Error removing cart item:", error);
      const message = error.response?.data?.detail || "Failed to remove item from cart";
      toast.error(message);
    } finally {
      const mealId = cartItems.find(item => item.id === itemToRemove.cartItemId)?.meal_id;
      if (mealId) {
        setLoadingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(mealId);
          return newSet;
        });
      }
      setItemToRemove(null);
    }
  };

  const getCartItemForMeal = (mealId: number): CartItem | undefined => {
    return cartItems.find(item => item.meal_id === mealId);
  };

  useEffect(() => {
    if (categoriesWithMeals.length > 0 && window.location.hash) {
      const el = document.getElementById(window.location.hash.substring(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [categoriesWithMeals]);

  return (
    <div className="space-y-10 px-4">
      {categoriesWithMeals.map((category) => (
        <section key={category.id} id={`category-${category.id}`} className="space-y-4 scroll-mt-20">
          <h2 className="text-2xl font-bold">{category.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {category.meals.map((meal) => (
              <div key={meal.id} className="rounded-2xl shadow bg-white p-3 flex flex-col">
                <Link to={`/meal-categories/${category.id}/meals/${meal.id}`}>
                  <img
                    src={meal.image_url}
                    alt={meal.name}
                    className="w-full h-40 object-cover rounded-xl"
                  />
                  <div className="mt-2 flex-grow space-y-1">
                    <h3 className="text-lg font-semibold">{meal.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{meal.description}</p>
                  </div>
                </Link>
                <div className="text-base font-bold text-orange-500 mt-2 flex items-center justify-between">
                  <span>{Number(meal.unit_price).toLocaleString("fr-FR").replace(/\u00A0/g, " ")} UZS</span>
                  {(() => {
                    const cartItem = getCartItemForMeal(meal.id);
                    const isLoading = loadingItems.has(meal.id);

                    if (cartItem) {
                      return (
                        <div className="flex items-center space-x-2 ml-2">
                          <button
                            onClick={() => updateCartItemQuantity(cartItem.id, cartItem.quantity - 1)}
                            className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition disabled:opacity-50"
                            disabled={isLoading}
                          >
                            <Minus size={14} className="text-gray-600" />
                          </button>
                          <span className="min-w-[24px] text-center font-medium text-gray-900">
                            {isLoading ? (
                              <Loader className="animate-spin mx-auto" size={14} />
                            ) : (
                              cartItem.quantity
                            )}
                          </span>
                          <button
                            onClick={() => updateCartItemQuantity(cartItem.id, cartItem.quantity + 1)}
                            className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition disabled:opacity-50"
                            disabled={isLoading}
                          >
                            <Plus size={14} className="text-gray-600" />
                          </button>
                        </div>
                      );
                    } else {
                      return (
                        <button
                          onClick={() => addToCart(meal.id)}
                          className="ml-2 px-3 py-1 rounded-lg bg-orange-500 text-white text-sm hover:bg-orange-600 transition disabled:opacity-50"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader className="animate-spin mx-auto" size={14} />
                          ) : (
                            "Add"
                          )}
                        </button>
                      );
                    }
                  })()}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <RegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
      />

      {itemToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setItemToRemove(null)}
          />

          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Remove Item from Cart?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove "{itemToRemove.mealName}" from your cart?
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setItemToRemove(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveItem}
                className="flex-1 px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

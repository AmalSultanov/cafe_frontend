import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/apiService";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { Plus, Minus, Loader } from "lucide-react";
import RegistrationModal from "../components/RegistrationModal";

interface Meal {
  id: number;
  image_url: string;
  name: string;
  description: string;
  unit_price: string;
  category_id: number;
}

interface Category {
  id: number;
  name: string;
}

interface CartItem {
  id: number;
  meal_id: number;
  quantity: number;
  created_at: string;
}

export default function MealDetail() {
  const { categoryId, mealId } = useParams<{ categoryId: string; mealId: string }>();
  const { user, isAuthenticated } = useAuth();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartItem, setCartItem] = useState<CartItem | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    async function fetchMealAndCategory() {
      try {
        const mealRes = await api.get(`/meal-categories/${categoryId}/meals/${mealId}`);
        setMeal(mealRes.data);
        const catRes = await api.get(`/meal-categories/${categoryId}`);
        setCategory(catRes.data);
      } catch (error) {
        setMeal(null);
        setCategory(null);
      } finally {
        setLoading(false);
      }
    }
    fetchMealAndCategory();
  }, [categoryId, mealId]);

  useEffect(() => {
    if (isAuthenticated && user && meal) {
      fetchCartItem();
    } else {
      setCartItem(null);
    }
  }, [isAuthenticated, user, meal]);

  const fetchCartItem = async () => {
    if (!user || !meal) return;
    try {
      setCartLoading(true);
      const response = await api.get(`/users/${user.id}/cart/items`);
      const found = response.data.find((item: CartItem) => item.meal_id === meal.id);
      setCartItem(found || null);
    } catch {
      setCartItem(null);
    } finally {
      setCartLoading(false);
    }
  };

  const addToCart = async () => {
    if (!isAuthenticated || !user) {
      setShowRegistrationModal(true);
      return;
    }
    try {
      setCartLoading(true);
      await api.post(`/users/${user.id}/cart/items`, { meal_id: meal?.id, quantity: 1 });
      await fetchCartItem();
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      toast.success(`${meal?.name || 'Item'} was added to cart!`);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to add item to cart");
    } finally {
      setCartLoading(false);
    }
  };

  const updateCartItemQuantity = async (newQuantity: number) => {
    if (!user || !cartItem) return;
    if (newQuantity < 1) {
      setShowDeleteModal(true);
      return;
    }
    try {
      setCartLoading(true);
      await api.patch(`/users/${user.id}/cart/items/${cartItem.id}`, { quantity: newQuantity });
      await fetchCartItem();
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      toast.success(`${meal?.name || 'Item'} quantity was updated!`);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to update cart item");
    } finally {
      setCartLoading(false);
    }
  };

  const confirmRemoveItem = async () => {
    if (!cartItem || !user) return;
    try {
      setCartLoading(true);
      await api.patch(`/users/${user.id}/cart/items/${cartItem.id}`, { quantity: 0 });
      await fetchCartItem();
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      toast.success(`${meal?.name || 'Item'} was removed from cart`);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to remove item from cart");
    } finally {
      setCartLoading(false);
      setShowDeleteModal(false);
    }
  };

  const getTotalPrice = () => {
    if (!meal) return 0;
    const quantity = cartItem ? cartItem.quantity : 1;
    return Number(meal.unit_price) * quantity;
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!meal) return <div className="text-center py-10 text-red-500">Meal not found.</div>;

  return (
    <div className="container mx-auto px-4 flex flex-col">
      <div className="w-full mb-7">
        <nav className="text-sm text-gray-500 flex items-center space-x-2">
          <Link to="/" className="hover:underline text-orange-500">Home</Link>
          <span>/</span>
          {category ? (
            <>
              <a
                href={`/#category-${category.id}`}
                className="hover:underline text-orange-500"
              >
                {category.name}
              </a>
              <span>/</span>
            </>
          ) : (
            <>
              <span>Category</span>
              <span>/</span>
            </>
          )}
          <span className="text-gray-700 font-medium">{meal.name}</span>
        </nav>
      </div>
      <div className="flex flex-col md:flex-row gap-10">
        <div className="md:w-1/2 w-full flex justify-center items-start">
          <img
            src={meal.image_url}
            alt={meal.name}
            className="rounded-xl object-cover w-full max-w-2xl max-h-[600px]"
          />
        </div>
        <div className="md:w-1/2 w-full flex flex-col justify-start">
          <h1 className="text-4xl font-bold mb-4">{meal.name}</h1>
          <div className="text-lg text-gray-700 mb-6">{meal.description}</div>
          <div className="text-2xl font-bold text-orange-500 mb-2">
            {Number(meal.unit_price).toLocaleString("fr-FR").replace(/\u00A0/g, " ")} UZS
          </div>
          <div className="text-lg font-semibold text-gray-700 mb-8">
            Total: {getTotalPrice().toLocaleString("fr-FR").replace(/\u00A0/g, " ")} UZS
          </div>
          <div>
            {cartItem ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    if (cartItem.quantity === 1) {
                      setShowDeleteModal(true);
                    } else {
                      updateCartItemQuantity(cartItem.quantity - 1);
                    }
                  }}
                  className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition disabled:opacity-50"
                  disabled={cartLoading}
                >
                  <Minus size={18} className="text-gray-600" />
                </button>
                <span className="min-w-[32px] text-center font-medium text-gray-900 text-lg">
                  {cartLoading ? <Loader className="animate-spin mx-auto" size={18} /> : cartItem.quantity}
                </span>
                <button
                  onClick={() => updateCartItemQuantity(cartItem.quantity + 1)}
                  className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition disabled:opacity-50"
                  disabled={cartLoading}
                >
                  <Plus size={18} className="text-gray-600" />
                </button>
              </div>
            ) : (
              <button
                onClick={addToCart}
                className="px-6 py-3 rounded-lg bg-orange-500 text-white text-lg font-semibold hover:bg-orange-600 transition disabled:opacity-60"
                disabled={cartLoading}
              >
                {cartLoading ? <Loader className="animate-spin mx-auto inline" size={18} /> : "Add to Cart"}
              </button>
            )}
          </div>
        </div>
      </div>
      <RegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
      />
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Remove Item from Cart?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove "{meal.name}" from your cart?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveItem}
                className="flex-1 px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-colors"
                disabled={cartLoading}
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
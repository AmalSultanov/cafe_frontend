import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Plus, Minus, Trash2, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/apiService';
import toast from 'react-hot-toast';
import CheckoutModal from '../components/CheckoutModal';

interface CartItem {
  id: number;
  meal_id: number;
  meal_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  created_at: string;
}

const Cart: React.FC = () => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [itemToRemove, setItemToRemove] = useState<{ itemId: number; mealName: string } | null>(null);
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCartData();
    }
  }, [user]);

  const fetchCartData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const itemsResponse = await api.get(`/users/${user.id}/cart/items`);

      const sortedItems = itemsResponse.data.sort((a: CartItem, b: CartItem) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setCartItems(sortedItems);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setCartItems([]);
      } else {
        console.error('Error fetching cart data:', error);
        toast.error('Failed to load cart data');
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmRemoveItem = async () => {
    if (!itemToRemove || !user) return;

    try {
      setUpdating(itemToRemove.itemId);

      await api.patch(`/users/${user.id}/cart/items/${itemToRemove.itemId}`, { quantity: 0 });

      await fetchCartData();

      window.dispatchEvent(new CustomEvent('cartUpdated'));

      toast.success(`${itemToRemove.mealName} was removed from cart`);
    } catch (error: any) {
      console.error('Error removing cart item:', error);
      const message = error.response?.data?.detail || 'Failed to remove item from cart';
      toast.error(message);
    } finally {
      setUpdating(null);
      setItemToRemove(null);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to view your cart.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-yellow-600" size={48} />
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  const total = cartItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0);

  const handleQuantityChange = async (itemId: number, change: number) => {
    if (!user) return;

    const item = cartItems.find(item => item.id === itemId);
    if (!item) return;

    const newQuantity = item.quantity + change;
    if (newQuantity < 1) return;

    try {
      setUpdating(itemId);

      await api.patch(`/users/${user.id}/cart/items/${itemId}`, { quantity: newQuantity });

      await fetchCartData();

      window.dispatchEvent(new CustomEvent('cartUpdated'));

      const item = cartItems.find(item => item.id === itemId);
      toast.success(`${item?.meal_name || 'Item'} quantity updated to ${newQuantity}`);
    } catch (error: any) {
      console.error('Error updating cart item:', error);
      const message = error.response?.data?.detail || 'Failed to update cart item';
      toast.error(message);
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = (itemId: number) => {
    const item = cartItems.find(item => item.id === itemId);
    if (item) {
      setItemToRemove({
        itemId,
        mealName: item.meal_name
      });
    }
  };

  const handleClearCart = () => {
    if (!user) return;
    setShowClearCartModal(true);
  };

  const confirmClearCart = async () => {
    if (!user) return;

    try {
      setLoading(true);

      await api.delete(`/users/${user.id}/cart/items`);

      await fetchCartData();

      window.dispatchEvent(new CustomEvent('cartUpdated'));
      toast.success(`Cart was cleared!`);
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      const message = error.response?.data?.detail || 'Failed to clear cart';
      toast.error(message);
    } finally {
      setLoading(false);
      setShowClearCartModal(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full mr-4">
              <ShoppingCart className="text-yellow-600" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="text-gray-600">{cartItems.length} item(s) in your cart</p>
            </div>
          </div>
        </div>

        {cartItems.length > 0 && (
          <button
            onClick={handleClearCart}
            className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium transition-colors"
            disabled={loading}
          >
            Clear Cart
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <ShoppingCart className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No items in your cart yet</h3>
          <p className="text-gray-600 mb-4">Add some delicious items to get started!</p>
          <Link
            to="/"
            className="inline-block px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-4">
                  {/* Item Image */}
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-2xl">🍽️</div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{item.meal_name}</h3>
                    <p className="text-gray-600 text-sm">Meal ID: {item.meal_id}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-yellow-600 font-bold">{Number(item.unit_price).toLocaleString("fr-FR").replace(/\u00A0/g, " ")} UZS</p>
                      <p className="text-gray-900 font-bold">{Number(item.total_price).toLocaleString("fr-FR").replace(/\u00A0/g, " ")} UZS total</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                      disabled={item.quantity <= 1 || updating === item.id}
                    >
                      <Minus size={16} className={item.quantity <= 1 ? 'text-gray-300' : 'text-gray-600'} />
                    </button>
                    <span className="w-8 text-center font-medium">
                      {updating === item.id ? (
                        <Loader className="animate-spin mx-auto" size={16} />
                      ) : (
                        item.quantity
                      )}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                      disabled={updating === item.id}
                    >
                      <Plus size={16} className="text-gray-600" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                    disabled={updating === item.id}
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{total.toLocaleString("fr-FR").replace(/\u00A0/g, " ")} UZS</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{total.toLocaleString("fr-FR").replace(/\u00A0/g, " ")} UZS</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowCheckoutModal(true)}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors mb-3"
              >
                Proceed to Checkout
              </button>
              
              <Link
                to="/"
                className="block w-full text-center text-yellow-600 hover:text-yellow-700 font-medium py-2"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}

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

      {showClearCartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowClearCartModal(false)}
          />

          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Clear Entire Cart?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove all {cartItems.length} items from your cart? This action cannot be undone.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearCartModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearCart}
                className="flex-1 px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}

      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        cartItems={cartItems}
        totalAmount={total}
      />
    </div>
  );
};

export default Cart;

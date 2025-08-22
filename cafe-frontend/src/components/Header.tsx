import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, User, LogOut, UserCircle, Package, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from '../contexts/AuthContext';
import RegistrationModal from './RegistrationModal';
import { api } from '../services/apiService';

const Header = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCartItemCount();
    } else {
      setCartItemCount(0);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const handleCartUpdate = () => {
      if (isAuthenticated && user) {
        fetchCartItemCount();
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [isAuthenticated, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isUserDropdownOpen && !target.closest('.user-dropdown-container')) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserDropdownOpen]);

  const fetchCartItemCount = async () => {
    if (!user) return;

    try {
      const response = await api.get(`/users/${user.id}/cart/items`);
      setCartItemCount(response.data.length);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error("Error fetching cart items:", error);
      }
      setCartItemCount(0);
    }
  };

  const handleUserIconClick = () => {
    if (isAuthenticated) {
      setIsUserDropdownOpen(!isUserDropdownOpen);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsUserDropdownOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
      setIsUserDropdownOpen(false);
    }
  };

  const handleCartClick = () => {
    if (isAuthenticated) {

    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <header className="fixed w-full z-50 bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-yellow-600">
          Café
        </Link>

        <div className="flex items-center gap-4 text-gray-700 text-xl">
          <div className="relative user-dropdown-container">
            <div
              className="flex items-center cursor-pointer hover:text-yellow-600"
              onClick={handleUserIconClick}
            >
              <User size={24} />
              {isAuthenticated && <ChevronDown size={16} className="ml-1" />}
            </div>

            <AnimatePresence>
              {isAuthenticated && isUserDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name} {user?.surname}
                    </p>
                    <p className="text-xs text-gray-500">+{user?.phone_number}</p>
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      console.log('Profile clicked');
                      setIsUserDropdownOpen(false);
                    }}
                  >
                    <UserCircle size={16} className="mr-2" />
                    Profile
                  </Link>

                  <Link
                    to="/orders"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      console.log('Orders clicked');
                      setIsUserDropdownOpen(false);
                    }}
                  >
                    <Package size={16} className="mr-2" />
                    My Orders
                  </Link>

                  <button
                    onClick={() => {
                      console.log('Logout clicked');
                      handleLogout();
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50 cursor-pointer"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            {isAuthenticated ? (
              <Link to="/cart">
                <ShoppingCart className="cursor-pointer hover:text-yellow-600" size={24} />
              </Link>
            ) : (
              <ShoppingCart
                className="cursor-pointer hover:text-yellow-600"
                size={24}
                onClick={handleCartClick}
              />
            )}

            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {isUserDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserDropdownOpen(false)}
        />
      )}

      <RegistrationModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
};

export default Header;

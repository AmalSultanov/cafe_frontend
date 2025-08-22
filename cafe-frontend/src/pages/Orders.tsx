import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Package, Clock, CheckCircle, XCircle, MapPin, Phone, CreditCard } from 'lucide-react';
import { api } from '../services/apiService';
import toast from 'react-hot-toast';

interface OrderItem {
  id: number;
  meal_id: number;
  order_id: number;
  meal_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  created_at: string;
}

interface Order {
  id: number;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  house_number: string;
  entrance_number?: string;
  level?: string;
  apartment_number?: string;
  delivery_notes?: string;
  phone_number?: string;
  total_price: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_status: string;
  payment_method: string;
  scheduled_time?: string;
  delivered_at?: string;
  created_at: string;
  items: OrderItem[];
}

const Orders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const formatPrice = (priceString: string | number | null | undefined): string => {
    if (priceString === null || priceString === undefined || priceString === '') {
      return '0';
    }

    const priceStr = priceString.toString();

    const cleanPrice = priceStr.replace(/[^\d.-]/g, '');
    const price = parseFloat(cleanPrice);

    if (isNaN(price)) {
      return priceStr || '0';
    }

    return price.toLocaleString("fr-FR").replace(/\u00A0/g, " ");
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await api.get(`/users/${user?.id}/orders`);
      setOrders(response.data);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in again');
      } else {
        toast.error('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openInMaps = (lat: number, lng: number) => {
    const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(googleMapsUrl, '_blank');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Please log in</h3>
          <p className="mt-1 text-sm text-gray-500">
            You need to be logged in to view your orders.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="mt-2 text-gray-600">Track your order history and status</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">Start by adding some delicious meals to your cart!</p>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
            >
              Browse Menu
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {formatPrice(order.total_price)} UZS
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center">
                            <span className="text-gray-700">
                              {item.quantity}x {item.meal_name}
                            </span>
                            <span className="font-medium">
                              {formatPrice(item.total_price)} UZS
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Delivery Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-gray-700">{order.delivery_address}</p>
                            <p className="text-gray-600">
                              House: {order.house_number}
                              {order.entrance_number && `, Entrance: ${order.entrance_number}`}
                              {order.level && `, Floor: ${order.level}`}
                              {order.apartment_number && `, Apt: ${order.apartment_number}`}
                            </p>
                            <button
                              onClick={() => openInMaps(order.delivery_latitude, order.delivery_longitude)}
                              className="text-blue-600 hover:text-blue-800 text-xs mt-1"
                            >
                              📍 Open in Maps
                            </button>
                          </div>
                        </div>

                        {order.phone_number && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">{order.phone_number}</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700 capitalize">{order.payment_method}</span>
                        </div>

                        {order.delivery_notes && (
                          <div className="mt-2">
                            <p className="text-gray-600 text-xs">
                              <strong>Notes:</strong> {order.delivery_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/apiService';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[];
  totalAmount: number;
}

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  totalAmount
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [map, setMap] = useState<any | null>(null);
  const [marker, setMarker] = useState<any | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [houseNumber, setHouseNumber] = useState('');
  const [entranceNumber, setEntranceNumber] = useState('');
  const [level, setLevel] = useState('');
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'payme' | 'click'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const currentMarkerRef = useRef<any | null>(null);

  useEffect(() => {
    if (isOpen && mapRef.current && !map) {
      console.log('Checking for Leaflet...');

      if (!(window as any).L) {
        console.error('Leaflet not loaded');
        return;
      }

      console.log('Initializing map...');

      const leafletMap = (window as any).L.map(mapRef.current, {
        center: [41.2995, 69.2401],
        zoom: 12,
        zoomControl: true
      });

      (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(leafletMap);

      setMap(leafletMap);

      leafletMap.on('click', (e: any) => {
        console.log('Map clicked at:', e.latlng);
        const { lat, lng } = e.latlng;
        handleMapClickWithMap(leafletMap, lat, lng);
      });

      console.log('Map initialized successfully');
    }
  }, [isOpen, map]);

  useEffect(() => {
    if (!isOpen && map) {
      map.remove();
      setMap(null);
      setMarker(null);
      currentMarkerRef.current = null;
      setSelectedLocation(null);
      setAddress('');
      setSuggestions([]);
    }
  }, [isOpen, map]);



  const handleMapClickWithMap = async (mapInstance: any, lat: number, lng: number) => {
    console.log('handleMapClickWithMap called with:', lat, lng);

    setSelectedLocation({ lat, lng });

    const existingMarker = marker || currentMarkerRef.current;
    if (existingMarker) {
      console.log('Removing existing marker before adding new one');
      try {
        mapInstance.removeLayer(existingMarker);
        setMarker(null);
        currentMarkerRef.current = null;
        console.log('Previous marker removed successfully');
      } catch (error) {
        console.error('Error removing previous marker:', error);
    
        setMarker(null);
        currentMarkerRef.current = null;
      }
    }

    const newMarker = (window as any).L.marker([lat, lng], {
      title: 'Delivery Location - Click to remove'
    }).addTo(mapInstance);

    newMarker.on('click', (e: any) => {
      e.originalEvent?.stopPropagation();
      console.log('Marker clicked - removing');

      try {
        mapInstance.removeLayer(newMarker);
        console.log('Clicked marker removed from map');
        setMarker(null);
        currentMarkerRef.current = null;
        setSelectedLocation(null);
        setAddress('');
        console.log('Selection cleared after marker removal');
      } catch (error) {
        console.error('Error removing clicked marker:', error);

        setMarker(null);
        currentMarkerRef.current = null;
        setSelectedLocation(null);
        setAddress('');
      }
    });

    newMarker.bindPopup('📍 Your delivery location<br><small>Click marker to remove</small>').openPopup();
    setMarker(newMarker);
    currentMarkerRef.current = newMarker;
    console.log('Marker added successfully with click-to-remove');

    try {
      console.log('Starting reverse geocoding...');
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      console.log('Reverse geocoding result:', data);
      if (data && data.display_name) {
        setAddress(data.display_name);
        console.log('Address set to:', data.display_name);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.length <= 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('Searching for:', value);

        const searches = [
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=3&addressdetails=1`,

          /\d/.test(value) ?
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value.replace(/\d+/g, '').trim())}&limit=3&addressdetails=1` : null,

          value.includes(' ') ?
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value.split(/[,\d]/)[0].trim())}&limit=3&addressdetails=1` : null,

          !value.toLowerCase().includes('tashkent') ?
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value + ' Tashkent')}&limit=3&addressdetails=1` : null,

          /\d/.test(value) && !value.toLowerCase().includes('tashkent') ?
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value.replace(/\d+/g, '').trim() + ' Tashkent')}&limit=3&addressdetails=1` : null,

          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&viewbox=69.1,41.4,69.4,41.2&bounded=1&limit=3&addressdetails=1`
        ].filter(Boolean);

        let allResults: AddressSuggestion[] = [];

        for (const searchUrl of searches) {
          try {
            const response = await fetch(searchUrl!);
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              console.log(`Search strategy found ${data.length} results:`, searchUrl);
              allResults = [...allResults, ...data];
            }
          } catch (err) {
            console.log('Search failed for:', searchUrl);
          }
        }

        const uniqueResults = allResults.filter((item, index, self) =>
          index === self.findIndex(t => t.place_id === item.place_id)
        );

        if (uniqueResults.length > 0) {
          console.log('Search results:', uniqueResults.length);
          setSuggestions(uniqueResults.slice(0, 8));
        } else {
          console.log('No search results found, offering manual entry');
          setSuggestions([{
            place_id: 'manual-entry',
            display_name: `📍 Use "${value}" as custom address`,
            lat: '41.2995',
            lon: '69.2401'
          }]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);
  };

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    console.log('Suggestion selected:', suggestion.display_name);

    if (suggestion.place_id === 'manual-entry') {
      const manualAddress = suggestion.display_name.replace('📍 Use "', '').replace('" as manual address', '');
      setAddress(manualAddress);
      setSuggestions([]);
      console.log('Manual address entry:', manualAddress);

      return;
    }

    setAddress(suggestion.display_name);
    setSuggestions([]);

    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);

    setSelectedLocation({ lat, lng });

    if (map) {
      map.setView([lat, lng], 15);
      handleMapClickWithMap(map, lat, lng);
    }
  };

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setSelectedLocation({ lat, lng });

          if (map) {
            map.setView([lat, lng], 15);
            handleMapClickWithMap(map, lat, lng);
          }
          setIsLoadingLocation(false);
        },
        (error) => {
          let message = 'Unable to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
          }
          console.log('Location error:', message);
          setIsLoadingLocation(false);
        }
      );
    } else {
      setIsLoadingLocation(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedLocation || !address.trim()) {
      toast.error('Please select a delivery address');
      return;
    }

    if (!houseNumber.trim()) {
      toast.error('Please enter house number');
      return;
    }

    if (!phoneNumber.trim()) {
      toast.error('Please enter phone number');
      return;
    }

    if (!user) {
      toast.error('Please log in to place an order');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        delivery_address: address,
        delivery_latitude: selectedLocation.lat,
        delivery_longitude: selectedLocation.lng,
        house_number: houseNumber,
        entrance_number: entranceNumber || null,
        level: level || null,
        apartment_number: apartmentNumber || null,
        delivery_notes: deliveryNotes || null,
        phone_number: phoneNumber,
        payment_method: paymentMethod,
        scheduled_time: null
      };

      console.log('Creating order with data:', orderData);

      const response = await api.post(`/users/${user.id}/orders`, orderData);

      console.log('Order created successfully:', response.data);
      toast.success('Order placed successfully!');
      window.dispatchEvent(new CustomEvent('cartUpdated'));

      onClose();
      navigate('/orders');

    } catch (error: any) {
      console.error('Error placing order:', error);

      if (error.response?.status === 401) {
        toast.error('Please log in again');
      } else if (error.response?.status === 404) {
        toast.error('Cart not found. Please add items to cart first.');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to place order. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Checkout</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Address
              </label>
              <div className="relative">
                <div className="flex">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    placeholder="Enter your delivery address..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                  <button
                    onClick={getCurrentLocation}
                    disabled={isLoadingLocation}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 border border-l-0 border-gray-300 rounded-r-lg transition-colors disabled:opacity-50"
                    title="Use current location"
                  >
                    <Navigation size={16} className={isLoadingLocation ? 'animate-spin' : ''} />
                  </button>
                </div>
                
                {(suggestions.length > 0 || isSearching) && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {isSearching ? (
                      <div className="px-4 py-3 text-center text-gray-500">
                        Searching...
                      </div>
                    ) : (
                      suggestions.map((suggestion) => {
                        if (suggestion.place_id === 'manual-entry') {
                          return (
                            <button
                              key={suggestion.place_id}
                              onClick={() => handleSuggestionSelect(suggestion)}
                              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 bg-blue-25"
                            >
                              <div className="font-medium text-blue-700 text-sm">
                                {suggestion.display_name}
                              </div>
                              <div className="text-xs text-blue-500 mt-1">
                                Click to use this custom address, then click on map to set exact location
                              </div>
                            </button>
                          );
                        }

                        const parts = suggestion.display_name.split(',');
                        const mainPart = parts[0];
                        const secondaryPart = parts.slice(1, 3).join(',').trim();

                        const isGeneralLocation = !mainPart.match(/^\d+/) &&
                          (mainPart.toLowerCase().includes('street') ||
                           mainPart.toLowerCase().includes('district') ||
                           mainPart.toLowerCase().includes('микрорайон') ||
                           parts.length <= 2);

                        return (
                          <button
                            key={suggestion.place_id}
                            onClick={() => handleSuggestionSelect(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900 text-sm">
                              {mainPart}
                            </div>
                            {secondaryPart && (
                              <div className="text-xs text-gray-500 mt-1">
                                {secondaryPart}
                              </div>
                            )}
                            {isGeneralLocation && (
                              <div className="text-xs text-blue-600 mt-1 font-medium">
                                📍 Click to go to this area, then click on map for exact location
                              </div>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
              <div className="space-y-2 mb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.meal_name}</span>
                    <span>{Number(item.total_price).toLocaleString("fr-FR").replace(/\u00A0/g, " ")} UZS</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{totalAmount.toLocaleString("fr-FR").replace(/\u00A0/g, " ")} UZS</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MapPin size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Select delivery location</span>
            </div>
            <div
              ref={mapRef}
              className="w-full h-80 bg-gray-200 rounded-lg cursor-pointer relative z-10"
              style={{ minHeight: '320px' }}
            />
            <p className="text-xs text-gray-500">
              Click on the map to select your delivery location or use the address search above.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Delivery Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                House Number *
              </label>
              <input
                type="text"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                placeholder="22, 22A, 22/1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entrance Number
              </label>
              <input
                type="text"
                value={entranceNumber}
                onChange={(e) => setEntranceNumber(e.target.value)}
                placeholder="1, 2, A"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Floor/Level
              </label>
              <input
                type="text"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="1, 2, Ground"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apartment Number
              </label>
              <input
                type="text"
                value={apartmentNumber}
                onChange={(e) => setApartmentNumber(e.target.value)}
                placeholder="15, 15A"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+998901234567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Notes
            </label>
            <textarea
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Ring doorbell twice, blue gate, etc."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'cash', label: '💵 Cash' },
                { value: 'card', label: '💳 Card' },
                { value: 'payme', label: '📱 Payme' },
                { value: 'click', label: '🔵 Click' }
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value as any)}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    paymentMethod === method.value
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCheckout}
            disabled={!selectedLocation || !address.trim() || !houseNumber.trim() || !phoneNumber.trim() || isSubmitting}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;

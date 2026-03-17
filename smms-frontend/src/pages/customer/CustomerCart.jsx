import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { 
  ShoppingBag, 
  Heart, 
  ShoppingCart, 
  Package, 
  Clock,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  CreditCard,
  Smartphone,
  Wallet,
  CheckCircle,
  X,
  MapPin
} from 'lucide-react';
import { cartAPI, cartItemAPI, orderAPI, zoneAPI } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useJwtAuth } from '../../contexts/JwtAuthContext';

const CustomerCart = () => {
  const navigate = useNavigate();
  const { user } = useJwtAuth();
  const [cart, setCart] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [paymentErrors, setPaymentErrors] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressError, setAddressError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [locationLabel, setLocationLabel] = useState('');

  const navigation = [
    { name: 'Dashboard', href: '/customer/dashboard', icon: ShoppingBag, current: false },
    { name: 'Products', href: '/customer/products', icon: Package, current: false },
    { name: 'Cart', href: '/customer/cart', icon: ShoppingCart, current: true },
    { name: 'Orders', href: '/customer/orders', icon: Clock, current: false },
    { name: 'Wishlist', href: '/customer/wishlist', icon: Heart, current: false },
  ];

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    zone: '',
    area: '',
    pincode: '',
    phone: ''
  });
  const [addressModalError, setAddressModalError] = useState('');

  const [zones, setZones] = useState([]);

  useEffect(() => {
    fetchCart();
    loadLocationLabel();
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const response = await zoneAPI.getAll();
      const list = Array.isArray(response?.data) ? response.data : response?.data?.data ?? [];
      setZones(list);
    } catch (error) {
      console.error('Error fetching zones:', error);
      setZones([]);
    }
  };

  const handleSaveNewAddress = () => {
    setAddressModalError('');
    if (!newAddress.fullName || !newAddress.zone || !newAddress.area || !newAddress.pincode || !newAddress.phone) {
      setAddressModalError('All fields are required.');
      return;
    }

    const addressToSave = {
      id: Date.now(),
      label: newAddress.zone,
      fullName: newAddress.fullName,
      phone: newAddress.phone,
      line1: `${newAddress.zone}, ${newAddress.area}`,
      line2: '',
      city: 'Rajkot',
      state: 'Gujarat',
      zip: newAddress.pincode,
      isDefault: addresses.length === 0
    };

    const updatedAddresses = [...addresses, addressToSave];
    localStorage.setItem(getAddressStorageKey(cart.customerId), JSON.stringify(updatedAddresses));
    setAddresses(updatedAddresses);
    setSelectedAddressId(addressToSave.id);
    setIsAddressModalOpen(false);
    setNewAddress({
      fullName: '',
      zone: '',
      area: '',
      pincode: '',
      phone: ''
    });
  };

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getMyCart();
      if (response.data?.success) {
        const cartData = response.data.data;
        setCart(cartData);
        // Map backend CartItems to the format expected by the frontend
        const items = (cartData.cartItems || []).map(ci => ({
          cartItemId: ci.cartItemId,
          productId: ci.productId,
          productName: ci.product?.name || 'Unknown Product',
          price: ci.product?.price || 0,
          quantity: ci.quantity,
          imageUrl: ci.product?.imageUrl,
          stock: ci.product?.currentStock || 0
        }));
        setCartItems(items);
        loadAddresses(cartData.customerId);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAddressStorageKey = (customerId) => {
    return customerId ? `customerAddresses_${customerId}` : 'customerAddresses';
  };

  const loadAddresses = (customerId) => {
    try {
      const stored = localStorage.getItem(getAddressStorageKey(customerId));
      const list = stored ? JSON.parse(stored) : [];
      if (Array.isArray(list)) {
        setAddresses(list);
        const defaultAddress = list.find((addr) => addr.isDefault) || list[0];
        setSelectedAddressId(defaultAddress ? defaultAddress.id : null);
      } else {
        setAddresses([]);
        setSelectedAddressId(null);
      }
    } catch (error) {
      console.error('Error loading addresses for checkout', error);
      setAddresses([]);
      setSelectedAddressId(null);
    }
  };

  const formatAddress = (addr) => {
    const parts = [
      addr.fullName,
      addr.line1,
      addr.line2,
      `${addr.city}, ${addr.state} ${addr.zip}`,
      `Phone: ${addr.phone}`
    ].filter(Boolean);
    return parts.join(', ');
  };

  const getLocationStorageKey = () => {
    return user?.userId ? `customerLocation_${user.userId}` : 'customerLocation';
  };

  const loadLocationLabel = () => {
    try {
      const stored = localStorage.getItem(getLocationStorageKey());
      if (!stored) {
        setLocationLabel('');
        return;
      }
      const parsed = JSON.parse(stored);
      if (parsed && parsed.zoneName) {
        const parts = [];
        parts.push(parsed.zoneName);
        if (parsed.pincodeNumber) {
          parts.push(parsed.pincodeNumber);
        }
        if (parsed.city) {
          parts.push(parsed.city);
        }
        setLocationLabel(parts.join(' • '));
      } else {
        setLocationLabel('');
      }
    } catch {
      setLocationLabel('');
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      const item = cartItems.find(i => i.cartItemId === cartItemId);
      if (!item) return;

      await cartItemAPI.update(cartItemId, {
        cartItemId: cartItemId,
        cartId: cart.cartId,
        productId: item.productId,
        quantity: newQuantity
      });

      setCartItems(items =>
        items.map(item =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      await cartItemAPI.delete(cartItemId);
      setCartItems(items => items.filter(item => item.cartItemId !== cartItemId));
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const validatePayment = () => {
    const errors = {};

    if (paymentMethod === 'Card') {
      const trimmed = cardNumber.replace(/\s+/g, '');
      if (!/^\d{16}$/.test(trimmed)) {
        errors.cardNumber = 'Card number must be exactly 16 digits';
      }

      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) {
        errors.cardExpiry = 'Expiry must be in MM/YY format';
      }

      if (!/^\d{3}$/.test(cardCvv)) {
        errors.cardCvv = 'CVV must be exactly 3 digits';
      }
    }

    if (paymentMethod === 'UPI') {
      const upiPattern = /^[a-zA-Z0-9.\-_]{3,}@[a-zA-Z]{3,}$/;
      if (!upiPattern.test(upiId)) {
        errors.upiId = 'Enter a valid UPI ID like name@bank';
      }
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0 || !cart) return;

    let parsedLocation = null;
    try {
      const storedLocation = localStorage.getItem(getLocationStorageKey());
      if (!storedLocation) {
        setLocationError('Please set your delivery location from the header before checkout.');
        toast.error('Please set your delivery location (zone) before checkout.');
        return;
      }
      parsedLocation = JSON.parse(storedLocation);
      setLocationError('');
    } catch {
      setLocationError('Please set your delivery location from the header before checkout.');
      toast.error('Please set your delivery location (zone) before checkout.');
      return;
    }

    const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);
    let effectiveAddress = selectedAddress || null;

    if (!effectiveAddress) {
      const name = user?.userName || 'Customer';
      const phone = user?.phone || '';
      const city = parsedLocation?.city || '';
      const state = parsedLocation?.state || '';
      const zip = parsedLocation?.pincodeNumber ? String(parsedLocation.pincodeNumber) : '';
      const line1 = parsedLocation?.zoneName || city || '';

      if (!line1) {
        setAddressError('Please add a delivery address from your dashboard before checkout.');
        toast.error('Please add a delivery address before checkout.');
        return;
      }

      effectiveAddress = {
        id: 'auto',
        label: 'Delivery Location',
        fullName: name,
        phone,
        line1,
        line2: '',
        city,
        state,
        zip,
        isDefault: true
      };
    }

    setAddressError('');

    if (!validatePayment()) return;

    try {
      setCheckingOut(true);
      
      const subtotal = getTotalPrice();
      const deliveryFee = 50;
      const tax = subtotal * 0.18;
      const total = subtotal + deliveryFee + tax;
      const nowIso = new Date().toISOString();

      const selectedAddressText = formatAddress(effectiveAddress);
      let headerLocationLabel = '';
      if (parsedLocation && parsedLocation.zoneName) {
        const parts = [];
        parts.push(parsedLocation.zoneName);
        if (parsedLocation.pincodeNumber) {
          parts.push(parsedLocation.pincodeNumber);
        }
        if (parsedLocation.city) {
          parts.push(parsedLocation.city);
        }
        headerLocationLabel = parts.join(' • ');
      }

      const trackingLabel = headerLocationLabel || selectedAddressText.slice(0, 50);

      const orderData = {
        customerId: cart.customerId,
        orderDate: nowIso,
        status: 'Pending',
        paymentMode: paymentMethod === 'Cash' ? 'Cash' : paymentMethod,
        totalAmount: subtotal,
        deliveryCharge: deliveryFee,
        finalAmount: total,
        trackingNumber: trackingLabel,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity
        }))
      };

      const orderResponse = await orderAPI.create(orderData);
      const createdOrder = orderResponse?.data;
      const orderId = createdOrder?.orderId || createdOrder?.OrderId;

      if (!orderId) {
        throw new Error('Unable to get created order id');
      }

      await cartAPI.delete(cart.cartId);

      setShowPaymentModal(false);
      setShowThankYou(true);
      setCartItems([]);
      toast.success('Order placed successfully!');
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('Failed to place your order. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  if (loading) {
    return <LoadingSpinner text="Loading cart..." fullScreen />;
  }

  return (
    <Layout navigation={navigation} title="Shopping Cart">
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600">
              {cartItems.length > 0 ? `${getTotalItems()} items in your cart` : 'Your cart is empty'}
            </p>
          </div>
        </div>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.cartItemId} className="card relative group">
                  {/* Remove Item Button - Top Right */}
                  <button
                    onClick={() => removeItem(item.cartItemId)}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 lg:opacity-100"
                    title="Remove item"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>

                  <div className="flex items-center space-x-4 pr-8">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.productName}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {item.productName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ₹{item.price.toFixed(2)} each
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.stock} in stock
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right min-w-[80px]">
                      <p className="font-semibold text-gray-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card sticky top-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Summary
                </h3>

                <div className="mb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-gray-900">
                        Delivery Address
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddressModalOpen(true)}
                        className="text-xs text-emerald-700 font-semibold hover:text-emerald-900"
                      >
                        + Add New
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/customer/dashboard')}
                        className="text-xs text-emerald-700 hover:text-emerald-900"
                      >
                        Manage
                      </button>
                    </div>
                  </div>

                  {addresses.length > 0 ? (
                    <div className="space-y-2">
                      <select
                        value={selectedAddressId || ''}
                        onChange={(e) => {
                          setSelectedAddressId(e.target.value ? Number(e.target.value) : null);
                          setAddressError('');
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">Select an address</option>
                        {addresses.map((addr) => (
                          <option key={addr.id} value={addr.id}>
                            {addr.label || addr.fullName} - {addr.line1} ({addr.zip})
                          </option>
                        ))}
                      </select>

                      {/* Preview of selected address */}
                      {selectedAddressId && (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          {addresses.find(a => a.id === selectedAddressId) && (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  {addresses.find(a => a.id === selectedAddressId).label || 'Address'}
                                </span>
                                {addresses.find(a => a.id === selectedAddressId).isDefault && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-800">{addresses.find(a => a.id === selectedAddressId).fullName}</p>
                              <p className="text-xs text-gray-600">
                                {addresses.find(a => a.id === selectedAddressId).line1}
                              </p>
                              <p className="text-xs text-gray-600">
                                {addresses.find(a => a.id === selectedAddressId).city}, {addresses.find(a => a.id === selectedAddressId).state} {addresses.find(a => a.id === selectedAddressId).zip}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                Phone: {addresses.find(a => a.id === selectedAddressId).phone}
                              </p>
                            </>
                          )}
                        </div>
                      )}
                      
                      {addressError && (
                        <p className="text-xs text-red-600">{addressError}</p>
                      )}
                      {locationError && (
                        <p className="text-xs text-red-600">{locationError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                        No saved addresses. Please add a new address to continue.
                      </p>
                      <button
                        onClick={() => setIsAddressModalOpen(true)}
                        className="w-full text-xs text-emerald-700 font-semibold p-2 border border-dashed border-emerald-300 rounded-lg hover:bg-emerald-50 transition"
                      >
                        + Add Delivery Address
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({getTotalItems()} items)</span>
                    <span className="font-medium">₹{getTotalPrice().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">₹50.00</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">₹{(getTotalPrice() * 0.18).toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-base font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-gray-900">
                        ₹{(getTotalPrice() + 50 + (getTotalPrice() * 0.18)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setPaymentErrors({});
                    setShowPaymentModal(true);
                  }}
                  disabled={checkingOut}
                  className="w-full btn-primary mt-6 flex items-center justify-center gap-2"
                >
                  {checkingOut ? 'Processing...' : 'Proceed to Checkout'}
                  {!checkingOut && <ArrowRight className="h-4 w-4" />}
                </button>

                <button 
                  onClick={() => navigate('/customer/products')}
                  className="w-full btn-secondary mt-3"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-6">
              Looks like you haven't added any items to your cart yet.
            </p>
            <button 
              className="btn-primary"
              onClick={() => navigate('/customer/products')}
            >
              Start Shopping
            </button>
          </div>
        )}
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Select Payment Method</h2>
                <p className="text-sm text-gray-600">Secure payment for your order</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('Card')}
                className={`flex flex-col items-center justify-center gap-2 border rounded-xl py-3 px-2 text-sm font-medium transition ${
                  paymentMethod === 'Card' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`flex flex-col items-center justify-center gap-2 border rounded-xl py-3 px-2 text-sm font-medium transition ${
                  paymentMethod === 'UPI' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Smartphone className="h-5 w-5" />
                <span>UPI</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`flex flex-col items-center justify-center gap-2 border rounded-xl py-3 px-2 text-sm font-medium transition ${
                  paymentMethod === 'Cash' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Wallet className="h-5 w-5" />
                <span>Cash</span>
              </button>
            </div>

            {paymentMethod === 'Card' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {paymentErrors.cardNumber && (
                    <p className="text-xs text-red-600">{paymentErrors.cardNumber}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="01/34"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {paymentErrors.cardExpiry && (
                      <p className="text-xs text-red-600">{paymentErrors.cardExpiry}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">CVV</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="123"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {paymentErrors.cardCvv && (
                      <p className="text-xs text-red-600">{paymentErrors.cardCvv}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'UPI' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@bank"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {paymentErrors.upiId && (
                  <p className="text-xs text-red-600">{paymentErrors.upiId}</p>
                )}
              </div>
            )}

            {paymentMethod === 'Cash' && (
              <div className="text-sm text-gray-700 bg-gray-50 border border-dashed border-gray-300 rounded-xl px-4 py-3">
                Cash on delivery selected. You will pay when your order is delivered.
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm text-gray-600">Amount to pay</p>
                <p className="text-lg font-semibold text-gray-900">
                  ₹{(getTotalPrice() + 50 + (getTotalPrice() * 0.18)).toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkingOut}
                className="btn-primary flex items-center gap-2 px-5 py-2 rounded-lg"
              >
                {checkingOut ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showThankYou && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Thank you for shopping!</h2>
            <p className="text-gray-600">
              Have a great day!!
            </p>
            <button
              type="button"
              onClick={() => {
                setShowThankYou(false);
                navigate('/customer/orders');
              }}
              className="btn-primary w-full mt-2"
            >
              View My Orders
            </button>
          </div>
        </div>
      )}

      {isAddressModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  Add Delivery Address
                </h2>
                <p className="text-xs text-gray-500">Service city is fixed to Rajkot, Gujarat, India.</p>
              </div>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Zone
                    </label>
                    <select
                      value={newAddress.zone}
                      onChange={(e) => {
                        const selectedZoneName = e.target.value;
                        const selectedZone = zones.find(z => (z.zoneName || z.ZoneName) === selectedZoneName);
                        setNewAddress({ 
                          ...newAddress, 
                          zone: selectedZoneName,
                          pincode: selectedZone ? String(selectedZone.pincodeNumber || selectedZone.PincodeNumber || '') : newAddress.pincode
                        });
                      }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Select a zone</option>
                      {zones.map((z) => (
                        <option key={z.zoneId || z.ZoneId} value={z.zoneName || z.ZoneName}>
                          {z.zoneName || z.ZoneName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Area / Society name
                    </label>
                    <input
                      type="text"
                      value={newAddress.area}
                      onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                      placeholder="e.g. Shri Ram Park"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      placeholder="6-digit"
                      maxLength={6}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value="Rajkot"
                      disabled
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {addressModalError && (
                  <p className="text-xs text-red-600">{addressModalError}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewAddress}
                className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition shadow-sm"
              >
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CustomerCart;

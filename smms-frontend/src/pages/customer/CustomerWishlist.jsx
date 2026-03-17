import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import {
  ShoppingBag,
  Heart,
  ShoppingCart,
  Package,
  Clock,
  Trash2,
  Star,
  Search,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { productAPI, cartAPI, cartItemAPI } from '../../api';
import { useJwtAuth } from '../../contexts/JwtAuthContext';

const CustomerWishlist = () => {
  const { user } = useJwtAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const navigation = [
    { name: 'Dashboard', href: '/customer/dashboard', icon: ShoppingBag, current: false },
    { name: 'Products', href: '/customer/products', icon: Package, current: false },
    { name: 'Cart', href: '/customer/cart', icon: ShoppingCart, current: false },
    { name: 'Orders', href: '/customer/orders', icon: Clock, current: false },
    { name: 'Wishlist', href: '/customer/wishlist', icon: Heart, current: true },
  ];

  const getWishlistStorageKey = () => {
    return user?.userId ? `customerWishlist_${user.userId}` : 'customerWishlist';
  };

  const getStockStatus = (currentStock, lowStockValue) => {
    if (currentStock === 0) {
      return { status: 'Out of Stock', color: 'text-red-600 bg-red-100', icon: AlertTriangle };
    } else if (currentStock <= lowStockValue) {
      return { status: 'Low Stock', color: 'text-yellow-600 bg-yellow-100', icon: AlertTriangle };
    } else {
      return { status: 'In Stock', color: 'text-green-600 bg-green-100', icon: CheckCircle };
    }
  };

  const getProductImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    return `http://localhost:5200${imageUrl}`;
  };

  useEffect(() => {
    const loadWishlist = async () => {
      try {
        const stored = localStorage.getItem(getWishlistStorageKey());
        const ids = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(ids) || ids.length === 0) {
          setWishlistItems([]);
          setLoading(false);
          return;
        }

        const res = await productAPI.getAll();
        const productsList = Array.isArray(res?.data) ? res.data : res?.data?.data ?? [];
        const items = productsList.filter((p) => ids.includes(p.productId));
        setWishlistItems(items);
      } catch (error) {
        console.error('Error loading wishlist', error);
        setWishlistItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [user]);

  const removeFromWishlist = (productId) => {
    setWishlistItems((items) => items.filter((item) => item.productId !== productId));
    try {
      const stored = localStorage.getItem(getWishlistStorageKey());
      const ids = stored ? JSON.parse(stored) : [];
      const updated = Array.isArray(ids) ? ids.filter((id) => id !== productId) : [];
      localStorage.setItem(getWishlistStorageKey(), JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating wishlist in storage', error);
    }
  };

  const addToCart = async (productId) => {
    try {
      // 1. Get the current user's cart
      const cartRes = await cartAPI.getMyCart();
      const cartId = cartRes.data?.data?.cartId;

      if (!cartId) {
        throw new Error('Could not retrieve cart ID');
      }

      // 2. Add item to cart
      await cartItemAPI.create({
        cartId: cartId,
        productId: productId,
        quantity: 1
      });
      console.log('✅ Product added to cart!');
      toast.success('Product added to cart!');
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      const message = error.response?.data?.message || 'Failed to add product to cart';
      toast.error(message);
    }
  };

  const filteredItems = wishlistItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner text="Loading wishlist..." fullScreen />;
  }

  return (
    <Layout navigation={navigation} title="My Wishlist">
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600">
              {wishlistItems.length > 0 ? `${wishlistItems.length} items saved for later` : 'No items in your wishlist'}
            </p>
          </div>
        </div>

        {wishlistItems.length > 0 && (
          <div className="card">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search wishlist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item, index) => {
              const stockInfo = getStockStatus(item.currentStock, item.lowStockValue);
              const StockIcon = stockInfo.icon;

              return (
                <div key={item.productId} className="card card-hover" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative">
                    {item.imageUrl ? (
                      <img 
                        src={getProductImageUrl(item.imageUrl)} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-16 w-16 text-gray-400" />
                    )}
                    
                    <button
                      onClick={() => removeFromWishlist(item.productId)}
                      className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>

                    <div className={`absolute top-2 left-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockInfo.color}`}>
                      <StockIcon className="h-3 w-3 mr-1" />
                      {stockInfo.status}
                    </div>

                    {item.currentStock === 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">Out of Stock</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                        {item.name}
                      </h3>
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">
                          4.5 (0 reviews)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-green-600">
                        ₹{item.price}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500">In your wishlist</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => addToCart(item.productId)}
                        disabled={item.currentStock === 0}
                        className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                          item.currentStock === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>{item.currentStock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No items found' : 'Your wishlist is empty'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Try adjusting your search criteria'
                : 'Save items you love to your wishlist and shop them later'
              }
            </p>
            <button className="btn-primary">
              Start Shopping
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CustomerWishlist;

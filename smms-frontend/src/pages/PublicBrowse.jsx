import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShoppingBag, ShoppingCart, Heart, Search, Filter, Star, Package, CheckCircle, AlertTriangle, Eye, X, ChevronLeft, ChevronRight, User, LogIn } from 'lucide-react';
import { productAPI, categoryAPI, cartAPI, cartItemAPI } from '../api';
import { useJwtAuth } from '../contexts/JwtAuthContext';
import LoginPromptModal from '../components/LoginPromptModal';
import LoadingSpinner from '../components/LoadingSpinner';

const PublicBrowse = () => {
  const { user, isAuthenticated } = useJwtAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(8);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginActionType, setLoginActionType] = useState('cart');
  const [wishlistIds, setWishlistIds] = useState([]);

  useEffect(() => { fetchProducts(currentPage); }, [currentPage, searchTerm, selectedCategory, sortBy, sortOrder]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedCategory, sortBy, sortOrder]);
  useEffect(() => {
    if (user?.userId) {
      try {
        const stored = localStorage.getItem(`customerWishlist_${user.userId}`);
        if (stored) setWishlistIds(JSON.parse(stored));
      } catch {}
    }
  }, [user]);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        productAPI.getAll(page, pageSize, searchTerm, selectedCategory, sortBy, sortOrder),
        categoryAPI.getAll()
      ]);
      const raw = pRes?.data;
      const items = Array.isArray(raw) ? raw : (raw?.data ?? []);
      const pagination = Array.isArray(raw) ? null : raw?.pagination;
      setProducts(items);
      setCategories(Array.isArray(cRes?.data) ? cRes.data : cRes?.data?.data ?? []);
      if (pagination?.totalPages) setTotalPages(pagination.totalPages);
      else setTotalPages(Math.max(1, Math.ceil((items.length || 1) / pageSize)));
    } catch {
      setProducts([]); setCategories([]);
      toast.error('Failed to load products');
    } finally { setLoading(false); }
  };

  const requireAuth = (type) => {
    if (!isAuthenticated) { setLoginActionType(type); setLoginModalOpen(true); return true; }
    return false;
  };

  const addToCart = async (productId) => {
    if (requireAuth('cart')) return;
    try {
      const cartRes = await cartAPI.getMyCart();
      const cartId = cartRes.data?.data?.cartId;
      if (!cartId) throw new Error('No cart');
      await cartItemAPI.create({ cartId, productId, quantity: 1 });
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const toggleWishlist = (product) => {
    if (requireAuth('wishlist')) return;
    if (!user?.userId) return;
    const key = `customerWishlist_${user.userId}`;
    setWishlistIds(prev => {
      const exists = prev.includes(product.productId);
      const updated = exists ? prev.filter(id => id !== product.productId) : [...prev, product.productId];
      localStorage.setItem(key, JSON.stringify(updated));
      toast.success(exists ? 'Removed from wishlist' : 'Added to wishlist');
      return updated;
    });
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.includes('localhost:5200')) {
      return url.replace('http://localhost:5200', 'https://fresh-mart-105h.onrender.com');
    }
    if (url.startsWith('http')) return url;
    return `https://fresh-mart-105h.onrender.com${url}`;
  };

  const getSmartFallbackImage = (name) => {
    const n = (name || '').toLowerCase().trim();
    if (n.includes('apple') || n.includes('banana') || n.includes('fruit') || n.includes('orange') || n.includes('grape') || n.includes('mango') || n.includes('kiwi') || n.includes('lemon')) {
      return 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?q=80&w=400&h=400&fit=crop';
    }
    if (n.includes('potato') || n.includes('tomato') || n.includes('onion') || n.includes('vegetable') || n.includes('veg') || n.includes('ginger') || n.includes('garlic') || n.includes('carrot') || n.includes('chilli') || n.includes('coriander')) {
      return 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?q=80&w=400&h=400&fit=crop';
    }
    if (n.includes('milk') || n.includes('amul') || n.includes('dairy') || n.includes('cheese') || n.includes('butter') || n.includes('paneer') || n.includes('curd') || n.includes('ghee') || n.includes('taaza')) {
      return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=400&h=400&fit=crop';
    }
    if (n.includes('bread') || n.includes('pav') || n.includes('toast') || n.includes('bakery') || n.includes('bun') || n.includes('roti') || n.includes('khakhra')) {
      return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&h=400&fit=crop';
    }
    if (n.includes('biscuit') || n.includes('cookie') || n.includes('snack') || n.includes('chips') || n.includes('namkeen') || n.includes('kurkure') || n.includes('lays') || n.includes('wafer') || n.includes('munch')) {
      return 'https://images.unsplash.com/photo-1599490659213-e2b9527b0876?q=80&w=400&h=400&fit=crop';
    }
    if (n.includes('chocolate') || n.includes('kitkat') || n.includes('cadbury') || n.includes('sweet') || n.includes('candy') || n.includes('dairy milk') || n.includes('5 star') || n.includes('milkeybar')) {
      return 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?q=80&w=400&h=400&fit=crop';
    }
    if (n.includes('noodle') || n.includes('maggi') || n.includes('pasta') || n.includes('instant') || n.includes('ramen') || n.includes('soup')) {
      return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=400&h=400&fit=crop';
    }
    if (n.includes('clean') || n.includes('wash') || n.includes('detergent') || n.includes('soap') || n.includes('surf') || n.includes('harpic') || n.includes('liquid') || n.includes('all out') || n.includes('power poket') || n.includes('aer') || n.includes('comfort') || n.includes('lizol') || n.includes('detto')) {
      return 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&h=400&fit=crop';
    }
    if (n.includes('rice') || n.includes('atta') || n.includes('dal') || n.includes('wheat') || n.includes('flour') || n.includes('pulse') || n.includes('grain') || n.includes('besan') || n.includes('suji') || n.includes('maida')) {
      return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=400&h=400&fit=crop';
    }
    if (n.includes('shampoo') || n.includes('oil') || n.includes('cream') || n.includes('paste') || n.includes('colgate') || n.includes('brush') || n.includes('personal') || n.includes('face') || n.includes('care') || n.includes('handwash') || n.includes('lotion')) {
      return 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=400&h=400&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&h=400&fit=crop';
  };

  const getStockInfo = (stock, low) => {
    if (stock === 0) return { label: 'Out of Stock', cls: 'text-red-600 bg-red-100' };
    if (stock <= low) return { label: 'Low Stock', cls: 'text-yellow-600 bg-yellow-100' };
    return { label: 'In Stock', cls: 'text-green-600 bg-green-100' };
  };

  const getCatName = (id) => categories.find(c => c.categoryId === id)?.name || '';

  if (loading && products.length === 0) return <LoadingSpinner text="Loading products..." fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav Bar */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Fresh Mart</h1>
                <p className="text-xs text-gray-500 -mt-0.5">Store Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <button onClick={() => {
                  const role = user?.role;
                  if (role === 'StoreOwner') navigate('/admin/dashboard');
                  else if (role === 'DeliveryStaff') navigate('/delivery-staff/dashboard');
                  else navigate('/customer/dashboard');
                }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition">
                  <User className="h-4 w-4" /> Dashboard
                </button>
              ) : (
                <>
                  <Link to="/login" className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition">
                    <LogIn className="h-4 w-4" /> Sign In
                  </Link>
                  <Link to="/register" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-3xl font-bold mb-2">Fresh groceries delivered to your door 🛒</h2>
          <p className="text-blue-100 text-lg">Browse products, add to cart — just like Blinkit!</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Category Strip */}
        {categories.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">Shop by Category</p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              <button onClick={() => setSelectedCategory('all')}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition ${selectedCategory === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}>
                All
              </button>
              {categories.map(cat => (
                <button key={cat.categoryId} onClick={() => setSelectedCategory(cat.categoryId.toString())}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition ${selectedCategory === cat.categoryId.toString() ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search & Sort */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search products..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
            </select>
            <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const stock = getStockInfo(product.currentStock, product.lowStockValue);
              const wishlisted = wishlistIds.includes(product.productId);
              return (
                <div key={product.productId} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
                  {/* Image */}
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    <img src={product.imageUrl ? getImageUrl(product.imageUrl) : getSmartFallbackImage(product.name)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.onerror = null; e.target.src = getSmartFallbackImage(product.name); }} />
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${stock.cls}`}>
                      {stock.label}
                    </div>
                    {/* Quick view */}
                    <button onClick={() => { setSelectedProduct(product); setShowProductModal(true); }}
                      className="absolute top-3 left-3 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="h-4 w-4 text-gray-600" />
                    </button>
                    {/* Wishlist heart */}
                    <button onClick={() => toggleWishlist(product)}
                      className="absolute bottom-3 right-3 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110">
                      <Heart className={`h-4 w-4 ${wishlisted ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                    </button>
                  </div>
                  {/* Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">{product.name}</h3>
                      <span className="text-xs text-gray-500 ml-2">{getCatName(product.categoryId)}</span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-xl font-bold text-green-600">₹{product.price}</span>
                      <button onClick={() => addToCart(product.productId)}
                        disabled={product.currentStock === 0}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${product.currentStock === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                        <ShoppingCart className="h-4 w-4" />
                        {product.currentStock === 0 ? 'Out' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filter</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 py-4">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
              <button onClick={() => setShowProductModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                <img src={selectedProduct.imageUrl ? getImageUrl(selectedProduct.imageUrl) : getSmartFallbackImage(selectedProduct.name)}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = getSmartFallbackImage(selectedProduct.name); }} />
              </div>
              <div className="space-y-4">
                <p className="text-gray-600">{selectedProduct.description}</p>
                <p className="text-2xl font-bold text-green-600">₹{selectedProduct.price}</p>
                <p className="text-sm text-gray-500">Category: {getCatName(selectedProduct.categoryId)}</p>
                <p className="text-sm text-gray-500">Stock: {selectedProduct.currentStock} units</p>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => { addToCart(selectedProduct.productId); setShowProductModal(false); }}
                    disabled={selectedProduct.currentStock === 0}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                    <ShoppingCart className="h-5 w-5" /> Add to Cart
                  </button>
                  <button onClick={() => toggleWishlist(selectedProduct)}
                    className={`px-4 py-2.5 rounded-lg border font-medium ${wishlistIds.includes(selectedProduct.productId) ? 'border-red-200 text-red-500 bg-red-50' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                    <Heart className={`h-5 w-5 ${wishlistIds.includes(selectedProduct.productId) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Prompt Modal */}
      <LoginPromptModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} actionType={loginActionType} />
    </div>
  );
};

export default PublicBrowse;

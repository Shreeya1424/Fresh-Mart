import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { showConfirm } from '../../utils/notifications';
import Layout from '../../components/Layout';
import { 
  ShoppingBag, 
  Heart, 
  ShoppingCart, 
  Package, 
  Search,
  Filter,
  Star,
  Plus,
  Clock,
  Edit,
  Trash2,
  X,
  Upload,
  Eye,
  Grid,
  List,
  SortAsc,
  SortDesc,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { productAPI, categoryAPI, cartAPI, cartItemAPI } from '../../api';
import { useJwtAuth } from '../../contexts/JwtAuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const CustomerProducts = () => {
  const { user } = useJwtAuth();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [wishlistProductIds, setWishlistProductIds] = useState([]);
  
  // Form state for adding/editing products
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currentStock: '',
    lowStockValue: '',
    categoryId: '1',
    imageFile: null
  });
  const [errors, setErrors] = useState({});
  const [isCategoryStripHovered, setIsCategoryStripHovered] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/customer/dashboard', icon: ShoppingBag, current: false },
    { name: 'Products', href: '/customer/products', icon: Package, current: true },
    { name: 'Cart', href: '/customer/cart', icon: ShoppingCart, current: false },
    { name: 'Orders', href: '/customer/orders', icon: Clock, current: false },
    { name: 'Wishlist', href: '/customer/wishlist', icon: Heart, current: false },
  ];

  const getProductImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    return `http://localhost:5200${imageUrl}`;
  };

  const getWishlistStorageKey = () => {
    return user?.userId ? `customerWishlist_${user.userId}` : 'customerWishlist';
  };

  useEffect(() => {
    // Initial category from URL
    const categoryId = searchParams.get('category');
    if (categoryId) {
      setSelectedCategory(categoryId);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [searchParams, currentPage, searchTerm, selectedCategory, sortBy, sortOrder, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sortBy, sortOrder, pageSize]);

  useEffect(() => {
    if (user?.role !== 'Customer') return;
    try {
      const stored = localStorage.getItem(getWishlistStorageKey());
      if (stored) {
        const ids = JSON.parse(stored);
        if (Array.isArray(ids)) {
          setWishlistProductIds(ids);
        }
      }
    } catch (error) {
      console.error('Error loading wishlist from storage', error);
    }
  }, [user]);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      console.log(`📦 Loading products (page ${page}) from backend...`);

      const [productsRes, categoriesRes] = await Promise.all([
        productAPI.getAll(page, pageSize, searchTerm, selectedCategory, sortBy, sortOrder),
        categoryAPI.getAll()
      ]);

      const raw = productsRes?.data;
      const productsData = Array.isArray(raw) ? raw : (raw?.data ?? []);
      const pagination = Array.isArray(raw) ? null : raw?.pagination;

      const categoriesList = Array.isArray(categoriesRes?.data)
        ? categoriesRes.data
        : categoriesRes?.data?.data ?? [];

      // When backend returns the full list (no pagination object), slice on client as a safe fallback
      if (!pagination && Array.isArray(raw)) {
        const start = (page - 1) * pageSize;
        const pageSlice = productsData.slice(start, start + pageSize);
        setProducts(pageSlice);
        setFilteredProducts(pageSlice);
      } else {
        setProducts(productsData);
        setFilteredProducts(productsData);
      }
      setCategories(categoriesList);
      
      if (pagination && Number.isFinite(pagination.totalPages)) {
        setTotalPages(pagination.totalPages);
      } else {
        const inferredTotal = Array.isArray(raw) ? raw.length : (raw?.totalCount ?? productsData.length);
        setTotalPages(Math.max(1, Math.ceil((inferredTotal || 0) / pageSize)));
      }

      console.log('✅ Products loaded from backend:', productsData.length);
    } catch (error) {
      console.error('❌ Error loading products:', error);
      setProducts([]);
      setFilteredProducts([]);
      setCategories([]);
      toast.error('Failed to load products from server. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const isInWishlist = (productId) => {
    return wishlistProductIds.includes(productId);
  };

  const toggleWishlist = (product) => {
    if (user?.role !== 'Customer') return;
    setWishlistProductIds((prev) => {
      const exists = prev.includes(product.productId);
      const updated = exists ? prev.filter((id) => id !== product.productId) : [...prev, product.productId];
      try {
        localStorage.setItem(getWishlistStorageKey(), JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving wishlist to storage', error);
      }
      return updated;
    });
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'imageFile') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Valid price is required';
    }
    
    if (!formData.currentStock || formData.currentStock < 0) {
      newErrors.currentStock = 'Valid stock quantity is required';
    }

    if (!formData.lowStockValue || formData.lowStockValue < 0) {
      newErrors.lowStockValue = 'Valid low stock value is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        currentStock: parseInt(formData.currentStock),
        lowStockValue: parseInt(formData.lowStockValue),
        categoryId: parseInt(formData.categoryId),
        isActive: true
      };

      let response;
      if (editingProduct) {
        response = await productAPI.update(editingProduct.productId, productData);
        console.log('✅ Product updated successfully!');
      } else {
        response = await productAPI.create(productData);
        console.log('✅ Product added successfully!');
      }

      const createdProduct = response?.data?.data || response?.data;

      // Upload image if provided
      if (formData.imageFile && createdProduct) {
        try {
          await productAPI.uploadImage(createdProduct.productId || editingProduct?.productId, formData.imageFile);
          console.log('✅ Product image uploaded successfully!');
        } catch (imageError) {
          console.error('❌ Error uploading image:', imageError);
          console.log('⚠️ Product saved but image upload failed');
        }
      }

      handleCloseModal();
      fetchProducts();
    } catch (error) {
      console.error('❌ Error saving product:', error);
      console.log('❌ Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      currentStock: product.currentStock.toString(),
      lowStockValue: product.lowStockValue.toString(),
      categoryId: product.categoryId.toString(),
      imageFile: null
    });
    setShowAddModal(true);
  };

  const handleDelete = async (productId) => {
    const isConfirmed = await showConfirm(
      'Are you sure?',
      'Do you really want to delete this product?',
      'warning'
    );
    if (isConfirmed) {
      try {
        await productAPI.delete(productId);
        console.log('✅ Product deleted successfully!');
        fetchProducts();
      } catch (error) {
        console.error('❌ Error deleting product:', error);
        console.log('❌ Failed to delete product');
      }
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      currentStock: '',
      lowStockValue: '',
      categoryId: '1',
      imageFile: null
    });
    setErrors({});
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

  const getStockStatus = (currentStock, lowStockValue) => {
    if (currentStock === 0) {
      return { status: 'Out of Stock', color: 'text-red-600 bg-red-100', icon: AlertTriangle };
    } else if (currentStock <= lowStockValue) {
      return { status: 'Low Stock', color: 'text-yellow-600 bg-yellow-100', icon: AlertTriangle };
    } else {
      return { status: 'In Stock', color: 'text-green-600 bg-green-100', icon: CheckCircle };
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.categoryId === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getCategoryIcon = (categoryId) => {
    const category = categories.find(cat => cat.categoryId === categoryId);
    return category ? '📦' : '📦';
  };

  const getCategoryImageUrl = (category) => {
    if (!category) return null;
    const name = (category.name || '').toLowerCase().trim();
    
    // 1. PRIORITIZE KEYWORD MAPPING (Blinkit Style - Product Bundles)
    
    // Atta, Rice, Dal, Grains
    if (name.includes('atta') || name.includes('rice') || name.includes('dal') || name.includes('grain') || name.includes('flour') || name.includes('pulses') || name.includes('oil') || name.includes('ghee') || name.includes('masala') || name.includes('spice')) {
      return 'https://www.shutterstock.com/image-photo/beanspulseslentilsrice-wheat-grains-bowl-260nw-746324917.jpg';
    }

    // Bakery & Biscuits
    if (name.includes('bakery') || name.includes('biscuit') || name.includes('cookie') || name.includes('bread') || name.includes('pav') || name.includes('toast') || name.includes('rusk')) {
      return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIhoLhnFxC8cuSJb7t0f403seGF1gMqo3qzA&s';
    }

    // Dairy & Eggs
    if (name.includes('dairy') || name.includes('paneer') || name.includes('curd') || name.includes('egg') || name.includes('yogurt') || name.includes('cheese') || name.includes('butter')) {
      return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTizZfhmMYOMJ0cnTIT32HmEiRsdOIFCnC7ag&s';
    }

    // Fruits & Vegetables
    if (name.includes('fruit') || name.includes('vegetable') || name.includes('sabzi') || name.includes('veg') || name.includes('fresh')) {
      return 'https://www.lalpathlabs.com/blog/wp-content/uploads/2019/01/Fruits-and-Vegetables.jpg';
    }

    // Cold Drinks & Juices
    if (name.includes('cold drink') || name.includes('juice') || name.includes('beverage') || name.includes('soft drink') || name.includes('pepsi') || name.includes('coke') || name.includes('colddrink') || name.includes('water') || name.includes('soda')) {
      return 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?q=80&w=400&h=400&fit=crop';
    }

    // Snacks & Munchies
    if (name.includes('snack') || name.includes('munchies') || name.includes('chips') || name.includes('namkeen') || name.includes('biscuit') || name.includes('cookie') || name.includes('chocolate') || name.includes('sweet') || name.includes('candy')) {
      return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMHu9xJU-Ur7U_KB3z0VeGedZylBBU5MuCjA&s';
    }

    // Instant & Frozen Food
    if (name.includes('breakfast') || name.includes('instant') || name.includes('maggi') || name.includes('noodle') || name.includes('frozen') || name.includes('ice cream') || name.includes('peas') || name.includes('nugget') || name.includes('pasta')) {
      return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=400&h=400&fit=crop';
    }

    // Tea, Coffee & Health Drinks
    if (name.includes('tea') || name.includes('coffee') || name.includes('health drink') || name.includes('bournvita') || name.includes('horlicks') || name.includes('milk')) {
      return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgodnTmFfFE-se-JOXrTOWpI0V_p3k2vLUbQ&s';
    }

    // Personal Care
    if (name.includes('personal') || name.includes('shampoo') || name.includes('soap') || name.includes('skin') || name.includes('beauty') || name.includes('face') || name.includes('hair') || name.includes('body') || name.includes('grooming') || name.includes('sanitary') || name.includes('deodorant') || name.includes('perfume')) {
      return 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=400&h=400&fit=crop';
    }

    // Cleaning Essentials
    if (name.includes('cleaning') || name.includes('essential') || name.includes('detergent') || name.includes('house') || name.includes('wash') || name.includes('floor') || name.includes('toilet') || name.includes('dish') || name.includes('liquid')) {
      return 'https://images.unsplash.com/photo-1584820927498-cfe5211ff973?q=80&w=400&h=400&fit=crop';
    }

    // Baby Care
    if (name.includes('baby') || name.includes('diaper') || name.includes('care') || name.includes('infant') || name.includes('kid') || name.includes('toy')) {
      return 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=400&h=400&fit=crop';
    }

    // Pharma & Wellness
    if (name.includes('pharma') || name.includes('wellness') || name.includes('medicine') || name.includes('health') || name.includes('medical') || name.includes('tablet') || name.includes('capsule') || name.includes('first aid')) {
      return 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=400&h=400&fit=crop';
    }

    // Kitchen & Dining
    if (name.includes('kitchen') || name.includes('dining') || name.includes('crockery') || name.includes('cookware') || name.includes('serveware') || name.includes('bottle') || name.includes('lunch box')) {
      return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1sFXdRRc5RksMk6aa_gi1Bb_V6Xl2pXNHgQ&s';
    }

    // Home & Office
    if (name.includes('home') || name.includes('office') || name.includes('furnishing') || name.includes('stationery') || name.includes('decor') || name.includes('tool') || name.includes('garden')) {
      return 'https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=400&h=400&fit=crop';
    }

    // Paan Corner
    if (name.includes('paan') || name.includes('betel') || name.includes('mouth') || name.includes('freshener') || name.includes('corner') || name.includes('hookah')) {
      return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRQ0Hg9kH4xVZk49QQF4wlnipBXaTTRa76XQ&s';
    }

    // Pet Care
    if (name.includes('pet') || name.includes('dog') || name.includes('cat') || name.includes('animal') || name.includes('bird')) {
      return 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=400&h=400&fit=crop';
    }

    // Electronics
    if (name.includes('electronics') || name.includes('gadget') || name.includes('phone') || name.includes('battery') || name.includes('accessory') || name.includes('cable') || name.includes('charger') || name.includes('earphone')) {
      return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=400&h=400&fit=crop';
    }

    // Sauces & Spreads
    if (name.includes('sauce') || name.includes('spread') || name.includes('jam') || name.includes('honey') || name.includes('dip') || name.includes('ketchup') || name.includes('mayo') || name.includes('butter')) {
      return 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?q=80&w=400&h=400&fit=crop';
    }

    // Organic & Premium
    if (name.includes('organic') || name.includes('premium') || name.includes('healthy') || name.includes('diet') || name.includes('natural')) {
      return 'https://images.unsplash.com/photo-1506484381205-f7945653044d?q=80&w=400&h=400&fit=crop';
    }

    // 2. FALLBACK TO DATABASE ICON IF NO KEYWORD MATCH
    const iconName = category.iconName || category.IconName;
    if (iconName && iconName !== 'string' && iconName !== 'default.png') {
      if (iconName.startsWith('http://') || iconName.startsWith('https://')) return iconName;
      if (iconName.startsWith('/')) return `http://localhost:5200${iconName}`;
    }
    
    // 3. FINAL DEFAULT FALLBACK (High quality grocery bundle)
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&h=400&fit=crop'; 
  };

  const getProductImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    return `https://fresh-mart-105h.onrender.com${imageUrl}`;
  };

  const getCategoryTileImageUrl = (category) => {
    // Always use the keyword-based mapping for consistency
    return getCategoryImageUrl(category);
  };

  const getVisiblePages = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) pages.push('...');
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  if (loading) {
    return <LoadingSpinner text="Loading products..." fullScreen />;
  }

  return (
    <Layout navigation={navigation} title="Products">
      <div className="space-y-6 fade-in">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600">Discover amazing products and manage your inventory</p>
          </div>
          
          {/* Add Product Button - Only show for store owners */}
          {user?.role === 'StoreOwner' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add New Product
            </button>
          )}
        </div>

        {/* Stats Cards - hide for customers, keep for store owners */}
        {user?.role !== 'Customer' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="stats-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="stats-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Stock</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {products.filter(p => p.currentStock > 0).length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="stats-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {products.filter(p => p.currentStock > 0 && p.currentStock <= p.lowStockValue).length}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="stats-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {products.filter(p => p.currentStock === 0).length}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900 text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option
                    key={category.categoryId}
                    value={category.categoryId.toString()}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort & View Mode */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field flex-1 min-w-[140px]"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="currentStock">Stock</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </button>
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Customer category strip */}
        {user?.role === 'Customer' && (
          <div
            className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-sm"
            onMouseEnter={() => setIsCategoryStripHovered(true)}
            onMouseLeave={() => setIsCategoryStripHovered(false)}
          >
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">Shop by category</span>
                <span className="text-xs text-gray-500">
                  Click a category to filter products
                </span>
              </div>
            </div>
            <div className="border-t border-gray-100 overflow-x-auto">
              <div
                className={`flex gap-4 py-3 px-4 whitespace-nowrap min-w-max ${
                  isCategoryStripHovered ? '' : 'animate-marquee'
                }`}
              >
                {categories.map((category) => (
                  <button
                    key={category.categoryId}
                    type="button"
                    onClick={() => setSelectedCategory(category.categoryId.toString())}
                    className={`flex flex-col items-center justify-center px-3 py-2 rounded-2xl border text-xs min-w-[110px] cursor-pointer transition-all ${
                      selectedCategory === category.categoryId.toString()
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-800 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center mb-1 overflow-hidden">
                      <img
                        src={getCategoryTileImageUrl(category)}
                        alt={category.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&h=400&fit=crop';
                        }}
                      />
                    </div>
                    <span className="font-medium text-center leading-tight line-clamp-2">
                      {category.name}
                    </span>
                  </button>
                ))}
                {categories.length === 0 && (
                  <span className="text-sm text-gray-500">No categories available</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Products Display */}
        {filteredProducts.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-4"
          }>
            {filteredProducts.map((product, index) => {
              const stockInfo = getStockStatus(product.currentStock, product.lowStockValue);
              const StockIcon = stockInfo.icon;
              
              return viewMode === 'grid' ? (
                // Grid View
                <div key={product.productId} className="card card-hover group" style={{ animationDelay: `${index * 50}ms` }}>
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-100 rounded-xl mb-4 overflow-hidden">
                    {product.imageUrl ? (
                      <img 
                        src={getProductImageUrl(product.imageUrl)} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${product.imageUrl ? 'hidden' : ''}`}>
                      <div className="text-center">
                        <div className="text-4xl mb-2">{getCategoryIcon(product.categoryId)}</div>
                        <Package className="h-8 w-8 text-gray-400 mx-auto" />
                      </div>
                    </div>
                    
                    {/* Stock Status Badge */}
                    <div className={`absolute top-3 right-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockInfo.color}`}>
                      <StockIcon className="h-3 w-3 mr-1" />
                      {stockInfo.status}
                    </div>

                    {/* Quick Actions */}
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowProductModal(true);
                        }}
                        className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">{product.name}</h3>
                        <span className="text-xs text-gray-500 ml-2">{getCategoryName(product.categoryId)}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < Math.floor(product.rating || 4.5) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({product.reviewCount || 0})</span>
                    </div>

                    {/* Price and Stock */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-green-600">₹{product.price}</p>
                        <p className="text-xs text-gray-500">Stock: {product.currentStock} units</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      {user?.role === 'Customer' ? (
                        <>
                          {(() => {
                            const wishlisted = isInWishlist(product.productId);
                            return (
                              <>
                                <button
                                  onClick={() => addToCart(product.productId)}
                                  disabled={product.currentStock === 0}
                                  className={`flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-1 ${
                                    product.currentStock === 0 ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <ShoppingCart className="h-4 w-4" />
                                  {product.currentStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                </button>
                                <button
                                  onClick={() => toggleWishlist(product)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    wishlisted
                                      ? 'text-red-500 bg-red-50'
                                      : 'text-gray-400 hover:bg-red-50 hover:text-red-500'
                                  }`}
                                >
                                  <Heart className={`h-4 w-4 ${wishlisted ? 'fill-current' : ''}`} />
                                </button>
                              </>
                            );
                          })()}
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleEdit(product)}
                            className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-1"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(product.productId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // List View
                <div key={product.productId} className="card hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center gap-6">
                    {/* Product Image */}
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {product.imageUrl ? (
                        <img 
                          src={getProductImageUrl(product.imageUrl)} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">{product.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-lg font-bold text-green-600">₹{product.price}</span>
                            <span className="text-sm text-gray-500">Stock: {product.currentStock}</span>
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockInfo.color}`}>
                              <StockIcon className="h-3 w-3 mr-1" />
                              {stockInfo.status}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {user?.role === 'Customer' ? (
                            <>
                              {(() => {
                                const wishlisted = isInWishlist(product.productId);
                                return (
                                  <>
                                    <button
                                      onClick={() => addToCart(product.productId)}
                                      disabled={product.currentStock === 0}
                                      className={`btn-primary text-sm px-4 py-2 ${
                                        product.currentStock === 0 ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                    >
                                      Add to Cart
                                    </button>
                                    <button
                                      onClick={() => toggleWishlist(product)}
                                      className={`p-2 rounded-lg transition-colors ${
                                        wishlisted
                                          ? 'text-red-500 bg-red-50'
                                          : 'text-gray-400 hover:bg-red-50 hover:text-red-500'
                                      }`}
                                    >
                                      <Heart className={`h-4 w-4 ${wishlisted ? 'fill-current' : ''}`} />
                                    </button>
                                  </>
                                );
                              })()}
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleEdit(product)}
                                className="btn-primary text-sm px-4 py-2"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDelete(product.productId)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No products are currently available'
              }
            </p>
            {user?.role === 'StoreOwner' && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Your First Product
              </button>
            )}
          </div>
        )}

        {/* Pagination Controls (bottom only) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-6 mt-8 pb-8">
            {/* Page info */}
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>

            {/* Page numbers */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              
              <div className="flex items-center gap-2">
                {getVisiblePages().map((p, idx) => (
                  typeof p === 'number' ? (
                    <button
                      key={`page-${p}`}
                      onClick={() => setCurrentPage(p)}
                      className={`w-10 h-10 rounded-lg border text-sm font-medium transition-all ${
                        currentPage === p
                          ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 select-none">…</span>
                  )
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button 
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`input-field ${errors.name ? 'border-red-300' : ''}`}
                      placeholder="Enter product name"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className={`input-field resize-none ${errors.description ? 'border-red-300' : ''}`}
                      placeholder="Enter product description"
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className={`input-field ${errors.price ? 'border-red-300' : ''}`}
                      placeholder="0.00"
                    />
                    {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id.toString()}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Current Stock *
                    </label>
                    <input
                      type="number"
                      name="currentStock"
                      value={formData.currentStock}
                      onChange={handleInputChange}
                      min="0"
                      className={`input-field ${errors.currentStock ? 'border-red-300' : ''}`}
                      placeholder="0"
                    />
                    {errors.currentStock && <p className="mt-1 text-sm text-red-600">{errors.currentStock}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Low Stock Alert *
                    </label>
                    <input
                      type="number"
                      name="lowStockValue"
                      value={formData.lowStockValue}
                      onChange={handleInputChange}
                      min="0"
                      className={`input-field ${errors.lowStockValue ? 'border-red-300' : ''}`}
                      placeholder="0"
                    />
                    {errors.lowStockValue && <p className="mt-1 text-sm text-red-600">{errors.lowStockValue}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Product Image
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        name="imageFile"
                        onChange={handleInputChange}
                        accept="image/*"
                        className="hidden"
                        id="imageUpload"
                      />
                      <label htmlFor="imageUpload" className="cursor-pointer">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload product image</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Product Detail Modal */}
        {showProductModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Product Details</h3>
                <button 
                  onClick={() => setShowProductModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                  {selectedProduct.imageUrl ? (
                    <img 
                      src={getProductImageUrl(selectedProduct.imageUrl)} 
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-4">{getCategoryIcon(selectedProduct.categoryId)}</div>
                        <Package className="h-16 w-16 text-gray-400 mx-auto" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h1>
                    <p className="text-gray-600">{selectedProduct.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-5 w-5 ${i < Math.floor(selectedProduct.rating || 4.5) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-gray-600">({selectedProduct.reviewCount || 0} reviews)</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-600">Price</span>
                      <span className="text-2xl font-bold text-green-600">₹{selectedProduct.price}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-600">Category</span>
                      <span className="font-medium">{getCategoryIcon(selectedProduct.categoryId)} {getCategoryName(selectedProduct.categoryId)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-600">Stock</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{selectedProduct.currentStock} units</span>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStockStatus(selectedProduct.currentStock, selectedProduct.lowStockValue).color}`}>
                          {getStockStatus(selectedProduct.currentStock, selectedProduct.lowStockValue).status}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-6">
                    {user?.role === 'Customer' ? (
                      <>
                        {(() => {
                          const wishlisted = isInWishlist(selectedProduct.productId);
                          return (
                            <>
                              <button
                                onClick={() => {
                                  addToCart(selectedProduct.productId);
                                  setShowProductModal(false);
                                }}
                                disabled={selectedProduct.currentStock === 0}
                                className={`flex-1 btn-primary flex items-center justify-center gap-2 ${
                                  selectedProduct.currentStock === 0 ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                <ShoppingCart className="h-5 w-5" />
                                {selectedProduct.currentStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                              </button>
                              <button
                                onClick={() => toggleWishlist(selectedProduct)}
                                className={`btn-secondary flex items-center justify-center gap-2 ${
                                  wishlisted ? 'border-red-200 text-red-500' : ''
                                }`}
                              >
                                <Heart className={`h-5 w-5 ${wishlisted ? 'fill-current' : ''}`} />
                                {wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                              </button>
                            </>
                          );
                        })()}
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => {
                            handleEdit(selectedProduct);
                            setShowProductModal(false);
                          }}
                          className="flex-1 btn-primary flex items-center justify-center gap-2"
                        >
                          <Edit className="h-5 w-5" />
                          Edit Product
                        </button>
                        <button 
                          onClick={() => {
                            handleDelete(selectedProduct.productId);
                            setShowProductModal(false);
                          }}
                          className="btn-danger flex items-center justify-center gap-2"
                        >
                          <Trash2 className="h-5 w-5" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CustomerProducts;

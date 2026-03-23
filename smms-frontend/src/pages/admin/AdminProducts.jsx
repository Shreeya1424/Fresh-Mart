import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { showConfirm } from '../../utils/notifications';
import Layout from '../../components/Layout';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  Store,
  BarChart3,
  Truck,
  Database,
  Settings,
  UserCheck,
  MapPin,
  Shield,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  Tag,
  Image,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { productAPI, categoryAPI, subCategoryAPI } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newProductImageFile, setNewProductImageFile] = useState(null);
  const [newProductImagePreview, setNewProductImagePreview] = useState('');
  const [editProductImageFile, setEditProductImageFile] = useState(null);
  const [editProductImagePreview, setEditProductImagePreview] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    description: '',
    price: '',
    currentStock: '',
    lowStockValue: '',
    categoryId: '',
    subCategoryId: '',
    imageUrl: '',
    isActive: true,
    isFeatured: false
  });

  const unwrap = (response) => response?.data?.data ?? response?.data;

  const activeCategories = useMemo(
    () => (categories || []).filter((c) => c.isActive),
    [categories]
  );

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3, current: false },
    { name: 'Products', href: '/admin/products', icon: Package, current: true },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, current: false },
    { name: 'Customers', href: '/admin/customers', icon: UserCheck, current: false },
    { name: 'Delivery Staff', href: '/admin/delivery-staff', icon: Truck, current: false },
    { name: 'Categories', href: '/admin/categories', icon: Database, current: false },
    { name: 'Zones', href: '/admin/zones', icon: MapPin, current: false },
    { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
  ];

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  useEffect(() => {
    return () => {
      if (newProductImagePreview) URL.revokeObjectURL(newProductImagePreview);
      if (editProductImagePreview) URL.revokeObjectURL(editProductImagePreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newProductImagePreview, editProductImagePreview]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Determine categoryId for API call
      let apiCategoryId = null;
      if (categoryFilter !== 'All') {
        const cat = categories.find(c => c.name === categoryFilter);
        if (cat) apiCategoryId = cat.categoryId;
      }

      const [productsRes, categoriesRes, subCategoriesRes] = await Promise.all([
        productAPI.getAll(currentPage, pageSize, searchTerm, apiCategoryId),
        categoryAPI.getAll(),
        subCategoryAPI.getAll()
      ]);
      
      const rawProducts = productsRes.data;
      const productsData = Array.isArray(rawProducts) ? rawProducts : (rawProducts?.data ?? []);
      const pagination = Array.isArray(rawProducts) ? null : rawProducts?.pagination;

      const categoriesData = Array.isArray(categoriesRes.data) ? categoriesRes.data : categoriesRes.data?.data ?? [];
      const subCategoriesData = Array.isArray(subCategoriesRes.data) ? subCategoriesRes.data : subCategoriesRes.data?.data ?? [];
      
      setProducts(productsData);
      setCategories(categoriesData);
      setSubCategories(subCategoriesData);

      if (pagination && Number.isFinite(pagination.totalPages)) {
        setTotalPages(pagination.totalPages);
      } else {
        const inferredTotal = Array.isArray(rawProducts) ? rawProducts.length : (rawProducts?.totalCount ?? productsData.length);
        setTotalPages(Math.max(1, Math.ceil((inferredTotal || 0) / pageSize)));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setProducts([]);
      setCategories([]);
      setSubCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products || [];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'All') {
      filtered = filtered.filter(product => {
        const category = categories.find(cat => cat.categoryId === product.categoryId);
        return category?.name === categoryFilter;
      });
    }

    // Status filter
    if (statusFilter !== 'All') {
      const isActive = statusFilter === 'Active';
      filtered = filtered.filter(product => product.isActive === isActive);
    }

    setFilteredProducts(filtered);
  };

  const handleFileSelect = (file, type) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (type === 'add') {
      if (newProductImagePreview) URL.revokeObjectURL(newProductImagePreview);
      setNewProductImageFile(file);
      setNewProductImagePreview(previewUrl);
      return;
    }
    if (editProductImagePreview) URL.revokeObjectURL(editProductImagePreview);
    setEditProductImageFile(file);
    setEditProductImagePreview(previewUrl);
  };

  const handleAddProduct = async () => {
    try {
      // Validate required fields
      if (!newProduct.name || !newProduct.price || !newProduct.categoryId) {
        toast.error('Please fill in all required fields (Name, Price, Category)');
        return;
      }
      if (newProduct.name.trim().length < 3) {
        toast.error('Product name must be at least 3 characters.');
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Session expired. Please login again.');
        return;
      }

      setSaving(true);

      // Prepare data for API (match backend ProductDto)
      const productData = {
        name: String(newProduct.name || '').trim(),
        brand: newProduct.brand || null,
        categoryId: parseInt(newProduct.categoryId, 10),
        price: parseFloat(newProduct.price),
        description: newProduct.description || null,
        isFeatured: Boolean(newProduct.isFeatured),
        imageUrl: String(newProduct.imageUrl || '').substring(0, 300) || '',
        currentStock: parseInt(newProduct.currentStock, 10) || 0,
        lowStockValue: parseInt(newProduct.lowStockValue, 10) || 0,
        isActive: Boolean(newProduct.isActive !== false),
        storeOwnerId: 0,
        subCategoryId: newProduct.subCategoryId ? parseInt(newProduct.subCategoryId, 10) : null
      };

      console.log('📤 Sending product data to backend:', productData);

      const createRes = await productAPI.create(productData);
      const created = unwrap(createRes);
      
      if (!created || !created.productId) {
        throw new Error('Product creation failed - no product ID returned from backend.');
      }

      console.log('✅ Product created successfully:', created);

      let finalProduct = created;
      if (newProductImageFile) {
        try {
          console.log('📤 Uploading image for product:', created.productId);
          const uploadRes = await productAPI.uploadImage(created.productId, newProductImageFile);
          finalProduct = unwrap(uploadRes) || finalProduct;
          console.log('✅ Image uploaded successfully');
        } catch (uploadError) {
          console.error('❌ Image upload failed, but product was created:', uploadError);
          toast.error('Product created, but image upload failed. You can try uploading the image again by editing the product.');
        }
      }

      setProducts([...(products || []), finalProduct]);
      setShowAddModal(false);
      setNewProduct({
        name: '',
        brand: '',
        description: '',
        price: '',
        currentStock: '',
        lowStockValue: '',
        categoryId: '',
        imageUrl: '',
        isActive: true,
        isFeatured: false
      });
      setNewProductImageFile(null);
      if (newProductImagePreview) URL.revokeObjectURL(newProductImagePreview);
      setNewProductImagePreview('');
      toast.success('Product added successfully!');
    } catch (error) {
      console.error('❌ Error adding product:', error);
      
      let errorMsg = 'Unknown error occurred';
      if (error.response?.data?.errors) {
        // Handle FluentValidation errors
        errorMsg = Object.values(error.response.data.errors).flat().join('\n');
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      console.error('🔍 API Error details:', {
        status: error.response?.status,
        data: error.response?.data
      });
      
      toast.error(`Error adding product:\n${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = async () => {
    try {
      // Validate required fields
      if (!selectedProduct.name || !selectedProduct.price || !selectedProduct.categoryId) {
        toast.error('Please fill in all required fields (Name, Price, Category)');
        return;
      }

      setSaving(true);
      
      // Prepare data for API (match backend ProductDto)
      const productData = {
        productId: selectedProduct.productId,
        name: String(selectedProduct.name || '').trim(),
        brand: selectedProduct.brand || null,
        categoryId: parseInt(selectedProduct.categoryId, 10) || 0,
        price: parseFloat(selectedProduct.price) || 0,
        description: selectedProduct.description || null,
        isFeatured: Boolean(selectedProduct.isFeatured),
        imageUrl: String(selectedProduct.imageUrl || '').substring(0, 300),
        currentStock: parseInt(selectedProduct.currentStock, 10) || 0,
        lowStockValue: parseInt(selectedProduct.lowStockValue, 10) || 0,
        isActive: Boolean(selectedProduct.isActive),
        storeOwnerId: selectedProduct.storeOwnerId || 0,
        subCategoryId: selectedProduct.subCategoryId ? parseInt(selectedProduct.subCategoryId, 10) : null
      };

      const updateRes = await productAPI.update(selectedProduct.productId, productData);
      let updated = unwrap(updateRes) || selectedProduct;

      if (editProductImageFile) {
        const uploadRes = await productAPI.uploadImage(selectedProduct.productId, editProductImageFile);
        updated = unwrap(uploadRes) || updated;
      }

      setProducts((products || []).map((p) =>
        p.productId === selectedProduct.productId ? updated : p
      ));
      setShowEditModal(false);
      setSelectedProduct(null);
      setEditProductImageFile(null);
      if (editProductImagePreview) URL.revokeObjectURL(editProductImagePreview);
      setEditProductImagePreview('');
      toast.success('Product updated successfully!');
    } catch (error) {
      console.error('❌ Error updating product:', error);
      console.error('🔍 API Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        data: error.response?.data
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      toast.error(`Error updating product: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    const isConfirmed = await showConfirm(
      'Are you sure?',
      'You are about to delete this product. This action cannot be undone.',
      'warning'
    );
    if (!isConfirmed) return;
    
    try {
      console.log('🗑️ Deleting product via API:', productId);
      console.log('🔗 DELETE to: http://localhost:5200/api/Product/' + productId);
      
      await productAPI.delete(productId);
      
      console.log('✅ Product deleted successfully from API');
      setProducts(products.filter(product => product.productId !== productId));
      toast.success('Product deleted successfully!');
      
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      console.error('🔍 API Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        data: error.response?.data
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      toast.error(`Error deleting product: ${errorMessage}`);
    }
  };

  const toggleProductStatus = async (product) => {
    try {
      const updatedProduct = { 
        ...product, 
        isActive: !product.isActive,
        price: parseFloat(product.price),
        currentStock: parseInt(product.currentStock) || 0,
        lowStockValue: parseInt(product.lowStockValue) || 0,
        categoryId: parseInt(product.categoryId)
      };
      
      console.log('🔄 Toggling product status via API:', updatedProduct);
      console.log('🔗 PUT to: http://localhost:5200/api/Product/' + product.productId);
      
      const response = await productAPI.update(product.productId, updatedProduct);
      const productData = response?.data?.data || response?.data;
      
      if (productData) {
        console.log('✅ Product status updated successfully:', productData);
        setProducts(products.map(p => 
          p.productId === product.productId ? productData : p
        ));
        
        const statusText = updatedProduct.isActive ? 'activated' : 'deactivated';
        toast.success(`Product ${statusText} successfully!`);
      }
    } catch (error) {
      console.error('❌ Error updating product status:', error);
      console.error('🔍 API Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        data: error.response?.data
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      toast.error(`Error updating product status: ${errorMessage}`);
    }
  };

  const getStockStatus = (product) => {
    if (product.currentStock <= 0) {
      return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    } else if (product.currentStock <= product.lowStockValue) {
      return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.categoryId === categoryId);
    return category?.name || 'Unknown';
  };

  const getSubCategoriesForCategory = (categoryId) => {
    if (!categoryId) return [];
    return subCategories.filter(sub => sub.categoryId === parseInt(categoryId, 10));
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
    return <LoadingSpinner text="Loading products..." />;
  }

  return (
    <Layout navigation={navigation} title="Product Management">
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-7 w-7 text-green-600" />
              Product Management
            </h2>
            <p className="text-gray-600">Manage all products across the platform</p>
            <p className="text-sm text-gray-500 mt-1">
              API: http://localhost:5200/api/Product
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              <Package className="h-4 w-4" />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add New Product
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card-gradient rounded-2xl p-6 shadow-soft border border-gray-200/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none"
              >
                <option value="All">All Categories</option>
                {categories.map(category => (
                  <option key={category.categoryId} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-center bg-green-50 rounded-lg px-4 py-2">
              <span className="text-green-700 font-semibold">
                {filteredProducts.length} products found
              </span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => {
            const stockStatus = getStockStatus(product);
            return (
              <div key={product.productId} className="card-gradient rounded-2xl shadow-soft border border-gray-200/50 overflow-hidden hover:shadow-lg transition-all duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                {/* Product Image */}
                <div className="relative h-48 bg-gray-100">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
                    <span className="text-lg font-bold text-green-600">₹{product.price}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                      {stockStatus.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Category:</span>
                      <span className="font-medium">{getCategoryName(product.categoryId)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Stock:</span>
                      <span className="font-medium">{product.currentStock} units</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Created:</span>
                      <span className="font-medium">{new Date(product.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowEditModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => toggleProductStatus(product)}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                        product.isActive 
                          ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' 
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {product.isActive ? (
                        <>
                          <XCircle className="h-4 w-4" />
                          Disable
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Enable
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.productId)}
                      className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-6 mt-8 pb-8">
            <div className="text-sm text-gray-600 font-medium">
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-2">
                {getVisiblePages().map((p, idx) => (
                  typeof p === 'number' ? (
                    <button
                      key={`page-${p}`}
                      onClick={() => setCurrentPage(p)}
                      className={`w-10 h-10 rounded-xl border text-sm font-bold transition-all shadow-sm ${
                        currentPage === p
                          ? 'bg-green-600 border-green-600 text-white shadow-green-200'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 select-none font-bold">…</span>
                  )
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-medium">No products found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Plus className="h-6 w-6 text-green-600" />
                Add New Product
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input
                  type="text"
                  value={newProduct.brand}
                  onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter brand name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter product description"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.currentStock}
                    onChange={(e) => setNewProduct({...newProduct, currentStock: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert Level</label>
                <input
                  type="number"
                  min="0"
                  value={newProduct.lowStockValue}
                  onChange={(e) => setNewProduct({...newProduct, lowStockValue: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Alert when stock is below this number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => {
                      const catId = e.target.value;
                      setNewProduct({...newProduct, categoryId: catId, subCategoryId: ''});
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {activeCategories.map(category => (
                      <option key={category.categoryId} value={category.categoryId}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Category</label>
                  <select
                    value={newProduct.subCategoryId}
                    onChange={(e) => setNewProduct({...newProduct, subCategoryId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={!newProduct.categoryId}
                  >
                    <option value="">Select Sub-Category</option>
                    {getSubCategoriesForCategory(newProduct.categoryId).map(sub => (
                      <option key={sub.subCategoryId} value={sub.subCategoryId}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files?.[0], 'add')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {(newProductImagePreview || newProduct.imageUrl) && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Preview</p>
                    <img
                      src={newProductImagePreview || newProduct.imageUrl}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = 'https://via.placeholder.com/400x300?text=Invalid+URL';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Or Image URL</label>
                <input
                  type="url"
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newProduct.isActive}
                  onChange={(e) => setNewProduct({...newProduct, isActive: e.target.checked})}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active Product
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit className="h-6 w-6 text-green-600" />
                Edit Product
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={selectedProduct.name}
                  onChange={(e) => setSelectedProduct({...selectedProduct, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input
                  type="text"
                  value={selectedProduct.brand || ''}
                  onChange={(e) => setSelectedProduct({...selectedProduct, brand: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={selectedProduct.description}
                  onChange={(e) => setSelectedProduct({...selectedProduct, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={selectedProduct.price}
                    onChange={(e) => setSelectedProduct({...selectedProduct, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={selectedProduct.currentStock}
                    onChange={(e) => setSelectedProduct({...selectedProduct, currentStock: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert Level</label>
                <input
                  type="number"
                  min="0"
                  value={selectedProduct.lowStockValue}
                  onChange={(e) => setSelectedProduct({...selectedProduct, lowStockValue: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={selectedProduct.categoryId}
                    onChange={(e) => {
                      const catId = e.target.value;
                      setSelectedProduct({...selectedProduct, categoryId: catId, subCategoryId: ''});
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {activeCategories.map(category => (
                      <option key={category.categoryId} value={category.categoryId}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Category</label>
                  <select
                    value={selectedProduct.subCategoryId || ''}
                    onChange={(e) => setSelectedProduct({...selectedProduct, subCategoryId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={!selectedProduct.categoryId}
                  >
                    <option value="">Select Sub-Category</option>
                    {getSubCategoriesForCategory(selectedProduct.categoryId).map(sub => (
                      <option key={sub.subCategoryId} value={sub.subCategoryId}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload New Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files?.[0], 'edit')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {(editProductImagePreview || selectedProduct.imageUrl) && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Preview</p>
                    <img
                      src={editProductImagePreview || selectedProduct.imageUrl}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = 'https://via.placeholder.com/400x300?text=Invalid+URL';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Or Image URL</label>
                <input
                  type="url"
                  value={selectedProduct.imageUrl}
                  onChange={(e) => setSelectedProduct({...selectedProduct, imageUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={selectedProduct.isActive}
                  onChange={(e) => setSelectedProduct({...selectedProduct, isActive: e.target.checked})}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="editIsActive" className="ml-2 block text-sm text-gray-700">
                  Active Product
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditProduct}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Update Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminProducts;

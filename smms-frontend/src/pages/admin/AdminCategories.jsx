import { useState, useEffect } from 'react';
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
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Tag,
  Calendar
} from 'lucide-react';
import { categoryAPI } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    iconName: '',
    isActive: true
  });

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3, current: false },
    { name: 'Products', href: '/admin/products', icon: Package, current: false },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, current: false },
    { name: 'Customers', href: '/admin/customers', icon: UserCheck, current: false },
    { name: 'Delivery Staff', href: '/admin/delivery-staff', icon: Truck, current: false },
    { name: 'Categories', href: '/admin/categories', icon: Database, current: true },
    { name: 'Zones', href: '/admin/zones', icon: MapPin, current: false },
    { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [categories, searchTerm, statusFilter]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getAll();
      const list = Array.isArray(response?.data) ? response.data : response?.data?.data ?? [];
      setCategories(list);
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      setCategories([]);
      toast.error('Failed to load categories from server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    let filtered = categories || [];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      const isActive = statusFilter === 'Active';
      filtered = filtered.filter(category => category.isActive === isActive);
    }

    setFilteredCategories(filtered);
  };

  const handleAddCategory = async () => {
    try {
      console.log('➕ Adding new category:', newCategory);
      
      const response = await categoryAPI.create({
        name: newCategory.name,
        description: newCategory.description,
        isActive: newCategory.isActive,
        iconName: newCategory.iconName || null
      });
      const categoryData = response?.data?.data || response?.data;
      if (categoryData) {
        await fetchCategories(); // Re-fetch to get nested data correctly
        setShowAddModal(false);
        setNewCategory({
          name: '',
          description: '',
          iconName: '',
          isActive: true
        });
        console.log('✅ Category added successfully');
        toast.success('Category added successfully!');
      }
    } catch (error) {
      console.error('❌ Error adding category:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.errors 
        ? Object.values(error.response.data.errors).flat().join('\n')
        : error.message;
      toast.error('Error adding category:\n' + errorMsg);
    }
  };

  const handleEditCategory = async () => {
    try {
      console.log('✏️ Updating category:', selectedCategory);
      
      const response = await categoryAPI.update(selectedCategory.categoryId, {
        name: selectedCategory.name,
        description: selectedCategory.description,
        isActive: selectedCategory.isActive,
        iconName: selectedCategory.iconName || null
      });
      const categoryData = response?.data?.data || response?.data;
      if (categoryData) {
        await fetchCategories(); // Re-fetch to get nested data correctly
        setShowEditModal(false);
        setSelectedCategory(null);
        console.log('✅ Category updated successfully');
        toast.success('Category updated successfully!');
      }
    } catch (error) {
      console.error('❌ Error updating category:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.errors 
        ? Object.values(error.response.data.errors).flat().join('\n')
        : error.message;
      toast.error('Error updating category:\n' + errorMsg);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const isConfirmed = await showConfirm(
      'Are you sure?',
      'Do you really want to delete this category? This action cannot be undone.',
      'warning'
    );
    if (!isConfirmed) return;
    
    try {
      console.log('🗑️ Deleting category:', categoryId);
      
      await categoryAPI.delete(categoryId);
      setCategories(categories.filter(category => category.categoryId !== categoryId));
      console.log('✅ Category deleted successfully');
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting category:', error);
      toast.error('Error deleting category. Please try again.');
    }
  };

  const toggleCategoryStatus = async (category) => {
    try {
      const updatedCategory = { ...category, isActive: !category.isActive };
      console.log('🔄 Toggling category status:', updatedCategory);
      
      const response = await categoryAPI.update(category.categoryId, updatedCategory);
      const categoryData = response?.data?.data || response?.data;
      if (categoryData) {
        setCategories(categories.map(c => 
          c.categoryId === category.categoryId ? categoryData : c
        ));
        console.log('✅ Category status updated successfully');
        toast.success(`Category ${category.isActive ? 'disabled' : 'enabled'} successfully`);
      }
    } catch (error) {
      console.error('❌ Error updating category status:', error);
      toast.error('Error updating category status. Please try again.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading categories..." />;
  }

  return (
    <Layout navigation={navigation} title="Category Management">
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Database className="h-7 w-7 text-indigo-600" />
              Category Management
            </h2>
            <p className="text-gray-600">Manage product categories and classifications</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add New Category
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Total Categories',
              value: (categories || []).length,
              icon: Database,
              color: 'indigo',
              bgColor: 'bg-indigo-50',
              textColor: 'text-indigo-600'
            },
            {
              title: 'Active Categories',
              value: (categories || []).filter(c => c.isActive).length,
              icon: CheckCircle,
              color: 'green',
              bgColor: 'bg-green-50',
              textColor: 'text-green-600'
            },
            {
              title: 'Inactive Categories',
              value: (categories || []).filter(c => !c.isActive).length,
              icon: XCircle,
              color: 'red',
              bgColor: 'bg-red-50',
              textColor: 'text-red-600'
            }
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.title} className="card-gradient rounded-2xl p-6 shadow-soft border border-gray-200/50" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 ${stat.bgColor} rounded-xl`}>
                    <IconComponent className={`h-6 w-6 ${stat.textColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="card-gradient rounded-2xl p-6 shadow-soft border border-gray-200/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-center bg-indigo-50 rounded-lg px-4 py-2">
              <span className="text-indigo-700 font-semibold">
                {filteredCategories.length} categories found
              </span>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category, index) => (
            <div key={category.categoryId} className="card-gradient rounded-2xl shadow-soft border border-gray-200/50 overflow-hidden hover:shadow-lg transition-all duration-300" style={{ animationDelay: `${index * 50}ms` }}>
              {/* Category Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                      <Tag className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-500">ID: {category.categoryId}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">{category.description || 'No description available'}</p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {new Date(category.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowEditModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => toggleCategoryStatus(category)}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                      category.isActive 
                        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' 
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {category.isActive ? (
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
                    onClick={() => handleDeleteCategory(category.categoryId)}
                    className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-medium">No categories found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Plus className="h-6 w-6 text-indigo-600" />
                Add New Category
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter category description"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Image URL</label>
                <input
                  type="text"
                  value={newCategory.iconName}
                  onChange={(e) => setNewCategory({...newCategory, iconName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://example.com/image.jpg or /uploads/categories/icon.png"
                />
                {newCategory.iconName ? (
                  <div className="mt-2 w-24 h-24 rounded-xl overflow-hidden border">
                    <img
                      src={newCategory.iconName.startsWith('/') ? `http://localhost:5200${newCategory.iconName}` : newCategory.iconName}
                      alt="Category preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display='none'; }}
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newCategory.isActive}
                  onChange={(e) => setNewCategory({...newCategory, isActive: e.target.checked})}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active Category
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
                onClick={handleAddCategory}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit className="h-6 w-6 text-indigo-600" />
                Edit Category
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={selectedCategory.name}
                  onChange={(e) => setSelectedCategory({...selectedCategory, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={selectedCategory.description}
                  onChange={(e) => setSelectedCategory({...selectedCategory, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Image URL</label>
                <input
                  type="text"
                  value={selectedCategory.iconName || ''}
                  onChange={(e) => setSelectedCategory({...selectedCategory, iconName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://example.com/image.jpg or /uploads/categories/icon.png"
                />
                {selectedCategory.iconName ? (
                  <div className="mt-2 w-24 h-24 rounded-xl overflow-hidden border">
                    <img
                      src={selectedCategory.iconName.startsWith('/') ? `http://localhost:5200${selectedCategory.iconName}` : selectedCategory.iconName}
                      alt="Category preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display='none'; }}
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={selectedCategory.isActive}
                  onChange={(e) => setSelectedCategory({...selectedCategory, isActive: e.target.checked})}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="editIsActive" className="ml-2 block text-sm text-gray-700">
                  Active Category
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
                onClick={handleEditCategory}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Update Category
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminCategories;

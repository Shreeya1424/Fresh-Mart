import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import {
  Store,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Edit,
  Save,
  X,
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  Camera,
  Truck,
  Database
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { productAPI, orderAPI, customerAPI } from '../../api';

const StoreOwnerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const navigation = [
    { name: 'Dashboard', href: '/store-owner/dashboard', icon: BarChart3, current: false },
    { name: 'Products', href: '/store-owner/products', icon: Package, current: false },
    { name: 'Categories', href: '/admin/categories', icon: Database, current: false },
    { name: 'Orders', href: '/store-owner/orders', icon: ShoppingCart, current: false },
    { name: 'Customers', href: '/store-owner/customers', icon: Users, current: false },
    { name: 'Delivery Staff', href: '/store-owner/delivery-staff', icon: Truck, current: false },
    { name: 'Store Profile', href: '/store-owner/profile', icon: Store, current: true },
  ];

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);

        const defaultProfile = {
          storeId: 1,
          storeName: 'Fresh Mart Store',
          ownerName: 'Manojbhai Dhol',
          email: 'owner@gmail.com',
          phone: '+91 9876543210',
          address: '123 Market Street, Rajkot, Gujarat 360311',
          description: 'Your neighborhood grocery store with fresh produce and daily essentials.',
          openingHours: '8:00 AM - 10:00 PM',
          rating: 4.5,
          totalReviews: 128,
          joinDate: '2023-06-15',
          totalProducts: 0,
          totalOrders: 0,
          totalCustomers: 0
        };

        const [productsResponse, ordersResponse, customersResponse] = await Promise.allSettled([
          productAPI.getAll(),
          orderAPI.getAll(),
          customerAPI.getAll()
        ]);

        const toList = (response) => {
          if (!response) return [];
          if (Array.isArray(response.data)) return response.data;
          if (Array.isArray(response.data?.data)) return response.data.data;
          return [];
        };

        const products =
          productsResponse.status === 'fulfilled' ? toList(productsResponse.value) : [];
        const orders =
          ordersResponse.status === 'fulfilled' ? toList(ordersResponse.value) : [];
        const customers =
          customersResponse.status === 'fulfilled' ? toList(customersResponse.value) : [];

        const profileData = {
          ...defaultProfile,
          totalProducts: products.length,
          totalOrders: orders.length,
          totalCustomers: customers.length
        };

        setProfile(profileData);
        setFormData(profileData);
      } catch (error) {
        console.error('Error loading store profile data:', error);
        const fallbackProfile = {
          storeId: 1,
          storeName: 'Fresh Mart Store',
          ownerName: 'Manojbhai Dhol',
          email: 'owner@gmail.com',
          phone: '+91 9876543210',
          address: '123 Market Street, Rajkot, Gujarat 360311',
          description: 'Your neighborhood grocery store with fresh produce and daily essentials.',
          openingHours: '8:00 AM - 10:00 PM',
          rating: 4.5,
          totalReviews: 128,
          joinDate: '2023-06-15',
          totalProducts: 0,
          totalOrders: 0,
          totalCustomers: 0
        };
        setProfile(fallbackProfile);
        setFormData(fallbackProfile);
        toast.error('Failed to load store statistics from server. Showing default values.');
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, []);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = () => {
    setProfile(formData);
    setEditing(false);
    // Here you would typically make an API call to save the data
  };

  const handleCancel = () => {
    setFormData(profile);
    setEditing(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return <LoadingSpinner text="Loading profile..." fullScreen />;
  }

  return (
    <Layout navigation={navigation} title="Store Profile">
      <div className="space-y-6 fade-in">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Store Profile</h1>
            <p className="text-gray-600">Manage your store information and settings</p>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button 
                  onClick={handleCancel}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              </>
            ) : (
              <button 
                onClick={handleEdit}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <div className="card">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Store Image */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white relative group">
                <Store className="h-16 w-16" />
                {editing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Store Info */}
            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.storeName}
                      onChange={(e) => handleInputChange('storeName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{profile.storeName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.ownerName}
                      onChange={(e) => handleInputChange('ownerName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-lg text-gray-900">{profile.ownerName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="flex items-center text-gray-900">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {profile.email}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="flex items-center text-gray-900">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {profile.phone}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  {editing ? (
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="flex items-start text-gray-900">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                      {profile.address}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  {editing ? (
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Hours
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.openingHours}
                      onChange={(e) => handleInputChange('openingHours', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="flex items-center text-gray-900">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      {profile.openingHours}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex items-center text-gray-900">
                    <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                    {profile.rating} ({profile.totalReviews} reviews)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{profile.totalProducts}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{profile.totalOrders}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{profile.totalCustomers}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StoreOwnerProfile;

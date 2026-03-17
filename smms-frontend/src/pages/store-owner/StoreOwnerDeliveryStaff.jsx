import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { 
  Users, 
  Package, 
  ShoppingCart,
  Store,
  BarChart3,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  X,
  Database
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { showConfirm } from '../../utils/notifications';

const StoreOwnerDeliveryStaff = () => {
  const [deliveryStaff, setDeliveryStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    licenseNumber: '',
    vehicleType: 'Bike',
    vehicleNumber: ''
  });
  const [errors, setErrors] = useState({});

  const navigation = [
    { name: 'Dashboard', href: '/store-owner/dashboard', icon: BarChart3, current: false },
    { name: 'Products', href: '/store-owner/products', icon: Package, current: false },
    { name: 'Categories', href: '/admin/categories', icon: Database, current: false },
    { name: 'Orders', href: '/store-owner/orders', icon: ShoppingCart, current: false },
    { name: 'Customers', href: '/store-owner/customers', icon: Users, current: false },
    { name: 'Delivery Staff', href: '/store-owner/delivery-staff', icon: Truck, current: true },
    { name: 'Store Profile', href: '/store-owner/profile', icon: Store, current: false },
  ];

  function loadDeliveryStaff() {
    setTimeout(() => {
      const storedStaff = JSON.parse(localStorage.getItem('deliveryStaff') || '[]');
      
      // If no staff in storage, add some sample data
      if (storedStaff.length === 0) {
        const sampleStaff = [
          {
            staffId: 1,
            name: 'Rajesh Kumar',
            email: 'rajesh.delivery@smms.com',
            phone: '+91 9876543220',
            address: 'Sector 15, Noida - 201301',
            licenseNumber: 'DL1420110012345',
            vehicleType: 'Bike',
            vehicleNumber: 'UP16AB1234',
            joinDate: '2024-01-05T00:00:00.000Z',
            status: 'Active',
            totalDeliveries: 45,
            rating: 4.8,
            currentOrders: 2
          },
          {
            staffId: 2,
            name: 'Priya Sharma',
            email: 'priya.delivery@smms.com',
            phone: '+91 9876543221',
            address: 'Andheri West, Mumbai - 400058',
            licenseNumber: 'MH0220110067890',
            vehicleType: 'Scooter',
            vehicleNumber: 'MH02CD5678',
            joinDate: '2024-01-10T00:00:00.000Z',
            status: 'Active',
            totalDeliveries: 32,
            rating: 4.6,
            currentOrders: 1
          }
        ];
        localStorage.setItem('deliveryStaff', JSON.stringify(sampleStaff));
        setDeliveryStaff(sampleStaff);
      } else {
        setDeliveryStaff(storedStaff);
      }
      
      setLoading(false);
    }, 500);
  }

  useEffect(() => {
    loadDeliveryStaff();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
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
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required';
    }

    if (!formData.vehicleNumber.trim()) {
      newErrors.vehicleNumber = 'Vehicle number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const nextStaffId = editingStaff 
      ? editingStaff.staffId 
      : ((deliveryStaff[deliveryStaff.length - 1]?.staffId ?? 0) + 1);

    const staffData = {
      ...formData,
      staffId: nextStaffId,
      joinDate: editingStaff ? editingStaff.joinDate : '2024-01-01T00:00:00.000Z',
      status: 'Active',
      totalDeliveries: editingStaff ? editingStaff.totalDeliveries : 0,
      rating: editingStaff ? editingStaff.rating : 5.0,
      currentOrders: editingStaff ? editingStaff.currentOrders : 0
    };

    const updatedStaff = editingStaff 
      ? deliveryStaff.map(staff => staff.staffId === editingStaff.staffId ? staffData : staff)
      : [...deliveryStaff, staffData];

    setDeliveryStaff(updatedStaff);
    localStorage.setItem('deliveryStaff', JSON.stringify(updatedStaff));
    
    toast.success(editingStaff ? 'Delivery staff updated successfully!' : 'Delivery staff added successfully!');
    handleCloseModal();
  };

  const handleEdit = (staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      address: staff.address,
      licenseNumber: staff.licenseNumber,
      vehicleType: staff.vehicleType,
      vehicleNumber: staff.vehicleNumber
    });
    setShowAddModal(true);
  };

  const handleDelete = async (staffId) => {
    const isConfirmed = await showConfirm(
      'Are you sure?',
      'Do you really want to delete this delivery staff member? This action cannot be undone.',
      'warning'
    );
    if (isConfirmed) {
      const updatedStaff = deliveryStaff.filter(staff => staff.staffId !== staffId);
      setDeliveryStaff(updatedStaff);
      localStorage.setItem('deliveryStaff', JSON.stringify(updatedStaff));
      toast.success('Delivery staff deleted successfully!');
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      licenseNumber: '',
      vehicleType: 'Bike',
      vehicleNumber: ''
    });
    setErrors({});
  };

  const filteredStaff = deliveryStaff.filter(staff =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.phone.includes(searchTerm)
  );

  if (loading) {
    return <LoadingSpinner text="Loading delivery staff..." fullScreen />;
  }

  return (
    <Layout navigation={navigation} title="Delivery Staff Management">
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Delivery Staff</h1>
            <p className="text-gray-600">Manage your delivery team members</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Delivery Staff
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{deliveryStaff.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Staff</p>
                <p className="text-2xl font-bold text-gray-900">
                  {deliveryStaff.filter(s => s.status === 'Active').length}
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
                <p className="text-sm font-medium text-gray-600">On Delivery</p>
                <p className="text-2xl font-bold text-gray-900">
                  {deliveryStaff.filter(s => s.currentOrders > 0).length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {deliveryStaff.reduce((sum, s) => sum + s.totalDeliveries, 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search delivery staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((staff, index) => (
            <div key={staff.staffId} className="card card-hover" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{staff.name}</h3>
                      <p className="text-sm text-gray-600">Staff #{staff.staffId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleEdit(staff)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(staff.staffId)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {staff.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {staff.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {staff.address}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Truck className="h-4 w-4 mr-2" />
                    {staff.vehicleType} - {staff.vehicleNumber}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Joined {new Date(staff.joinDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{staff.totalDeliveries}</p>
                    <p className="text-xs text-gray-600">Deliveries</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-yellow-600">★ {staff.rating}</p>
                    <p className="text-xs text-gray-600">Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-orange-600">{staff.currentOrders}</p>
                    <p className="text-xs text-gray-600">Active</p>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    staff.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {staff.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="text-center py-12">
            <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No delivery staff found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Try adjusting your search criteria'
                : 'Add delivery staff members to manage your delivery operations'
              }
            </p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add First Delivery Staff
            </button>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingStaff ? 'Edit Delivery Staff' : 'Add Delivery Staff'}
                </h3>
                <button 
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`input-field ${errors.name ? 'border-red-300' : ''}`}
                    placeholder="Enter full name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`input-field ${errors.email ? 'border-red-300' : ''}`}
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`input-field ${errors.phone ? 'border-red-300' : ''}`}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={2}
                    className={`input-field resize-none ${errors.address ? 'border-red-300' : ''}`}
                    placeholder="Enter complete address"
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number *
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    className={`input-field ${errors.licenseNumber ? 'border-red-300' : ''}`}
                    placeholder="Enter driving license number"
                  />
                  {errors.licenseNumber && <p className="mt-1 text-sm text-red-600">{errors.licenseNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Type *
                  </label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="Bike">Bike</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Car">Car</option>
                    <option value="Van">Van</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleInputChange}
                    className={`input-field ${errors.vehicleNumber ? 'border-red-300' : ''}`}
                    placeholder="Enter vehicle registration number"
                  />
                  {errors.vehicleNumber && <p className="mt-1 text-sm text-red-600">{errors.vehicleNumber}</p>}
                </div>

                <div className="flex gap-3 pt-4">
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
                    {editingStaff ? 'Update Staff' : 'Add Staff'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StoreOwnerDeliveryStaff;

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
  Mail,
  Phone,
  Calendar,
  User,
  MapPin as Location,
  Clock,
  Navigation
} from 'lucide-react';
import { deliveryStaffAPI, userAPI, zoneAPI } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminDeliveryStaff = () => {
  const [deliveryStaff, setDeliveryStaff] = useState([]);
  const [filteredDeliveryStaff, setFilteredDeliveryStaff] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [newStaff, setNewStaff] = useState({
    vehicleType: '',
    vehicleNumber: '',
    licenseNumber: '',
    zoneId: '',
    isAvailable: true,
    // User details
    userName: '',
    email: '',
    phone: '',
    password: '',
    isActive: true
  });

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3, current: false },
    { name: 'Products', href: '/admin/products', icon: Package, current: false },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, current: false },
    { name: 'Customers', href: '/admin/customers', icon: UserCheck, current: false },
    { name: 'Delivery Staff', href: '/admin/delivery-staff', icon: Truck, current: true },
    { name: 'Categories', href: '/admin/categories', icon: Database, current: false },
    { name: 'Zones', href: '/admin/zones', icon: MapPin, current: false },
    { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
  ];

  const normalizeStaff = (staff) => {
    const status = staff.status ?? staff.Status ?? 'Available';
    const employmentStatus = staff.employmentStatus ?? staff.EmploymentStatus ?? 'Active';
    const totalDeliveriesCompleted = staff.totalDeliveriesCompleted ?? staff.TotalDeliveriesCompleted ?? 0;
    const totalEarnings = staff.totalEarnings ?? staff.TotalEarnings ?? 0;

    return {
      ...staff,
      staffId: staff.staffId ?? staff.StaffId ?? staff.deliveryStaffId ?? staff.id,
      zoneId: staff.zoneId ?? staff.ZoneId,
      status,
      employmentStatus,
      totalDeliveriesCompleted,
      totalEarnings,
      isAvailable: status === 'Available'
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterDeliveryStaff();
  }, [deliveryStaff, searchTerm, statusFilter, availabilityFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🚚 Fetching delivery staff and zones from backend...');
      
      const [staffResponse, zonesResponse] = await Promise.allSettled([
        deliveryStaffAPI.getAll(),
        zoneAPI.getAll()
      ]);

      const toList = (res) => (Array.isArray(res?.data) ? res.data : res?.data?.data ?? []);
      if (staffResponse.status === 'fulfilled') {
        const list = toList(staffResponse.value).map(normalizeStaff);
        setDeliveryStaff(list);
      }
      if (zonesResponse.status === 'fulfilled') {
        setZones(toList(zonesResponse.value));
      }
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setDeliveryStaff([]);
      setZones([]);
      toast.error('Failed to load delivery staff data from server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterDeliveryStaff = () => {
    let filtered = deliveryStaff || [];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(staff =>
        staff.user?.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.user?.phone.includes(searchTerm) ||
        staff.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      const isActive = statusFilter === 'Active';
      filtered = filtered.filter(staff => staff.user?.isActive === isActive);
    }

    // Availability filter
    if (availabilityFilter !== 'All') {
      if (availabilityFilter === 'Available') {
        filtered = filtered.filter(staff => staff.status === 'Available');
      } else if (availabilityFilter === 'Busy') {
        filtered = filtered.filter(staff => staff.status !== 'Available');
      }
    }

    setFilteredDeliveryStaff(filtered);
  };

  const handleAddStaff = async () => {
    try {
      console.log('➕ Adding new delivery staff:', newStaff);
      
      // Basic validation
      if (!newStaff.userName || !newStaff.email || !newStaff.password || !newStaff.zoneId) {
        toast.error('Please fill in all required fields (Name, Email, Password, Zone)');
        return;
      }

      // First create user account
      const userResponse = await userAPI.create({
        userName: newStaff.userName,
        email: newStaff.email,
        phone: newStaff.phone,
        password: newStaff.password,
        role: 'DeliveryStaff',
        isActive: newStaff.isActive
      });

      // Extract user data from nested response
      const userData = userResponse?.data?.data || userResponse?.data;

      if (userData && userData.userId) {
        // Then create delivery staff profile
        const staffData = {
          userId: userData.userId,
          vehicleType: newStaff.vehicleType || 'Motorcycle',
          vehicleNumber: newStaff.vehicleNumber || 'Pending',
          licenseNumber: newStaff.licenseNumber || 'Pending',
          zoneId: parseInt(newStaff.zoneId),
          status: newStaff.isAvailable ? 'Available' : 'Busy',
          employmentStatus: 'Active',
          maxLoad: 10
        };

        const response = await deliveryStaffAPI.create(staffData);
        const createdStaff = response?.data?.data || response?.data;

        if (createdStaff) {
          await fetchData(); // Re-fetch to get complete object with User and Zone
          setShowAddModal(false);
          setNewStaff({
            vehicleType: '',
            vehicleNumber: '',
            licenseNumber: '',
            zoneId: '',
            isAvailable: true,
            userName: '',
            email: '',
            phone: '',
            password: '',
            isActive: true
          });
          console.log('✅ Delivery staff added successfully');
          toast.success('Delivery staff added successfully!');
        }
      }
    } catch (error) {
      console.error('❌ Error adding delivery staff:', error);
      const errorMsg = error.response?.data?.message || 
                       (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join('\n') : error.message);
      toast.error(`Error adding delivery staff:\n${errorMsg}`);
    }
  };

  const handleEditStaff = async () => {
    try {
      if (!selectedStaff) return;
      console.log('✏️ Updating delivery staff:', selectedStaff);
      
      // Match backend DeliveryStaffDTO
      const staffData = {
        staffId: selectedStaff.staffId,
        userId: selectedStaff.userId,
        zoneId: parseInt(selectedStaff.zoneId),
        vehicleType: selectedStaff.vehicleType,
        vehicleNumber: selectedStaff.vehicleNumber,
        licenseNumber: selectedStaff.licenseNumber,
        status: selectedStaff.status,
        maxLoad: selectedStaff.maxLoad,
        employmentStatus: selectedStaff.employmentStatus,
        totalDeliveriesCompleted: selectedStaff.totalDeliveriesCompleted,
        totalEarnings: selectedStaff.totalEarnings
      };

      const response = await deliveryStaffAPI.update(selectedStaff.staffId, staffData);
      if (response?.data) {
        await fetchData(); // Re-fetch to ensure UI is in sync
        setShowEditModal(false);
        setSelectedStaff(null);
        console.log('✅ Delivery staff updated successfully');
        toast.success('Delivery staff updated successfully!');
      }
    } catch (error) {
      console.error('❌ Error updating delivery staff:', error);
      const errorMsg = error.response?.data?.message || 
                       (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join('\n') : error.message);
      toast.error(`Error updating delivery staff:\n${errorMsg}`);
    }
  };

  const handleDeleteStaff = async (staffId) => {
    const isConfirmed = await showConfirm(
      'Are you sure?',
      'Do you really want to delete this delivery staff member? This action cannot be undone.',
      'warning'
    );
    if (!isConfirmed) return;
    
    try {
      console.log('🗑️ Deleting delivery staff:', staffId);
      
      await deliveryStaffAPI.delete(staffId);
      setDeliveryStaff(deliveryStaff.filter(staff => staff.staffId !== staffId));
      console.log('✅ Delivery staff deleted successfully');
      toast.success('Delivery staff deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting delivery staff:', error);
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(`Error deleting delivery staff:\n${errorMsg}`);
    }
  };

  const toggleStaffAvailability = async (staff) => {
    try {
      const isCurrentlyAvailable = staff.status === 'Available';
      const newStatus = isCurrentlyAvailable ? 'Busy' : 'Available';

      const staffData = {
        staffId: staff.staffId,
        userId: staff.userId,
        zoneId: staff.zoneId,
        vehicleType: staff.vehicleType,
        vehicleNumber: staff.vehicleNumber,
        licenseNumber: staff.licenseNumber,
        status: newStatus,
        maxLoad: staff.maxLoad ?? 5,
        employmentStatus: staff.employmentStatus ?? 'Active',
        totalDeliveriesCompleted: staff.totalDeliveriesCompleted ?? 0,
        totalEarnings: staff.totalEarnings ?? 0
      };

      console.log('🔄 Toggling staff availability:', staffData);
      
      const response = await deliveryStaffAPI.update(staff.staffId, staffData);
      if (response?.data) {
        const updatedRaw = response.data.data || response.data;
        const updatedMerged = normalizeStaff({
          ...staff,
          ...updatedRaw
        });

        setDeliveryStaff(
          deliveryStaff.map((s) =>
            s.staffId === staff.staffId ? updatedMerged : s
          )
        );
        console.log('✅ Staff availability updated successfully');
        toast.success(`Staff status set to ${newStatus}`);
      }
    } catch (error) {
      console.error('❌ Error updating staff availability:', error);
      toast.error('Error updating staff availability. Please try again.');
    }
  };

  const getZoneName = (zoneId) => {
    const zone = zones.find(z => z.zoneId === zoneId);
    return zone?.zoneName || 'Unknown Zone';
  };

  if (loading) {
    return <LoadingSpinner text="Loading delivery staff..." />;
  }

  return (
    <Layout navigation={navigation} title="Delivery Staff Management">
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="h-7 w-7 text-orange-600" />
              Delivery Staff Management
            </h2>
            <p className="text-gray-600">Manage delivery staff and their assignments</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Delivery Staff
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              title: 'Total Staff',
              value: deliveryStaff.length,
              icon: Truck,
              color: 'orange',
              bgColor: 'bg-orange-50',
              textColor: 'text-orange-600'
            },
            {
              title: 'Active Staff',
              value: deliveryStaff.filter(s => s.user?.isActive).length,
              icon: CheckCircle,
              color: 'green',
              bgColor: 'bg-green-50',
              textColor: 'text-green-600'
            },
            {
              title: 'Available Now',
              value: deliveryStaff.filter(s => s.status === 'Available' && s.user?.isActive).length,
              icon: Clock,
              color: 'blue',
              bgColor: 'bg-blue-50',
              textColor: 'text-blue-600'
            },
            {
              title: 'Inactive Staff',
              value: deliveryStaff.filter(s => !s.user?.isActive).length,
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search delivery staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Availability Filter */}
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
              >
                <option value="All">All Availability</option>
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-center bg-orange-50 rounded-lg px-4 py-2">
              <span className="text-orange-700 font-semibold">
                {filteredDeliveryStaff.length} staff found
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeliveryStaff.map((staff, index) => (
            <div key={staff.staffId} className="card-gradient rounded-2xl shadow-soft border border-gray-200/50 overflow-hidden hover:shadow-lg transition-all duration-300" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                      <Navigation className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{staff.user?.userName}</h3>
                      <p className="text-sm text-gray-500">ID: {staff.staffId}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      staff.user?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {staff.user?.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      staff.status === 'Available' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {staff.status === 'Available' ? 'Available' : 'Busy'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{staff.user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{staff.user?.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{staff.vehicleType} - {staff.vehicleNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Location className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{getZoneName(staff.zoneId)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{new Date(staff.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedStaff(staff);
                      setShowEditModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => toggleStaffAvailability(staff)}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                      staff.status === 'Available' 
                        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' 
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {staff.status === 'Available' ? (
                      <>
                        <Clock className="h-4 w-4" />
                        Set Busy
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Set Available
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(staff.staffId)}
                    className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDeliveryStaff.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-medium">No delivery staff found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Add Delivery Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Plus className="h-6 w-6 text-orange-600" />
                Add New Delivery Staff
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Personal Details</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newStaff.userName}
                    onChange={(e) => setNewStaff({...newStaff, userName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter password"
                  />
                </div>
              </div>

              {/* Work Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Work Details</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                  <select
                    value={newStaff.vehicleType}
                    onChange={(e) => setNewStaff({...newStaff, vehicleType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select Vehicle Type</option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Car">Car</option>
                    <option value="Van">Van</option>
                    <option value="Scooter">Scooter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    value={newStaff.vehicleNumber}
                    onChange={(e) => setNewStaff({...newStaff, vehicleNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter vehicle number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <input
                    type="text"
                    value={newStaff.licenseNumber}
                    onChange={(e) => setNewStaff({...newStaff, licenseNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter license number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Zone</label>
                  <select
                    value={newStaff.zoneId}
                    onChange={(e) => setNewStaff({...newStaff, zoneId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select Zone</option>
                    {zones.map(zone => (
                      <option key={zone.zoneId} value={zone.zoneId}>
                        {zone.zoneName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={newStaff.isActive}
                    onChange={(e) => setNewStaff({...newStaff, isActive: e.target.checked})}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Active Staff Member
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={newStaff.isAvailable}
                    onChange={(e) => setNewStaff({...newStaff, isAvailable: e.target.checked})}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-700">
                    Available for Delivery
                  </label>
                </div>
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
                onClick={handleAddStaff}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Add Staff Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Delivery Staff Modal */}
      {showEditModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit className="h-6 w-6 text-orange-600" />
                Edit Delivery Staff
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                  <select
                    value={selectedStaff.vehicleType}
                    onChange={(e) => setSelectedStaff({...selectedStaff, vehicleType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Car">Car</option>
                    <option value="Van">Van</option>
                    <option value="Scooter">Scooter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    value={selectedStaff.vehicleNumber}
                    onChange={(e) => setSelectedStaff({...selectedStaff, vehicleNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <input
                    type="text"
                    value={selectedStaff.licenseNumber}
                    onChange={(e) => setSelectedStaff({...selectedStaff, licenseNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Zone</label>
                  <select
                    value={selectedStaff.zoneId}
                    onChange={(e) => setSelectedStaff({...selectedStaff, zoneId: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {zones.map(zone => (
                      <option key={zone.zoneId} value={zone.zoneId}>
                        {zone.zoneName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={selectedStaff.user?.isActive || false}
                    onChange={(e) => setSelectedStaff({
                      ...selectedStaff, 
                      user: { ...selectedStaff.user, isActive: e.target.checked }
                    })}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="editIsActive" className="ml-2 block text-sm text-gray-700">
                    Active Staff Member
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIsAvailable"
                    checked={selectedStaff.status === 'Available'}
                    onChange={(e) => setSelectedStaff({
                      ...selectedStaff,
                      isAvailable: e.target.checked,
                      status: e.target.checked ? 'Available' : 'Busy'
                    })}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="editIsAvailable" className="ml-2 block text-sm text-gray-700">
                    Available for Delivery
                  </label>
                </div>
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
                onClick={handleEditStaff}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Update Staff Member
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminDeliveryStaff;

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle,
  DollarSign,
  Star,
  Navigation,
  AlertCircle,
  User,
  Mail,
  Phone,
  Edit,
  Save,
  XCircle
} from 'lucide-react';
import { deliveryAssignmentAPI, zoneAPI, deliveryStaffAPI } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useJwtAuth } from '../../contexts/JwtAuthContext';

const DeliveryStaffDashboard = () => {
  const [stats, setStats] = useState({
    totalAssignments: 0,
    pendingDeliveries: 0,
    completedDeliveries: 0,
    totalEarnings: 0,
    rating: 0,
    currentLoad: 0
  });
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    vehicleType: '',
    vehicleNumber: '',
    licenseNumber: '',
    zoneName: ''
  });

  const { user } = useJwtAuth();

  const location = useLocation();
  const path = location.pathname;

  let currentSection = 'dashboard';
  if (path.startsWith('/delivery-staff/active')) currentSection = 'active';
  else if (path.startsWith('/delivery-staff/history')) currentSection = 'history';
  else if (path.startsWith('/delivery-staff/routes')) currentSection = 'routes';
  else if (path.startsWith('/delivery-staff/profile')) currentSection = 'profile';

  const navigation = [
    { name: 'Dashboard', href: '/delivery-staff/dashboard', icon: Truck, current: currentSection === 'dashboard' },
    { name: 'Active Deliveries', href: '/delivery-staff/active', icon: Package, current: currentSection === 'active' },
    { name: 'Delivery History', href: '/delivery-staff/history', icon: Clock, current: currentSection === 'history' },
    { name: 'Delivery Zones', href: '/delivery-staff/routes', icon: MapPin, current: currentSection === 'routes' },
    { name: 'Profile', href: '/delivery-staff/profile', icon: MapPin, current: currentSection === 'profile' },
  ];

  const pageTitle =
    currentSection === 'active'
      ? 'Active Deliveries'
      : currentSection === 'history'
      ? 'Delivery History'
      : currentSection === 'routes'
      ? 'Delivery Zones'
      : currentSection === 'profile'
      ? 'Profile'
      : 'Delivery Dashboard';

  const bannerTitle =
    currentSection === 'active'
      ? 'Your Active Deliveries'
      : currentSection === 'history'
      ? 'Your Delivery History'
      : currentSection === 'routes'
      ? 'Your Delivery Zones'
      : currentSection === 'profile'
      ? 'Manage Your Profile'
      : 'Ready for Deliveries';

  const bannerSubtitle =
    currentSection === 'active'
      ? 'Track and manage orders you are currently delivering'
      : currentSection === 'history'
      ? 'Review deliveries you have completed'
      : currentSection === 'routes'
      ? 'View the delivery zones you serve. Zone settings are managed by the store owner.'
      : currentSection === 'profile'
      ? 'Update your delivery information and preferences'
      : 'Manage your deliveries and track your performance';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setZonesLoading(true);
      
      const [assignmentsResponse, zonesResponse] = await Promise.all([
        deliveryAssignmentAPI.getMyAssignments(),
        zoneAPI.getAll()
      ]);

      // Process assignments data
      const assignments = assignmentsResponse.data?.data || assignmentsResponse.data || [];
      const totalAssignments = assignments.length;
      const pendingDeliveries = assignments.filter(assignment => 
        assignment.status === 'Assigned' || assignment.status === 'In Transit' || assignment.status === 'Active'
      ).length;
      const completedDeliveries = assignments.filter(assignment => 
        assignment.status === 'Delivered'
      ).length;

      // Get active deliveries (assigned or in transit)
      const active = assignments.filter(assignment => 
        assignment.status === 'Assigned' || assignment.status === 'In Transit' || assignment.status === 'Active'
      ).slice(0, 5);
      setActiveDeliveries(active);

      // Get recent completed deliveries
      const completed = assignments
        .filter(assignment => assignment.status === 'Delivered')
        .sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate))
        .slice(0, 5);
      setRecentDeliveries(completed);

      // Mock data for earnings and rating (would come from backend)
      const totalEarnings = completedDeliveries * 50; // ₹50 per delivery
      const rating = 4.5; // Mock rating
      const currentLoad = pendingDeliveries;

      setStats({
        totalAssignments,
        pendingDeliveries,
        completedDeliveries,
        totalEarnings,
        rating,
        currentLoad
      });

      const zonesList = Array.isArray(zonesResponse?.data)
        ? zonesResponse.data
        : zonesResponse?.data?.data ?? [];
      setZones(zonesList);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setZonesLoading(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      setProfileLoading(true);
      const response = await deliveryStaffAPI.getMyProfile();
      const data = response.data?.data || response.data;
      if (!data) {
        setProfile(null);
        return;
      }

      setProfile(data);

      const initialName = data.user?.userName || user?.userName || '';
      const initialEmail = data.user?.email || user?.email || '';
      const initialPhone = data.user?.phone || user?.phone || '';

      setProfileForm({
        name: initialName,
        email: initialEmail,
        phone: initialPhone,
        vehicleType: data.vehicleType || '',
        vehicleNumber: data.vehicleNumber || '',
        licenseNumber: data.licenseNumber || '',
        zoneName: data.zone?.zoneName || ''
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileInputChange = (field, value) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileSave = async () => {
    try {
      const payload = {
        userName: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        vehicleType: profileForm.vehicleType,
        vehicleNumber: profileForm.vehicleNumber,
        licenseNumber: profileForm.licenseNumber
      };

      const response = await deliveryStaffAPI.updateMyProfile(payload);
      const updated = response.data?.data || response.data;
      setProfile(updated);
      setEditingProfile(false);

      if (user) {
        const updatedUser = {
          ...user,
          userName: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please check your details and try again.');
    }
  };

  const handleProfileCancel = () => {
    if (!profile) return;
    setProfileForm({
      name: profile.user?.userName || user?.userName || '',
      email: profile.user?.email || user?.email || '',
      phone: profile.user?.phone || user?.phone || '',
      vehicleType: profile.vehicleType || '',
      vehicleNumber: profile.vehicleNumber || '',
      licenseNumber: profile.licenseNumber || '',
      zoneName: profile.zone?.zoneName || ''
    });
    setEditingProfile(false);
  };

  const handleUpdateStatus = async (assignmentId, newStatus) => {
    try {
      const assignment = activeDeliveries.find(a => a.assignmentId === assignmentId);
      if (!assignment) return;

      const updateData = {
        ...assignment,
        status: newStatus
      };

      await deliveryAssignmentAPI.update(assignmentId, updateData);
      fetchDashboardData();
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
      case 'Assigned':
        return 'bg-blue-100 text-blue-800';
      case 'In Transit':
        return 'bg-yellow-100 text-yellow-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your delivery dashboard..." />;
  }

  return (
    <Layout navigation={navigation} title={pageTitle}>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">{bannerTitle}</h2>
          <p className="text-orange-100">{bannerSubtitle}</p>
        </div>

        {currentSection === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAssignments}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingDeliveries}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedDeliveries}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Earnings</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalEarnings}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Star className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rating}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Truck className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Current Load</p>
                <p className="text-2xl font-bold text-gray-900">{stats.currentLoad}/10</p>
              </div>
            </div>
          </div>
        </div>
        )}

        {(currentSection === 'dashboard' || currentSection === 'active' || currentSection === 'history') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Active Deliveries</h3>
              <a href="/delivery-staff/active" className="text-sm text-orange-600 hover:text-orange-700">
                View all
              </a>
            </div>
            
            {activeDeliveries.length > 0 ? (
              <div className="space-y-3">
                {activeDeliveries.map((assignment) => (
                  <div key={assignment.assignmentId} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">Order #{assignment.orderId}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                        {assignment.status}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>Delivery Address</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{new Date(assignment.assignedDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2">
                        {assignment.status === 'Active' || assignment.status === 'Assigned' ? (
                          <button 
                            onClick={() => handleUpdateStatus(assignment.assignmentId, 'In Transit')}
                            className="px-3 py-1 bg-yellow-500 text-white text-xs font-medium rounded hover:bg-yellow-600 transition-colors"
                          >
                            Start Delivery
                          </button>
                        ) : assignment.status === 'In Transit' ? (
                          <button 
                            onClick={() => handleUpdateStatus(assignment.assignmentId, 'Delivered')}
                            className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded hover:bg-green-600 transition-colors"
                          >
                            Mark Delivered
                          </button>
                        ) : null}
                        <button className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No active deliveries</p>
                <p className="text-sm text-gray-500">New assignments will appear here</p>
              </div>
            )}
          </div>

          {currentSection !== 'active' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Deliveries</h3>
              <a href="/delivery-staff/history" className="text-sm text-orange-600 hover:text-orange-700">
                View all
              </a>
            </div>
            
            {recentDeliveries.length > 0 ? (
              <div className="space-y-3">
                {recentDeliveries.map((assignment) => (
                  <div key={assignment.assignmentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Order #{assignment.orderId}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(assignment.assignedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                        {assignment.status}
                      </span>
                      <p className="text-sm font-medium text-gray-900 mt-1">₹50</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No completed deliveries</p>
              </div>
            )}
          </div>
          )}
        </div>
        )}

        {currentSection === 'dashboard' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.completedDeliveries}</p>
              <p className="text-sm text-gray-600">Successful Deliveries</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-3">
                <Star className="h-8 w-8 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.rating}/5</p>
              <p className="text-sm text-gray-600">Average Rating</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-3">
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalEarnings}</p>
              <p className="text-sm text-gray-600">Total Earnings</p>
            </div>
          </div>
        </div>
        )}

        {currentSection === 'dashboard' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/delivery-staff/active"
              className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors duration-200"
            >
              <Package className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-orange-900">Active Deliveries</span>
            </a>
            <a
              href="/delivery-staff/routes"
              className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
            >
              <Navigation className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-900">Plan Route</span>
            </a>
            <a
              href="/delivery-staff/history"
              className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200"
            >
              <Clock className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-900">Delivery History</span>
            </a>
            <a
              href="/delivery-staff/profile"
              className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200"
            >
              <Truck className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-900">Update Profile</span>
            </a>
          </div>
        </div>
        )}

        {currentSection === 'routes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              Delivery Zones
            </h3>
            <p className="text-sm text-gray-500">
              Zones are configured by the store owner and are read-only here.
            </p>
          </div>

          {zonesLoading ? (
            <LoadingSpinner text="Loading zones..." />
          ) : zones.length === 0 ? (
            <div className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">No zones configured</p>
                <p className="text-sm text-gray-600">
                  Ask the store owner to configure delivery zones in the Zones section.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {zones.map((zone) => (
                <div
                  key={zone.zoneId}
                  className="card-gradient rounded-2xl shadow-soft border border-gray-200/50 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                          <Navigation className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {zone.zoneName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            PIN: {zone.pincodeNumber}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          zone.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {zone.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {zone.description || 'No description available'}
                    </p>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">City:</span>
                        <span className="font-medium">{zone.city}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">State:</span>
                        <span className="font-medium">{zone.state}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Country:</span>
                        <span className="font-medium">{zone.country}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {currentSection === 'profile' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-orange-600" />
                Your Profile
              </h3>
              <p className="text-sm text-gray-600">
                View and update your contact details and vehicle information.
              </p>
            </div>
            <div className="flex gap-2">
              {editingProfile ? (
                <>
                  <button
                    onClick={handleProfileCancel}
                    className="btn-secondary inline-flex items-center gap-2 text-sm px-3 py-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleProfileSave}
                    className="btn-primary inline-flex items-center gap-2 text-sm px-3 py-2"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="btn-primary inline-flex items-center gap-2 text-sm px-3 py-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="card">
            {profileLoading ? (
              <LoadingSpinner text="Loading profile..." />
            ) : !profile ? (
              <p className="text-sm text-gray-600">
                Profile details are not available. Please contact the store owner.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    {editingProfile ? (
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => handleProfileInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    ) : (
                      <div className="flex items-center text-gray-900">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        {profileForm.name || '—'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    {editingProfile ? (
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => handleProfileInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    ) : (
                      <div className="flex items-center text-gray-900">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {profileForm.email || '—'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    {editingProfile ? (
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => handleProfileInputChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    ) : (
                      <div className="flex items-center text-gray-900">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {profileForm.phone || '—'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zone
                    </label>
                    <p className="text-gray-900">
                      {profileForm.zoneName || 'Not assigned'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Type
                    </label>
                    {editingProfile ? (
                      <input
                        type="text"
                        value={profileForm.vehicleType}
                        onChange={(e) =>
                          handleProfileInputChange('vehicleType', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profileForm.vehicleType || '—'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Number
                    </label>
                    {editingProfile ? (
                      <input
                        type="text"
                        value={profileForm.vehicleNumber}
                        onChange={(e) =>
                          handleProfileInputChange('vehicleNumber', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profileForm.vehicleNumber || '—'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Number
                    </label>
                    {editingProfile ? (
                      <input
                        type="text"
                        value={profileForm.licenseNumber}
                        onChange={(e) =>
                          handleProfileInputChange('licenseNumber', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profileForm.licenseNumber || '—'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </Layout>
  );
};

export default DeliveryStaffDashboard;

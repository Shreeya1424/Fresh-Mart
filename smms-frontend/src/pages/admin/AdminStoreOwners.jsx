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
  Search,
  Filter,
  Trash2,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Calendar,
  Building,
  MapPin as Location
} from 'lucide-react';
import { storeOwnerAPI, userAPI } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminStoreOwners = () => {
  const [storeOwners, setStoreOwners] = useState([]);
  const [filteredStoreOwners, setFilteredStoreOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3, current: false },
    { name: 'Products', href: '/admin/products', icon: Package, current: false },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, current: false },
    { name: 'Customers', href: '/admin/customers', icon: UserCheck, current: false },
    { name: 'Delivery Staff', href: '/admin/delivery-staff', icon: Truck, current: false },
    { name: 'Categories', href: '/admin/categories', icon: Database, current: false },
    { name: 'Zones', href: '/admin/zones', icon: MapPin, current: false },
    { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
  ];

  useEffect(() => {
    fetchStoreOwners();
  }, []);

  useEffect(() => {
    filterStoreOwners();
  }, [storeOwners, searchTerm, statusFilter]);

  const fetchStoreOwners = async () => {
    try {
      setLoading(true);
      console.log('🏪 Fetching store owners from backend...');
      
      const response = await storeOwnerAPI.getAll();
      const list = Array.isArray(response?.data) ? response.data : response?.data?.data ?? [];
      const normalizedList = (list || []).map(owner => ({
        ...owner,
        isActive: owner?.isActive ?? owner?.user?.isActive ?? true
      }));
      setStoreOwners(normalizedList);
    } catch (error) {
      console.error('❌ Error fetching store owners:', error);
      setStoreOwners([]);
      toast.error('Failed to load store owners from server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterStoreOwners = () => {
    let filtered = storeOwners || [];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(owner =>
        owner.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.user?.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.businessEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      const isActive = statusFilter === 'Active';
      filtered = filtered.filter(owner => owner.isActive === isActive);
    }

    setFilteredStoreOwners(filtered);
  };

  const handleDeleteStoreOwner = async (storeOwnerId) => {
    const isConfirmed = await showConfirm(
      'Are you sure?',
      'Do you really want to delete this store owner? This action cannot be undone.',
      'warning'
    );
    if (!isConfirmed) return;
    
    try {
      console.log('🗑️ Deleting store owner:', storeOwnerId);
      
      await storeOwnerAPI.delete(storeOwnerId);
      setStoreOwners(storeOwners.filter(owner => owner.storeOwnerId !== storeOwnerId));
      console.log('✅ Store owner deleted successfully');
      toast.success('Store owner deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting store owner:', error);
      toast.error('Error deleting store owner. Please try again.');
    }
  };

  const toggleStoreOwnerStatus = async (owner) => {
    try {
      if (!owner?.user?.userId) {
        toast.error('Store owner user information is missing.');
        return;
      }

      const updatedOwner = { 
        ...owner, 
        isActive: !owner.isActive,
        user: { 
          ...owner.user, 
          isActive: !owner.isActive 
        }
      };
      console.log('🔄 Toggling store owner status:', updatedOwner);
      
      const response = await userAPI.update(owner.user.userId, {
        ...owner.user,
        isActive: !owner.isActive
      });
      if (response?.data) {
        setStoreOwners(storeOwners.map(o => 
          o.storeOwnerId === owner.storeOwnerId ? updatedOwner : o
        ));
        console.log('✅ Store owner status updated successfully');
        toast.success(`Store owner ${owner.isActive ? 'deactivated' : 'activated'} successfully`);
      }
    } catch (error) {
      console.error('❌ Error updating store owner status:', error);
      toast.error('Error updating store owner status. Please try again.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading store owners..." />;
  }

  return (
    <Layout navigation={navigation} title="Store Owner Management">
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Store className="h-7 w-7 text-green-600" />
              Store Owner Management
            </h2>
            <p className="text-gray-600">Manage store owners and their business profiles</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Total Store Owners',
              value: storeOwners.length,
              icon: Store,
              color: 'green',
              bgColor: 'bg-green-50',
              textColor: 'text-green-600'
            },
            {
              title: 'Active Stores',
              value: storeOwners.filter(o => o.isActive).length,
              icon: CheckCircle,
              color: 'emerald',
              bgColor: 'bg-emerald-50',
              textColor: 'text-emerald-600'
            },
            {
              title: 'Inactive Stores',
              value: storeOwners.filter(o => !o.isActive).length,
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
                placeholder="Search store owners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
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
                {filteredStoreOwners.length} store owners found
              </span>
            </div>
          </div>
        </div>

        {/* Store Owners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStoreOwners.map((owner, index) => (
            <div key={owner.storeOwnerId} className="card-gradient rounded-2xl shadow-soft border border-gray-200/50 overflow-hidden hover:shadow-lg transition-all duration-300" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                      <Building className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{owner.businessName}</h3>
                      <p className="text-sm text-gray-500">ID: {owner.storeOwnerId}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    owner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {owner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{owner.user?.userName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {owner.businessEmail || owner.user?.email || 'No email set'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {owner.businessPhone || owner.user?.phone || 'No phone set'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Location className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 line-clamp-1">
                      {owner.businessAddress || 'No business address set'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{new Date(owner.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions (no add/edit to keep single owner setup) */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStoreOwnerStatus(owner)}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                      owner.isActive 
                        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' 
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {owner.isActive ? (
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
                    onClick={() => handleDeleteStoreOwner(owner.storeOwnerId)}
                    className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStoreOwners.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-medium">No store owners found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminStoreOwners;

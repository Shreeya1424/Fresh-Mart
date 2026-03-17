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
  CheckCircle,
  XCircle,
  Calendar,
  Globe,
  Navigation
} from 'lucide-react';
import { zoneAPI } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminZones = () => {
  const [zones, setZones] = useState([]);
  const [filteredZones, setFilteredZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [newZone, setNewZone] = useState({
    zoneName: '',
    description: '',
    pincodeNumber: '',
    city: '',
    state: '',
    country: 'India',
    isActive: true
  });

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3, current: false },
    { name: 'Products', href: '/admin/products', icon: Package, current: false },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, current: false },
    { name: 'Customers', href: '/admin/customers', icon: UserCheck, current: false },
    { name: 'Delivery Staff', href: '/admin/delivery-staff', icon: Truck, current: false },
    { name: 'Categories', href: '/admin/categories', icon: Database, current: false },
    { name: 'Zones', href: '/admin/zones', icon: MapPin, current: true },
    { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
  ];

  useEffect(() => {
    fetchZones();
  }, []);

  useEffect(() => {
    filterZones();
  }, [zones, searchTerm, statusFilter]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      console.log('🗺️ Fetching zones from backend...');
      
      const response = await zoneAPI.getAll();
      const list = Array.isArray(response?.data) ? response.data : response?.data?.data ?? [];
      setZones(list);
    } catch (error) {
      console.error('❌ Error fetching zones:', error);
      setZones([]);
      toast.error('Failed to load zones from server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterZones = () => {
    let filtered = zones || [];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(zone =>
        zone.zoneName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        zone.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        zone.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        zone.pincodeNumber?.toString().includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      const isActive = statusFilter === 'Active';
      filtered = filtered.filter(zone => zone.isActive === isActive);
    }

    setFilteredZones(filtered);
  };

  const handleAddZone = async () => {
    try {
      console.log('➕ Adding new zone:', newZone);
      
      const response = await zoneAPI.create(newZone);
      if (response?.data) {
        await fetchZones();
        setShowAddModal(false);
        setNewZone({
          zoneName: '',
          description: '',
          pincodeNumber: '',
          city: '',
          state: '',
          country: 'India',
          isActive: true
        });
        console.log('✅ Zone added successfully');
        toast.success('Zone added successfully!');
      }
    } catch (error) {
      console.error('❌ Error adding zone:', error);
      toast.error('Error adding zone. Please try again.');
    }
  };

  const handleEditZone = async () => {
    try {
      console.log('✏️ Updating zone:', selectedZone);
      
      const response = await zoneAPI.update(selectedZone.zoneId, selectedZone);
      if (response?.data) {
        await fetchZones();
        setShowEditModal(false);
        setSelectedZone(null);
        console.log('✅ Zone updated successfully');
        toast.success('Zone updated successfully!');
      }
    } catch (error) {
      console.error('❌ Error updating zone:', error);
      toast.error('Error updating zone. Please try again.');
    }
  };

  const handleDeleteZone = async (zoneId) => {
    const isConfirmed = await showConfirm(
      'Are you sure?',
      'Do you really want to delete this zone? This action cannot be undone.',
      'warning'
    );
    if (!isConfirmed) return;
    
    try {
      console.log('🗑️ Deleting zone:', zoneId);
      
      await zoneAPI.delete(zoneId);
      setZones(zones.filter(zone => zone.zoneId !== zoneId));
      console.log('✅ Zone deleted successfully');
      toast.success('Zone deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting zone:', error);
      toast.error('Error deleting zone. Please try again.');
    }
  };

  const toggleZoneStatus = async (zone) => {
    try {
      const updatedZone = { ...zone, isActive: !zone.isActive };
      console.log('🔄 Toggling zone status:', updatedZone);
      
      const response = await zoneAPI.update(zone.zoneId, updatedZone);
      if (response?.data) {
        await fetchZones();
        console.log('✅ Zone status updated successfully');
        toast.success(`Zone ${zone.isActive ? 'deactivated' : 'activated'} successfully`);
      }
    } catch (error) {
      console.error('❌ Error updating zone status:', error);
      toast.error('Error updating zone status. Please try again.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading zones..." />;
  }

  return (
    <Layout navigation={navigation} title="Zone Management">
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="h-7 w-7 text-emerald-600" />
              Zone Management
            </h2>
            <p className="text-gray-600">Manage delivery zones and service areas</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add New Zone
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Total Zones',
              value: zones.length,
              icon: MapPin,
              color: 'emerald',
              bgColor: 'bg-emerald-50',
              textColor: 'text-emerald-600'
            },
            {
              title: 'Active Zones',
              value: zones.filter(z => z.isActive).length,
              icon: CheckCircle,
              color: 'green',
              bgColor: 'bg-green-50',
              textColor: 'text-green-600'
            },
            {
              title: 'Inactive Zones',
              value: zones.filter(z => !z.isActive).length,
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
                placeholder="Search zones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-center bg-emerald-50 rounded-lg px-4 py-2">
              <span className="text-emerald-700 font-semibold">
                {filteredZones.length} zones found
              </span>
            </div>
          </div>
        </div>

        {/* Zones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredZones.map((zone, index) => (
            <div key={zone.zoneId} className="card-gradient rounded-2xl shadow-soft border border-gray-200/50 overflow-hidden hover:shadow-lg transition-all duration-300" style={{ animationDelay: `${index * 50}ms` }}>
              {/* Zone Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                      <Navigation className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{zone.zoneName}</h3>
                      <p className="text-sm text-gray-500">PIN: {zone.pincodeNumber}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    zone.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {zone.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">{zone.description || 'No description available'}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      Location:
                    </span>
                    <span className="font-medium">{zone.city}, {zone.state}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Country:</span>
                    <span className="font-medium">{zone.country}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created:
                    </span>
                    <span className="font-medium">
                      {zone.createdAt ? new Date(zone.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedZone(zone);
                      setShowEditModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => toggleZoneStatus(zone)}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                      zone.isActive 
                        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' 
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {zone.isActive ? (
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
                    onClick={() => handleDeleteZone(zone.zoneId)}
                    className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredZones.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-medium">No zones found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Add Zone Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Plus className="h-6 w-6 text-emerald-600" />
                Add New Zone
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
                <input
                  type="text"
                  value={newZone.zoneName}
                  onChange={(e) => setNewZone({...newZone, zoneName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter zone name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newZone.description}
                  onChange={(e) => setNewZone({...newZone, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter zone description"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="number"
                  value={newZone.pincodeNumber}
                  onChange={(e) => setNewZone({...newZone, pincodeNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter pincode"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={newZone.city}
                    onChange={(e) => setNewZone({...newZone, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={newZone.state}
                    onChange={(e) => setNewZone({...newZone, state: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter state"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={newZone.country}
                  onChange={(e) => setNewZone({...newZone, country: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter country"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newZone.isActive}
                  onChange={(e) => setNewZone({...newZone, isActive: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active Zone
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
                onClick={handleAddZone}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Add Zone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Zone Modal */}
      {showEditModal && selectedZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit className="h-6 w-6 text-emerald-600" />
                Edit Zone
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
                <input
                  type="text"
                  value={selectedZone.zoneName}
                  onChange={(e) => setSelectedZone({...selectedZone, zoneName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={selectedZone.description}
                  onChange={(e) => setSelectedZone({...selectedZone, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="number"
                  value={selectedZone.pincodeNumber}
                  onChange={(e) => setSelectedZone({...selectedZone, pincodeNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={selectedZone.city}
                    onChange={(e) => setSelectedZone({...selectedZone, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={selectedZone.state}
                    onChange={(e) => setSelectedZone({...selectedZone, state: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={selectedZone.country}
                  onChange={(e) => setSelectedZone({...selectedZone, country: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={selectedZone.isActive}
                  onChange={(e) => setSelectedZone({...selectedZone, isActive: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="editIsActive" className="ml-2 block text-sm text-gray-700">
                  Active Zone
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
                onClick={handleEditZone}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Update Zone
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminZones;

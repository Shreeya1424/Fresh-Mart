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
  Eye,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Calendar,
  User,
  MapPin as Location
} from 'lucide-react';
import { customerAPI, userAPI } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3, current: false },
    { name: 'Products', href: '/admin/products', icon: Package, current: false },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, current: false },
    { name: 'Customers', href: '/admin/customers', icon: UserCheck, current: true },
    { name: 'Delivery Staff', href: '/admin/delivery-staff', icon: Truck, current: false },
    { name: 'Categories', href: '/admin/categories', icon: Database, current: false },
    { name: 'Zones', href: '/admin/zones', icon: MapPin, current: false },
    { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
  ];

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, statusFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getAll();
      const list = Array.isArray(response?.data) ? response.data : response?.data?.data ?? [];
      setCustomers(list);
    } catch (error) {
      console.error('❌ Error fetching customers:', error);
      setCustomers([]);
      toast.error('Failed to load customers from server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers || [];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.user?.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.user?.phone.includes(searchTerm) ||
        customer.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      const isActive = statusFilter === 'Active';
      filtered = filtered.filter(customer => customer.user?.isActive === isActive);
    }

    setFilteredCustomers(filtered);
  };

  const handleDeleteCustomer = async (customerId) => {
    const isConfirmed = await showConfirm(
      'Are you sure?',
      'Do you really want to delete this customer? This action cannot be undone.',
      'warning'
    );
    if (!isConfirmed) return;
    
    try {
      console.log('🗑️ Deleting customer:', customerId);

      await customerAPI.delete(customerId);
      setCustomers(customers.filter(customer => customer.customerId !== customerId));
      console.log('✅ Customer deleted successfully');
      toast.success('Customer deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting customer:', error);
      toast.error('Error deleting customer. Please try again.');
    }
  };

  const toggleCustomerStatus = async (customer) => {
    try {
      const updatedCustomer = { 
        ...customer, 
        user: { ...customer.user, isActive: !customer.user.isActive }
      };
      console.log('🔄 Toggling customer status:', updatedCustomer);
      
      // Update user status
      const response = await userAPI.update(customer.user.userId, {
        ...customer.user,
        isActive: !customer.user.isActive
      });
      
      if (response?.data) {
        setCustomers(customers.map(c => 
          c.customerId === customer.customerId ? updatedCustomer : c
        ));
        console.log('✅ Customer status updated successfully');
        toast.success(`Customer ${customer.user.isActive ? 'deactivated' : 'activated'} successfully`);
      }
    } catch (error) {
      console.error('❌ Error updating customer status:', error);
      toast.error('Error updating customer status. Please try again.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading customers..." />;
  }

  return (
    <Layout navigation={navigation} title="Customer Management">
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UserCheck className="h-7 w-7 text-blue-600" />
              Customer Management
            </h2>
            <p className="text-gray-600">Manage customer accounts and profiles</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Total Customers',
              value: (customers || []).length,
              icon: UserCheck,
              color: 'blue',
              bgColor: 'bg-blue-50',
              textColor: 'text-blue-600'
            },
            {
              title: 'Active Customers',
              value: (customers || []).filter(c => c.user?.isActive).length,
              icon: CheckCircle,
              color: 'green',
              bgColor: 'bg-green-50',
              textColor: 'text-green-600'
            },
            {
              title: 'Inactive Customers',
              value: (customers || []).filter(c => !c.user?.isActive).length,
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
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-center bg-blue-50 rounded-lg px-4 py-2">
              <span className="text-blue-700 font-semibold">
                {filteredCustomers.length} customers found
              </span>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="card-gradient rounded-2xl shadow-soft border border-gray-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.customerId} className="hover:bg-gray-50 transition-colors duration-200" style={{ animationDelay: `${index * 50}ms` }}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {customer.user?.userName?.charAt(0) || 'C'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{customer.user?.userName}</div>
                          <div className="text-sm text-gray-500">ID: {customer.customerId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {customer.user?.email}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {customer.user?.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Location className="h-4 w-4 text-gray-400" />
                        <span className="max-w-xs truncate">{customer.address}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleCustomerStatus(customer)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                          customer.user?.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {customer.user?.isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteCustomer(customer.customerId)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg font-medium">No customers found</p>
              <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>

    </Layout>
  );
};

export default AdminCustomers;

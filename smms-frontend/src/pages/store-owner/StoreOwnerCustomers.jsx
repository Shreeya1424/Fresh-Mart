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
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Calendar,
  MapPin as Location,
  Truck,
  Database
} from 'lucide-react';
import { customerAPI, userAPI } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

const StoreOwnerCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    address: '',
    dateOfBirth: '',
    userName: '',
    email: '',
    phone: '',
    password: '',
    isActive: true
  });

  const navigation = [
    { name: 'Dashboard', href: '/store-owner/dashboard', icon: BarChart3, current: false },
    { name: 'Products', href: '/store-owner/products', icon: Package, current: false },
    { name: 'Categories', href: '/admin/categories', icon: Database, current: false },
    { name: 'Orders', href: '/store-owner/orders', icon: ShoppingCart, current: false },
    { name: 'Customers', href: '/store-owner/customers', icon: Users, current: true },
    { name: 'Delivery Staff', href: '/store-owner/delivery-staff', icon: Truck, current: false },
    { name: 'Store Profile', href: '/store-owner/profile', icon: Store, current: false },
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

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.user?.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.user?.phone.includes(searchTerm) ||
        customer.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      const isActive = statusFilter === 'Active';
      filtered = filtered.filter(customer => customer.user?.isActive === isActive);
    }

    setFilteredCustomers(filtered);
  };

  const handleAddCustomer = async () => {
    try {
      const userResponse = await userAPI.create({
        userName: newCustomer.userName,
        email: newCustomer.email,
        phone: newCustomer.phone,
        password: newCustomer.password,
        role: 'Customer',
        isActive: newCustomer.isActive
      });

      if (userResponse?.data) {
        const customerData = {
          userId: userResponse.data.userId,
          address: newCustomer.address,
          dateOfBirth: newCustomer.dateOfBirth
        };

        try {
          const response = await customerAPI.create(customerData);
          if (response?.data) {
            setCustomers([...customers, response.data]);
            toast.success('Customer added successfully!');
          }
        } catch (error) {
          console.error('Error creating customer profile:', error);
          await fetchCustomers();
          toast.success('Customer added successfully!');
        }

        setShowAddModal(false);
        setNewCustomer({
          address: '',
          dateOfBirth: '',
          userName: '',
          email: '',
          phone: '',
          password: '',
          isActive: true
        });
      }
    } catch (error) {
      console.error('❌ Error adding customer:', error);
      toast.error('Error adding customer. Please try again.');
    }
  };

  const handleEditCustomer = async () => {
    try {
      const response = await customerAPI.update(selectedCustomer.customerId, selectedCustomer);
      if (response?.data) {
        setCustomers(customers.map(customer => 
          customer.customerId === selectedCustomer.customerId ? response.data : customer
        ));
        setShowEditModal(false);
        setSelectedCustomer(null);
        toast.success('Customer updated successfully!');
      }
    } catch (error) {
      console.error('❌ Error updating customer:', error);
      toast.error('Error updating customer. Please try again.');
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    const isConfirmed = await showConfirm(
      'Are you sure?',
      'Do you really want to delete this customer? This action cannot be undone.',
      'warning'
    );
    if (!isConfirmed) return;
    
    try {
      await customerAPI.delete(customerId);
      setCustomers(customers.filter(customer => customer.customerId !== customerId));
      toast.success('Customer deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting customer:', error);
      toast.error('Error deleting customer. Please try again.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading customers..." />;
  }

  return (
    <Layout navigation={navigation} title="Customer Management">
      <div className="space-y-6 fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-7 w-7 text-blue-600" />
              Customer Management
            </h2>
            <p className="text-gray-600">Manage customer accounts and profiles</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Customer
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Total Customers',
              value: (customers || []).length,
              icon: Users,
              bgColor: 'bg-blue-50',
              textColor: 'text-blue-600'
            },
            {
              title: 'Active Customers',
              value: (customers || []).filter(c => c.user?.isActive).length,
              icon: CheckCircle,
              bgColor: 'bg-green-50',
              textColor: 'text-green-600'
            },
            {
              title: 'Inactive Customers',
              value: (customers || []).filter(c => !c.user?.isActive).length,
              icon: XCircle,
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

        <div className="card-gradient rounded-2xl p-6 shadow-soft border border-gray-200/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="flex items-center justify-center bg-blue-50 rounded-lg px-4 py-2">
              <span className="text-blue-700 font-semibold">
                {filteredCustomers.length} customers found
              </span>
            </div>
          </div>
        </div>

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
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                      </span>
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
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowEditModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                          title="Edit Customer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
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
                <Users className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg font-medium">No customers found</p>
              <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                Add New Customer
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newCustomer.userName}
                  onChange={(e) => setNewCustomer({...newCustomer, userName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newCustomer.password}
                  onChange={(e) => setNewCustomer({...newCustomer, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter address"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={newCustomer.dateOfBirth}
                  onChange={(e) => setNewCustomer({...newCustomer, dateOfBirth: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
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
                onClick={handleAddCustomer}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit className="h-6 w-6 text-blue-600" />
                Edit Customer
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={selectedCustomer.user?.userName || ''}
                  onChange={(e) => setSelectedCustomer({
                    ...selectedCustomer, 
                    user: { ...selectedCustomer.user, userName: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={selectedCustomer.user?.email || ''}
                  onChange={(e) => setSelectedCustomer({
                    ...selectedCustomer, 
                    user: { ...selectedCustomer.user, email: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={selectedCustomer.user?.phone || ''}
                  onChange={(e) => setSelectedCustomer({
                    ...selectedCustomer, 
                    user: { ...selectedCustomer.user, phone: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={selectedCustomer.address}
                  onChange={(e) => setSelectedCustomer({...selectedCustomer, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={selectedCustomer.dateOfBirth}
                  onChange={(e) => setSelectedCustomer({...selectedCustomer, dateOfBirth: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">Status</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedCustomer.user?.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selectedCustomer.user?.isActive ? (
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
                </span>
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
                onClick={handleEditCustomer}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const PlusIcon = (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>;

export default StoreOwnerCustomers;

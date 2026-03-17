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
  Edit,
  Eye,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Phone,
  Mail
} from 'lucide-react';
import { orderAPI, customerAPI, deliveryStaffAPI, deliveryAssignmentAPI } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [deliveryStaff, setDeliveryStaff] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3, current: false },
    { name: 'Products', href: '/admin/products', icon: Package, current: false },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, current: true },
    { name: 'Customers', href: '/admin/customers', icon: UserCheck, current: false },
    { name: 'Delivery Staff', href: '/admin/delivery-staff', icon: Truck, current: false },
    { name: 'Categories', href: '/admin/categories', icon: Database, current: false },
    { name: 'Zones', href: '/admin/zones', icon: MapPin, current: false },
    { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, dateFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('📦 Loading orders, customers, and delivery staff from backend...');
      
      const [ordersResponse, customersResponse, staffResponse, assignmentsResponse] = await Promise.allSettled([
        orderAPI.getAll(),
        customerAPI.getAll(),
        deliveryStaffAPI.getAll(),
        deliveryAssignmentAPI.getAll()
      ]);

      const toList = (res) => (Array.isArray(res?.data) ? res.data : res?.data?.data ?? []);
      if (ordersResponse.status === 'fulfilled') {
        const raw = toList(ordersResponse.value) || [];
        const mapped = raw.map(o => ({
          ...o,
          deliveryAddress: o.deliveryAddress || o.trackingNumber || ''
        }));
        setOrders(mapped);
      }
      if (customersResponse.status === 'fulfilled') {
        setCustomers(toList(customersResponse.value));
      }
      if (staffResponse.status === 'fulfilled') {
        setDeliveryStaff(toList(staffResponse.value));
      }
      if (assignmentsResponse.status === 'fulfilled') {
        setAssignments(toList(assignmentsResponse.value));
      }

    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setOrders([]);
      setCustomers([]);
      setDeliveryStaff([]);
      setAssignments([]);
      toast.error('Failed to load orders data from server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders || [];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => {
        const customer = getCustomerInfo(order.customerId);
        return (
          order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer?.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.deliveryAddress?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'All') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'Today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(order => new Date(order.orderDate) >= filterDate);
          break;
        case 'Week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(order => new Date(order.orderDate) >= filterDate);
          break;
        case 'Month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(order => new Date(order.orderDate) >= filterDate);
          break;
      }
    }

    setFilteredOrders(filtered);
  };

  const getCustomerInfo = (customerId) => {
    const customer = customers.find(c => c.customerId === customerId);
    return customer?.user || { userName: 'Unknown', email: '', phone: '' };
  };

  const getOrderAssignment = (orderId) => {
    return assignments.find(a => a.orderId === orderId);
  };

  const handleAssignStaff = async (orderId, staffId) => {
    try {
      setLoading(true);
      const assignmentData = {
        orderId: orderId,
        staffId: staffId,
        assignedDate: new Date().toISOString(),
        status: 'Assigned'
      };

      await deliveryAssignmentAPI.create(assignmentData);
      
      // Refresh data to show updated statuses
      await fetchData();
      
      toast.success('Delivery staff assigned successfully!');
    } catch (error) {
      console.error('❌ Error assigning delivery staff:', error);
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(`Error assigning delivery staff: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    const isConfirmed = await showConfirm(
      'Are you sure?',
      'Do you really want to remove this delivery assignment?',
      'warning'
    );
    if (!isConfirmed) return;
    try {
      setLoading(true);
      await deliveryAssignmentAPI.delete(assignmentId);
      await fetchData();
      toast.success('Assignment removed successfully!');
    } catch (error) {
      console.error('❌ Error removing assignment:', error);
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(`Error removing assignment: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const order = orders.find((o) => o.orderId === orderId);
      if (!order) return null;

      const payload = { ...order, status: newStatus };
      const response = await orderAPI.update(orderId, payload);
      const updatedOrder = response?.data?.data || response?.data || payload;

      setOrders(orders.map((o) => (o.orderId === orderId ? { ...o, ...updatedOrder } : o)));

      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, ...updatedOrder } : prev));
      }

      toast.success(`Order status updated to ${newStatus}`);
      return updatedOrder;
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Error updating order status. Please try again.');
      return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'Processing':
        return 'bg-purple-100 text-purple-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-4 w-4" />;
      case 'Confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'Processing':
        return <Package className="h-4 w-4" />;
      case 'Delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'Cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading orders..." />;
  }

  return (
    <Layout navigation={navigation} title="Order Management">
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="h-7 w-7 text-blue-600" />
              Order Management
            </h2>
            <p className="text-gray-600">Monitor and manage all platform orders</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <span className="text-blue-700 font-semibold">
                Total Revenue: ₹{orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + (o.finalAmount || 0), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              title: 'Total Orders',
              value: orders.length,
              icon: ShoppingCart,
              color: 'blue',
              bgColor: 'bg-blue-50',
              textColor: 'text-blue-600'
            },
            {
              title: 'Pending Orders',
              value: orders.filter(o => o.status === 'Pending').length,
              icon: Clock,
              color: 'yellow',
              bgColor: 'bg-yellow-50',
              textColor: 'text-yellow-600'
            },
            {
              title: 'Delivered Orders',
              value: orders.filter(o => o.status === 'Delivered').length,
              icon: CheckCircle,
              color: 'green',
              bgColor: 'bg-green-50',
              textColor: 'text-green-600'
            },
            {
              title: 'Cancelled Orders',
              value: orders.filter(o => o.status === 'Cancelled').length,
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
                  <div className={`p-3 +{stat.bgColor} rounded-xl`}>
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
                placeholder="Search orders..."
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
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Processing">Processing</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="All">All Time</option>
                <option value="Today">Today</option>
                <option value="Week">This Week</option>
                <option value="Month">This Month</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-center bg-blue-50 rounded-lg px-4 py-2">
              <span className="text-blue-700 font-semibold">
                {filteredOrders.length} orders found
              </span>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="card-gradient rounded-2xl shadow-soft border border-gray-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order, index) => {
                  const customer = getCustomerInfo(order.customerId);
                  return (
                    <tr key={order.orderId} className="hover:bg-gray-50 transition-colors duration-200" style={{ animationDelay: `${index * 50}ms` }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            #{order.orderNumber || order.orderId}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">Order #{order.orderNumber || order.orderId}</div>
                            <div className="text-sm text-gray-500">ID: {order.orderId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {customer.userName?.charAt(0) || 'U'}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{customer.userName}</div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(order.orderDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.orderDate).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{order.status}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                          ₹{order.finalAmount?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-sm text-gray-500">{order.paymentMethod}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {order.status === 'Pending' && (
                            <button
                              onClick={() => updateOrderStatus(order.orderId, 'Confirmed')}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                              title="Confirm Order"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          
                          {(order.status === 'Pending' || order.status === 'Confirmed') && (
                            <button
                              onClick={() => updateOrderStatus(order.orderId, 'Cancelled')}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Cancel Order"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg font-medium">No orders found</p>
              <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Eye className="h-6 w-6 text-blue-600" />
                Order Details - #{selectedOrder.orderNumber || selectedOrder.orderId}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Order Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium">#{selectedOrder.orderNumber || selectedOrder.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{new Date(selectedOrder.orderDate).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-1">{selectedOrder.status}</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium">{selectedOrder.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Customer Information</h4>
                  <div className="space-y-2">
                    {(() => {
                      const customer = getCustomerInfo(selectedOrder.customerId);
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{customer.userName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{customer.phone}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Delivery Address</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedOrder.deliveryAddress}</p>
              </div>

              {/* Order Summary */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {(() => {
                    const subtotal = selectedOrder.totalAmount || 0;
                    const deliveryFee = selectedOrder.deliveryCharge || 0;
                    const final = selectedOrder.finalAmount || 0;
                    const tax = Math.max(final - subtotal - deliveryFee, 0);
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivery Fee:</span>
                          <span className="font-medium">₹{deliveryFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax:</span>
                          <span className="font-medium">₹{tax.toFixed(2)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span>₹{final.toFixed(2)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Delivery Assignment Section */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  Delivery Assignment
                </h4>
                
                {(() => {
                  const assignment = getOrderAssignment(selectedOrder.orderId);
                  if (assignment) {
                    return (
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700 font-medium">Assigned To:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                              {assignment.deliveryStaff?.user?.userName || 'Staff #' + assignment.staffId}
                            </span>
                            {assignment.status === 'Active' && (
                              <button
                                onClick={() => handleRemoveAssignment(assignment.assignmentId)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Remove Assignment"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-blue-600">
                          <span>Status: {assignment.status}</span>
                          <span>Assigned: {new Date(assignment.assignedDate).toLocaleString()}</span>
                        </div>
                        {assignment.note && (
                          <p className="text-xs text-blue-600 italic">Note: {assignment.note}</p>
                        )}
                      </div>
                    );
                  }

                  if (selectedOrder.status === 'Confirmed' || selectedOrder.status === 'Processing') {
                    const anyStaff = deliveryStaff || [];
                    const availableCount = anyStaff.filter(s => s.status === 'Available').length;

                    return (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          Select an available delivery staff to assign this order:
                        </p>
                        {anyStaff.length > 0 ? (
                          <div className="grid grid-cols-1 gap-2">
                            {anyStaff.map(staff => {
                              const isAvailable = staff.status === 'Available';
                              return (
                                <button
                                  key={staff.staffId}
                                  onClick={() =>
                                    isAvailable &&
                                    handleAssignStaff(selectedOrder.orderId, staff.staffId)
                                  }
                                  disabled={!isAvailable}
                                  className={`flex items-center justify-between p-3 border rounded-lg text-left transition-all ${
                                    isAvailable
                                      ? 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                                      : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-70'
                                  }`}
                                >
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {staff.user?.userName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {staff.vehicleType} • {staff.user?.phone}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      Status: {staff.status || 'Unknown'}
                                    </p>
                                  </div>
                                  <div
                                    className={`flex items-center gap-1 text-sm font-medium ${
                                      isAvailable ? 'text-blue-600' : 'text-gray-400'
                                    }`}
                                  >
                                    {isAvailable ? 'Assign' : 'Not available'}
                                    <Truck className="h-4 w-4" />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                            <p className="text-sm text-yellow-700">
                              No delivery staff currently configured. Please add staff in the
                              Delivery Staff section.
                            </p>
                          </div>
                        )}
                        {anyStaff.length > 0 && availableCount === 0 && (
                          <p className="text-xs text-yellow-700">
                            All staff are currently unavailable. Toggle availability from the
                            Delivery Staff page.
                          </p>
                        )}
                      </div>
                    );
                  }

                  return (
                    <p className="text-sm text-gray-500 italic">
                      Order must be "Confirmed" or "Processing" to assign delivery staff.
                    </p>
                  );
                })()}
              </div>

              {/* Status Update Actions */}
              {selectedOrder.status !== 'Delivered' && selectedOrder.status !== 'Cancelled' && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h4>
                  <div className="flex gap-3">
                    {selectedOrder.status === 'Pending' && (
                      <button
                        onClick={async () => {
                          await updateOrderStatus(selectedOrder.orderId, 'Confirmed');
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Confirm Order
                      </button>
                    )}
                    {selectedOrder.status === 'Confirmed' && (
                      <button
                        onClick={async () => {
                          await updateOrderStatus(selectedOrder.orderId, 'Processing');
                        }}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Package className="h-4 w-4" />
                        Start Processing
                      </button>
                    )}
                    {(selectedOrder.status === 'Pending' || selectedOrder.status === 'Confirmed') && (
                      <button
                        onClick={async () => {
                          await updateOrderStatus(selectedOrder.orderId, 'Cancelled');
                        }}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminOrders;

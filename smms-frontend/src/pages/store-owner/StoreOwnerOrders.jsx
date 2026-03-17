import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import {
  ShoppingCart,
  Package,
  Users,
  Store,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Search,
  Filter,
  Eye,
  Database,
  Calendar,
  DollarSign,
  User,
  Mail,
  Phone
} from 'lucide-react';
import { orderAPI } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

const StoreOwnerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
   const [selectedOrder, setSelectedOrder] = useState(null);
   const [showDetailsModal, setShowDetailsModal] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/store-owner/dashboard', icon: BarChart3, current: false },
    { name: 'Products', href: '/store-owner/products', icon: Package, current: false },
    { name: 'Categories', href: '/admin/categories', icon: Database, current: false },
    { name: 'Orders', href: '/store-owner/orders', icon: ShoppingCart, current: true },
    { name: 'Customers', href: '/store-owner/customers', icon: Users, current: false },
    { name: 'Delivery Staff', href: '/store-owner/delivery-staff', icon: Truck, current: false },
    { name: 'Store Profile', href: '/store-owner/profile', icon: Store, current: false },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading orders from backend...');
      
      const response = await orderAPI.getAll();
      const rawOrders = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data ?? [];

      if (Array.isArray(rawOrders)) {
        const mapped = rawOrders.map(o => ({
          ...o,
          deliveryAddress: o.deliveryAddress || o.trackingNumber || ''
        }));
        setOrders(mapped);
        console.log('✅ Orders loaded successfully from backend:', rawOrders.length);
      } else {
        console.log('⚠️ No orders data received');
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      setOrders([]);
      toast.error('Failed to load orders from server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return Clock;
      case 'Processing': return Package;
      case 'Shipped': return Truck;
      case 'Completed': return CheckCircle;
      case 'Cancelled': return XCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Processing': return 'text-blue-600 bg-blue-100';
      case 'Shipped': return 'text-purple-600 bg-purple-100';
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading orders..." fullScreen />;
  }

  return (
    <Layout navigation={navigation} title="Orders Management">
      <div className="space-y-6 fade-in">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600">Manage and track your store orders</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'Pending').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'Delivered' || o.status === 'Completed').length}
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
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{orders.reduce((sum, o) => sum + (o.finalAmount || o.total || 0), 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => {
                  const StatusIcon = getStatusIcon(order.status);
                  const itemCount = order.orderItems ? order.orderItems.length : 0;
                  const totalAmount = order.finalAmount || order.total || 0;

                  const customerName =
                    order.customerName ||
                    order.customer?.userName ||
                    order.customer?.name ||
                    order.customer?.email ||
                    'Unknown Customer';

                  return (
                    <tr key={order.orderId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.orderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {order.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {itemCount} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">Orders will appear here once customers start placing them.</p>
          </div>
        )}

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Order Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order ID:</span>
                        <span className="font-medium">
                          #{selectedOrder.orderNumber || selectedOrder.orderId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">
                          {new Date(
                            selectedOrder.orderDate || selectedOrder.createdAt
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            selectedOrder.status
                          )}`}
                        >
                          {(() => {
                            const StatusIcon = getStatusIcon(selectedOrder.status);
                            return <StatusIcon className="h-3 w-3 mr-1" />;
                          })()}
                          <span>{selectedOrder.status}</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-medium">
                          {selectedOrder.paymentMethod || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Customer Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {selectedOrder.customerName ||
                            selectedOrder.customer?.userName ||
                            selectedOrder.customer?.name ||
                            'Unknown Customer'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {selectedOrder.customer?.email || 'Not available'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {selectedOrder.customer?.phone || 'Not available'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedOrder.deliveryAddress && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Delivery Address</h4>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedOrder.deliveryAddress}
                    </p>
                  </div>
                )}

                {Array.isArray(selectedOrder.orderItems) && selectedOrder.orderItems.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Items</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      {selectedOrder.orderItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm text-gray-700"
                        >
                          <div>
                            <p className="font-medium">
                              {item.productName || item.product?.productName || 'Product'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Qty: {item.quantity} × ₹
                              {(item.price || item.unitPrice || 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 font-semibold text-gray-900">
                            <span>
                              ₹
                              {(
                                (item.quantity || 0) * (item.price || item.unitPrice || 0)
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StoreOwnerOrders;

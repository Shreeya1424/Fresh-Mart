import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { 
  ShoppingBag, 
  Heart, 
  ShoppingCart, 
  Package, 
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Eye,
  Search,
  Filter
} from 'lucide-react';
import { orderAPI } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const navigation = [
    { name: 'Dashboard', href: '/customer/dashboard', icon: ShoppingBag, current: false },
    { name: 'Products', href: '/customer/products', icon: Package, current: false },
    { name: 'Cart', href: '/customer/cart', icon: ShoppingCart, current: false },
    { name: 'Orders', href: '/customer/orders', icon: Clock, current: true },
    { name: 'Wishlist', href: '/customer/wishlist', icon: Heart, current: false },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getAll();
      const rawOrders = response.data?.data || response.data || [];

      const mapped = (rawOrders || []).map(o => {
        const deliveryAddress =
          o.deliveryAddress ||
          o.trackingNumber ||
          '';
        const items = (o.orderItems || o.items || []).map(oi => ({
          name: oi.productName || oi.product?.name || oi.name || 'Item',
          quantity: oi.quantity || 1,
          price: oi.price || oi.unitPrice || 0
        }));

        return {
          orderId: o.orderId,
          orderNumber: o.orderNumber,
          status: o.status,
          orderDate: o.orderDate,
          total: o.finalAmount ?? o.totalAmount ?? 0,
          estimatedDelivery: o.estimatedDeliveryDate || o.orderDate,
          deliveryAddress,
          paymentMethod: o.paymentMethod || 'N/A',
          items
        };
      });

      setOrders(mapped);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return Clock;
      case 'Processing': return Truck;
      case 'Confirmed': return Truck;
      case 'Delivered': return CheckCircle;
      case 'Cancelled': return XCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'text-blue-600 bg-blue-100';
      case 'Processing': return 'text-yellow-600 bg-yellow-100';
      case 'Confirmed': return 'text-purple-600 bg-purple-100';
      case 'Delivered': return 'text-green-600 bg-green-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusSortOrder = (status) => {
    switch (status) {
      case 'Pending': return 1;
      case 'Processing': return 2;
      case 'Confirmed': return 3;
      case 'Out for Delivery': return 4;
      case 'Delivered': return 5;
      case 'Cancelled': return 6;
      default: return 7;
    }
  };

  const filteredOrders = orders
    .filter(order => {
      const items = order.items || [];
      const matchesSearch =
        order.orderId?.toString().includes(searchTerm) ||
        items.some(item => (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => getStatusSortOrder(a.status) - getStatusSortOrder(b.status));

  if (loading) {
    return <LoadingSpinner text="Loading orders..." fullScreen />;
  }

  return (
    <Layout navigation={navigation} title="My Orders">
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600">Track and manage your orders</p>
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
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'Pending').length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Shipped</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'Confirmed').length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Truck className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'Delivered').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
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
                <option value="Confirmed">Confirmed</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order, index) => {
            const StatusIcon = getStatusIcon(order.status);
            return (
              <div key={order.orderId} className="card card-hover" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Order #{order.orderId}
                      </h3>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {order.status}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p><span className="font-medium">Order Date:</span> {new Date(order.orderDate).toLocaleDateString()}</p>
                        <p><span className="font-medium">Items:</span> {order.items.length} items</p>
                      </div>
                      <div>
                        <p><span className="font-medium">Total:</span> ₹{order.total.toFixed(2)}</p>
                        <p><span className="font-medium">Expected Delivery:</span> {new Date(order.estimatedDelivery).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Items Preview */}
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Items:</p>
                      <div className="flex flex-wrap gap-2">
                        {order.items.map((item, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {item.name} (x{item.quantity})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      className="btn-secondary text-sm py-2 px-4 flex items-center gap-1"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowDetailsModal(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                    {order.status === 'Delivered' && (
                      <button className="btn-primary text-sm py-2 px-4">
                        Reorder
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'You haven\'t placed any orders yet'
              }
            </p>
            <button 
              className="btn-primary"
              onClick={() => window.location.href = '/customer/products'}
            >
              Start Shopping
            </button>
          </div>
        )}
      </div>

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
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium">#{selectedOrder.orderNumber || selectedOrder.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">
                        {new Date(selectedOrder.orderDate).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {(() => {
                          const StatusIcon = getStatusIcon(selectedOrder.status);
                          return <StatusIcon className="h-3 w-3 mr-1" />;
                        })()}
                        <span>{selectedOrder.status}</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium">{selectedOrder.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                {selectedOrder.deliveryAddress && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Delivery Address</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedOrder.deliveryAddress}
                    </p>
                  </div>
                )}
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Items</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm text-gray-700"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity} × ₹{(item.price || 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="font-semibold text-gray-900">
                          ₹{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold text-gray-900">
                      ₹{(selectedOrder.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
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

export default CustomerOrders;

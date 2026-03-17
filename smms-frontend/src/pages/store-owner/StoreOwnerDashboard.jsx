import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { 
  Store, 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Plus,
  Eye,
  Edit,
  BarChart3,
  ArrowUpRight,
  Truck,
  ArrowDownRight,
  Activity,
  Calendar,
  Clock,
  Database
} from 'lucide-react';
import { productAPI, orderAPI, customerAPI } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

const StoreOwnerDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigation = [
    { name: 'Dashboard', href: '/store-owner/dashboard', icon: BarChart3, current: true },
    { name: 'Products', href: '/store-owner/products', icon: Package, current: false },
    { name: 'Categories', href: '/admin/categories', icon: Database, current: false },
    { name: 'Orders', href: '/store-owner/orders', icon: ShoppingCart, current: false },
    { name: 'Customers', href: '/store-owner/customers', icon: Users, current: false },
    { name: 'Delivery Staff', href: '/store-owner/delivery-staff', icon: Truck, current: false },
    { name: 'Store Profile', href: '/store-owner/profile', icon: Store, current: false },
  ];

  useEffect(() => {
    fetchDashboardData();
    console.log('🔍 StoreOwnerDashboard loaded with Categories in navigation');
    
    // Test Categories navigation after component mounts
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading dashboard data from backend...');
      
      // Fetch real data from backend APIs
      const [productsResponse, ordersResponse, customersResponse] = await Promise.allSettled([
        productAPI.getAll(),
        orderAPI.getAll(),
        customerAPI.getAll()
      ]);

      // Process products data
      let products = [];
      let lowStock = [];
      if (productsResponse.status === 'fulfilled' && productsResponse.value?.data) {
        products = productsResponse.value.data;
        // Filter low stock products (assuming products have currentStock and lowStockValue fields)
        lowStock = products.filter(product => 
          product.currentStock <= (product.lowStockValue || 5)
        );
      }

      // Process orders data
      let orders = [];
      let pendingOrders = [];
      let totalRevenue = 0;
      if (ordersResponse.status === 'fulfilled' && ordersResponse.value?.data) {
        orders = ordersResponse.value.data;
        pendingOrders = orders.filter(order => order.status === 'Pending');
        totalRevenue = orders
          .filter(order => order.status === 'Delivered')
          .reduce((sum, order) => sum + (order.finalAmount || 0), 0);
      }

      // Process customers data
      let customers = [];
      if (customersResponse.status === 'fulfilled' && customersResponse.value?.data) {
        customers = customersResponse.value.data;
      }

      // Update stats with real data
      const realStats = {
        totalProducts: products.length,
        lowStockProducts: lowStock.length,
        totalOrders: orders.length,
        totalRevenue: totalRevenue,
        totalCustomers: customers.length,
        pendingOrders: pendingOrders.length
      };

      // Get recent orders (last 5)
      const recentOrdersData = orders
        .sort((a, b) => new Date(b.orderDate || b.createdAt) - new Date(a.orderDate || a.createdAt))
        .slice(0, 5);

      // Get low stock products (first 5)
      const lowStockData = lowStock.slice(0, 5);

      setStats(realStats);
      setRecentOrders(recentOrdersData);
      setLowStockProducts(lowStockData);
      
      console.log('✅ Dashboard data loaded successfully from backend:', {
        products: products.length,
        orders: orders.length,
        customers: customers.length,
        lowStock: lowStock.length
      });

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setStats({
        totalProducts: 0,
        lowStockProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        pendingOrders: 0
      });
      setRecentOrders([]);
      setLowStockProducts([]);
      toast.error('Failed to load store dashboard data from server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'Confirmed':
        return 'status-confirmed';
      case 'Delivered':
        return 'status-delivered';
      case 'Cancelled':
        return 'status-cancelled';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatusColor = (currentStock, lowStockValue) => {
    if (currentStock === 0) return 'text-red-600';
    if (currentStock <= lowStockValue) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return <LoadingSpinner text="Loading your store dashboard..." />;
  }

  const statsCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockProducts,
      icon: AlertTriangle,
      color: 'yellow',
      gradient: 'from-yellow-500 to-yellow-600',
      bgGradient: 'from-yellow-50 to-yellow-100',
      change: '-5%',
      changeType: 'decrease'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      change: '+23%',
      changeType: 'increase'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-50 to-orange-100',
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
      change: '+18%',
      changeType: 'increase'
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100',
      change: '+15%',
      changeType: 'increase'
    }
  ];

  return (
    <Layout navigation={navigation} title="Store Dashboard">
      <div className="space-y-8 fade-in">
        {/* Welcome Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 rounded-3xl p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <Store className="h-8 w-8" />
                  Store Management
                </h2>
                <p className="text-green-100 text-lg">Manage your products, orders, and customers efficiently</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm">Live Dashboard</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <TrendingUp className="h-16 w-16 text-white/80" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statsCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.title} className="stats-card group" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                    <div className="flex items-center gap-2">
                      {stat.changeType === 'increase' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </span>
                      <span className="text-sm text-gray-500">vs last month</span>
                    </div>
                  </div>
                  <div className={`p-4 bg-gradient-to-br ${stat.bgGradient} rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className={`h-8 w-8 text-${stat.color}-600`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="card-gradient rounded-3xl p-6 shadow-soft border border-gray-200/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6 text-green-600" />
                  Recent Orders
                </h3>
                <p className="text-sm text-gray-600">Latest customer orders</p>
              </div>
              <a 
                href="/store-owner/orders" 
                className="btn-secondary text-sm px-4 py-2"
              >
                View All
              </a>
            </div>
            
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order, index) => (
                  <div key={order.orderId} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                        #{order.orderNumber || order.orderId}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Order #{order.orderNumber || order.orderId}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`status-badge ${getStatusColor(order.status)} mb-2`}>
                        {order.status}
                      </span>
                      <p className="text-lg font-bold text-gray-900">
                        ₹{order.finalAmount?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg font-medium">No orders yet</p>
                <p className="text-gray-500 text-sm">Orders will appear here once customers start purchasing</p>
              </div>
            )}
          </div>

          {/* Low Stock Products */}
          <div className="card-gradient rounded-3xl p-6 shadow-soft border border-gray-200/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  Low Stock Alert
                </h3>
                <p className="text-sm text-gray-600">Products running low on inventory</p>
              </div>
              <a 
                href="/store-owner/products" 
                className="btn-warning text-sm px-4 py-2"
              >
                Manage Stock
              </a>
            </div>
            
            {lowStockProducts.length > 0 ? (
              <div className="space-y-4">
                {lowStockProducts.map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border border-red-200/50 hover:shadow-md transition-all duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          Stock: <span className={`font-bold ${getStockStatusColor(product.currentStock, product.lowStockValue)}`}>
                            {product.currentStock} units
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">₹{product.price}</p>
                      <button className="text-sm text-red-600 hover:text-red-700 font-semibold hover:underline transition-colors duration-200">
                        Restock Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-10 w-10 text-green-600" />
                </div>
                <p className="text-gray-600 text-lg font-medium">All products well stocked!</p>
                <p className="text-gray-500 text-sm">Your inventory levels are healthy</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-gradient rounded-3xl p-8 shadow-soft border border-gray-200/50">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Quick Actions</h3>
            <p className="text-gray-600">Frequently used store management tools</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                href: "/store-owner/products/new",
                icon: Plus,
                title: "Add Product",
                description: "Create new product",
                gradient: "from-green-500 to-green-600",
                bgGradient: "from-green-50 to-green-100"
              },
              {
                href: "/store-owner/orders",
                icon: Eye,
                title: "View Orders",
                description: "Check all orders",
                gradient: "from-blue-500 to-blue-600",
                bgGradient: "from-blue-50 to-blue-100"
              },
              {
                href: "/admin/categories",
                icon: Database,
                title: "Categories",
                description: "Manage categories",
                gradient: "from-orange-500 to-orange-600",
                bgGradient: "from-orange-50 to-orange-100"
              },
              {
                href: "/store-owner/customers",
                icon: Users,
                title: "View Customers",
                description: "Customer insights",
                gradient: "from-indigo-500 to-indigo-600",
                bgGradient: "from-indigo-50 to-indigo-100"
              }
            ].map((action, index) => {
              console.log('🎯 Quick Action Button:', action.title, action.href);
              const IconComponent = action.icon;
              return (
                <a
                  key={action.title}
                  href={action.href}
                  className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  <div className="relative z-10 text-center">
                    <div className={`inline-flex p-4 bg-gradient-to-br ${action.gradient} rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{action.title}</h4>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StoreOwnerDashboard;

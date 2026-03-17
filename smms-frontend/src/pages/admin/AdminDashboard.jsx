import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  Store,
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
  Shield,
  Database,
  Settings,
  UserCheck,
  MapPin
} from 'lucide-react';
import { productAPI, orderAPI, customerAPI, userAPI, deliveryStaffAPI } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalStoreOwners: 0,
    totalCustomers: 0,
    totalDeliveryStaff: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3, current: true },
    { name: 'Products', href: '/admin/products', icon: Package, current: false },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, current: false },
    { name: 'Customers', href: '/admin/customers', icon: UserCheck, current: false },
    { name: 'Delivery Staff', href: '/admin/delivery-staff', icon: Truck, current: false },
    { name: 'Categories', href: '/admin/categories', icon: Database, current: false },
    { name: 'Zones', href: '/admin/zones', icon: MapPin, current: false },
    { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        usersResponse,
        productsResponse,
        ordersResponse,
        customersResponse,
        staffResponse
      ] = await Promise.allSettled([
        userAPI.getAll(),
        productAPI.getAll(),
        orderAPI.getAll(),
        customerAPI.getAll(),
        deliveryStaffAPI.getAll()
      ]);

      const toList = (res) => (Array.isArray(res?.data) ? res.data : res?.data?.data ?? []);
      let users = toList(usersResponse.status === 'fulfilled' ? usersResponse.value : null);
      let products = toList(productsResponse.status === 'fulfilled' ? productsResponse.value : null);
      let orders = toList(ordersResponse.status === 'fulfilled' ? ordersResponse.value : null);
      let customers = toList(customersResponse.status === 'fulfilled' ? customersResponse.value : null);
      let deliveryStaff = toList(staffResponse.status === 'fulfilled' ? staffResponse.value : null);
      const storeOwners = users.filter((u) => u.role === 'StoreOwner');
      const pendingOrders = orders.filter((o) => o.status === 'Pending');
      const totalRevenue = orders
        .filter((o) => o.status === 'Delivered')
        .reduce((sum, o) => sum + (Number(o.finalAmount) || 0), 0);

      // Update stats with real data
      const realStats = {
        totalUsers: users.length,
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue: totalRevenue,
        totalStoreOwners: storeOwners.length,
        totalCustomers: customers.length,
        totalDeliveryStaff: deliveryStaff.length,
        pendingOrders: pendingOrders.length
      };

      // Get recent orders (last 5)
      const recentOrdersData = orders
        .sort((a, b) => new Date(b.orderDate || b.createdAt) - new Date(a.orderDate || a.createdAt))
        .slice(0, 5);

      setStats(realStats);
      setRecentOrders(recentOrdersData);
      
      console.log('✅ Admin dashboard data loaded successfully from backend:', {
        users: users.length,
        products: products.length,
        orders: orders.length,
        customers: customers.length
      });

    } catch (error) {
      console.error('❌ Error fetching admin dashboard data:', error);
      setStats({
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalStoreOwners: 0,
        totalCustomers: 0,
        totalDeliveryStaff: 0,
        pendingOrders: 0
      });
      setRecentOrders([]);
      toast.error('Failed to load admin dashboard data from server. Please try again.');
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

  if (loading) {
    return <LoadingSpinner text="Loading admin dashboard..." />;
  }

  const statsCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
      change: '+8%',
      changeType: 'increase'
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
      change: '+5%',
      changeType: 'increase'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100',
      change: '+18%',
      changeType: 'increase'
    },
    {
      title: 'Delivery Staff',
      value: stats.totalDeliveryStaff,
      icon: Truck,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100',
      change: '+7%',
      changeType: 'increase'
    }
  ];

  return (
    <Layout navigation={navigation} title="Admin Dashboard">
      <div className="space-y-8 fade-in">
        {/* Welcome Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <Shield className="h-8 w-8" />
                  System Administration
                </h2>
                <p className="text-purple-100 text-lg">Complete control over the SMMS platform</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm">Live Monitoring</span>
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

        <div className="grid grid-cols-1 xl:grid-cols-1 gap-8">
          {/* Recent Orders */}
          <div className="card-gradient rounded-3xl p-6 shadow-soft border border-gray-200/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6 text-green-600" />
                  Recent Orders
                </h3>
                <p className="text-sm text-gray-600">Latest platform orders</p>
              </div>
              <button 
                onClick={() => window.location.href = '/admin/orders'}
                className="btn-secondary text-sm px-4 py-2"
              >
                View All
              </button>
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
        </div>

        {/* Quick Actions */}
        <div className="card-gradient rounded-3xl p-8 shadow-soft border border-gray-200/50">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Admin Quick Actions</h3>
            <p className="text-gray-600">Frequently used administrative tools</p>
            
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                href: "/admin/products",
                icon: Package,
                title: "Manage Products",
                description: "View all products",
                gradient: "from-green-500 to-green-600",
                bgGradient: "from-green-50 to-green-100"
              },
              {
                href: "/admin/orders",
                icon: ShoppingCart,
                title: "Manage Orders",
                description: "Monitor all orders",
                gradient: "from-blue-500 to-blue-600",
                bgGradient: "from-blue-50 to-blue-100"
              },
              {
                href: "/admin/categories",
                icon: Database,
                title: "Manage Categories",
                description: "Product categories",
                gradient: "from-indigo-500 to-indigo-600",
                bgGradient: "from-indigo-50 to-indigo-100"
              }
            ].map((action, index) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={action.title}
                  onClick={() => window.location.href = action.href}
                  className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 w-full text-left"
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
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;

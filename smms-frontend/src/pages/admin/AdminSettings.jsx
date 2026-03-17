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
  Save,
  RefreshCw,
  Shield,
  Bell,
  Globe,
  Mail,
  Phone,
  MapPin as Location,
  Clock,
  DollarSign
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    // System Settings
    systemName: 'SMMS - Store Management System',
    systemVersion: '1.0.0',
    maintenanceMode: false,
    
    // Business Settings
    businessName: 'SMMS Store',
    businessEmail: 'admin@smms.com',
    businessPhone: '+91 9876543210',
    businessAddress: '123 Business Street, City, State, Country',
    
    // Delivery Settings
    defaultDeliveryFee: 50,
    freeDeliveryThreshold: 500,
    maxDeliveryRadius: 25,
    deliveryTimeSlots: ['9:00 AM - 12:00 PM', '12:00 PM - 3:00 PM', '3:00 PM - 6:00 PM', '6:00 PM - 9:00 PM'],
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderNotifications: true,
    lowStockAlerts: true,
    
    // Payment Settings
    acceptCash: true,
    acceptCard: true,
    acceptUPI: true,
    acceptWallet: false,
    
    // Tax Settings
    taxRate: 18,
    taxIncluded: false,
    
    // Other Settings
    allowGuestCheckout: false,
    requireEmailVerification: true,
    autoAssignDelivery: true,
    showOutOfStock: false
  });

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3, current: false },
    { name: 'Products', href: '/admin/products', icon: Package, current: false },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, current: false },
    { name: 'Customers', href: '/admin/customers', icon: UserCheck, current: false },
    { name: 'Delivery Staff', href: '/admin/delivery-staff', icon: Truck, current: false },
    { name: 'Categories', href: '/admin/categories', icon: Database, current: false },
    { name: 'Zones', href: '/admin/zones', icon: MapPin, current: false },
    { name: 'Settings', href: '/admin/settings', icon: Settings, current: true },
  ];

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      console.log('💾 Saving admin settings:', settings);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would save to backend
      localStorage.setItem('adminSettings', JSON.stringify(settings));
      
      toast.success('Settings saved successfully!');
      console.log('✅ Settings saved successfully');
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      toast.error('Error saving settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = async () => {
    const isConfirmed = await showConfirm(
      'Reset Settings?',
      'Are you sure you want to reset all settings to default values?',
      'warning'
    );
    if (isConfirmed) {
      // Reset to default values
      setSettings({
        systemName: 'SMMS - Store Management System',
        systemVersion: '1.0.0',
        maintenanceMode: false,
        businessName: 'SMMS Store',
        businessEmail: 'admin@smms.com',
        businessPhone: '+91 9876543210',
        businessAddress: '123 Business Street, City, State, Country',
        defaultDeliveryFee: 50,
        freeDeliveryThreshold: 500,
        maxDeliveryRadius: 25,
        deliveryTimeSlots: ['9:00 AM - 12:00 PM', '12:00 PM - 3:00 PM', '3:00 PM - 6:00 PM', '6:00 PM - 9:00 PM'],
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        orderNotifications: true,
        lowStockAlerts: true,
        acceptCash: true,
        acceptCard: true,
        acceptUPI: true,
        acceptWallet: false,
        taxRate: 18,
        taxIncluded: false,
        allowGuestCheckout: false,
        requireEmailVerification: true,
        autoAssignDelivery: true,
        showOutOfStock: false
      });
    }
  };

  useEffect(() => {
    // Load settings from localStorage on component mount
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  if (loading) {
    return <LoadingSpinner text="Saving settings..." />;
  }

  return (
    <Layout navigation={navigation} title="System Settings">
      <div className="space-y-8 fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="h-7 w-7 text-gray-600" />
              System Settings
            </h2>
            <p className="text-gray-600">Configure system-wide settings and preferences</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleResetSettings}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reset to Default
            </button>
            <button
              onClick={handleSaveSettings}
              className="btn-primary flex items-center gap-2"
              disabled={loading}
            >
              <Save className="h-4 w-4" />
              Save Settings
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* System Settings */}
          <div className="card-gradient rounded-2xl p-6 shadow-soft border border-gray-200/50">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              System Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">System Name</label>
                <input
                  type="text"
                  value={settings.systemName}
                  onChange={(e) => setSettings({...settings, systemName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                <input
                  type="text"
                  value={settings.systemVersion}
                  onChange={(e) => setSettings({...settings, systemVersion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-700">
                  Maintenance Mode
                </label>
              </div>
            </div>
          </div>

          {/* Business Settings */}
          <div className="card-gradient rounded-2xl p-6 shadow-soft border border-gray-200/50">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Store className="h-5 w-5 text-green-600" />
              Business Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={settings.businessName}
                  onChange={(e) => setSettings({...settings, businessName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={settings.businessEmail}
                  onChange={(e) => setSettings({...settings, businessEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={settings.businessPhone}
                  onChange={(e) => setSettings({...settings, businessPhone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={settings.businessAddress}
                  onChange={(e) => setSettings({...settings, businessAddress: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* Delivery Settings */}
          <div className="card-gradient rounded-2xl p-6 shadow-soft border border-gray-200/50">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-600" />
              Delivery Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Delivery Fee (₹)</label>
                <input
                  type="number"
                  value={settings.defaultDeliveryFee}
                  onChange={(e) => setSettings({...settings, defaultDeliveryFee: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Free Delivery Threshold (₹)</label>
                <input
                  type="number"
                  value={settings.freeDeliveryThreshold}
                  onChange={(e) => setSettings({...settings, freeDeliveryThreshold: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Delivery Radius (km)</label>
                <input
                  type="number"
                  value={settings.maxDeliveryRadius}
                  onChange={(e) => setSettings({...settings, maxDeliveryRadius: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoAssignDelivery"
                  checked={settings.autoAssignDelivery}
                  onChange={(e) => setSettings({...settings, autoAssignDelivery: e.target.checked})}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="autoAssignDelivery" className="ml-2 block text-sm text-gray-700">
                  Auto-assign delivery staff
                </label>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="card-gradient rounded-2xl p-6 shadow-soft border border-gray-200/50">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-600" />
              Notification Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700">
                  Email Notifications
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="smsNotifications"
                  checked={settings.smsNotifications}
                  onChange={(e) => setSettings({...settings, smsNotifications: e.target.checked})}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="smsNotifications" className="ml-2 block text-sm text-gray-700">
                  SMS Notifications
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pushNotifications"
                  checked={settings.pushNotifications}
                  onChange={(e) => setSettings({...settings, pushNotifications: e.target.checked})}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="pushNotifications" className="ml-2 block text-sm text-gray-700">
                  Push Notifications
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="orderNotifications"
                  checked={settings.orderNotifications}
                  onChange={(e) => setSettings({...settings, orderNotifications: e.target.checked})}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="orderNotifications" className="ml-2 block text-sm text-gray-700">
                  Order Notifications
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="lowStockAlerts"
                  checked={settings.lowStockAlerts}
                  onChange={(e) => setSettings({...settings, lowStockAlerts: e.target.checked})}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="lowStockAlerts" className="ml-2 block text-sm text-gray-700">
                  Low Stock Alerts
                </label>
              </div>
            </div>
          </div>

          {/* Payment Settings */}
          <div className="card-gradient rounded-2xl p-6 shadow-soft border border-gray-200/50">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Payment Configuration
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="acceptCash"
                    checked={settings.acceptCash}
                    onChange={(e) => setSettings({...settings, acceptCash: e.target.checked})}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="acceptCash" className="ml-2 block text-sm text-gray-700">
                    Cash on Delivery
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="acceptCard"
                    checked={settings.acceptCard}
                    onChange={(e) => setSettings({...settings, acceptCard: e.target.checked})}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="acceptCard" className="ml-2 block text-sm text-gray-700">
                    Credit/Debit Card
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="acceptUPI"
                    checked={settings.acceptUPI}
                    onChange={(e) => setSettings({...settings, acceptUPI: e.target.checked})}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="acceptUPI" className="ml-2 block text-sm text-gray-700">
                    UPI Payment
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="acceptWallet"
                    checked={settings.acceptWallet}
                    onChange={(e) => setSettings({...settings, acceptWallet: e.target.checked})}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="acceptWallet" className="ml-2 block text-sm text-gray-700">
                    Digital Wallet
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({...settings, taxRate: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="taxIncluded"
                  checked={settings.taxIncluded}
                  onChange={(e) => setSettings({...settings, taxIncluded: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="taxIncluded" className="ml-2 block text-sm text-gray-700">
                  Tax included in product prices
                </label>
              </div>
            </div>
          </div>

          {/* Other Settings */}
          <div className="card-gradient rounded-2xl p-6 shadow-soft border border-gray-200/50">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-600" />
              General Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowGuestCheckout"
                  checked={settings.allowGuestCheckout}
                  onChange={(e) => setSettings({...settings, allowGuestCheckout: e.target.checked})}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="allowGuestCheckout" className="ml-2 block text-sm text-gray-700">
                  Allow guest checkout
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireEmailVerification"
                  checked={settings.requireEmailVerification}
                  onChange={(e) => setSettings({...settings, requireEmailVerification: e.target.checked})}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="requireEmailVerification" className="ml-2 block text-sm text-gray-700">
                  Require email verification
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showOutOfStock"
                  checked={settings.showOutOfStock}
                  onChange={(e) => setSettings({...settings, showOutOfStock: e.target.checked})}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="showOutOfStock" className="ml-2 block text-sm text-gray-700">
                  Show out-of-stock products
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            className="btn-primary flex items-center gap-2 px-8 py-3 text-lg"
            disabled={loading}
          >
            <Save className="h-5 w-5" />
            {loading ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default AdminSettings;

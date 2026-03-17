import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { JwtAuthProvider } from './contexts/JwtAuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/Register';

// Customer
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerProducts from './pages/customer/CustomerProducts';
import CustomerCart from './pages/customer/CustomerCart';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerWishlist from './pages/customer/CustomerWishlist';

// Store Owner (Admin)
import StoreOwnerDashboard from './pages/store-owner/StoreOwnerDashboard';
import StoreOwnerOrders from './pages/store-owner/StoreOwnerOrders';
import StoreOwnerCustomers from './pages/store-owner/StoreOwnerCustomers';
import StoreOwnerDeliveryStaff from './pages/store-owner/StoreOwnerDeliveryStaff';
import StoreOwnerProfile from './pages/store-owner/StoreOwnerProfile';

// Delivery Staff Pages
import DeliveryStaffDashboard from './pages/delivery-staff/DeliveryStaffDashboard';

// Admin Pages (Store Owner has admin access)
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCategories from './pages/admin/AdminCategories';
import AdminZones from './pages/admin/AdminZones';
import AdminSettings from './pages/admin/AdminSettings';
import AdminStoreOwners from './pages/admin/AdminStoreOwners';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminDeliveryStaff from './pages/admin/AdminDeliveryStaff';

// Error Pages
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

function App() {
  return (
    <JwtAuthProvider>
      <Toaster position="top-right" reverseOrder={false} />
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Customer Routes - Full CRUD Access */}
            <Route 
              path="/customer/dashboard" 
              element={
                <ProtectedRoute requiredRole="Customer">
                  <CustomerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer/products" 
              element={
                <ProtectedRoute requiredRole="Customer">
                  <CustomerProducts />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer/cart" 
              element={
                <ProtectedRoute requiredRole="Customer">
                  <CustomerCart />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer/orders" 
              element={
                <ProtectedRoute requiredRole="Customer">
                  <CustomerOrders />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer/wishlist" 
              element={
                <ProtectedRoute requiredRole="Customer">
                  <CustomerWishlist />
                </ProtectedRoute>
              } 
            />
            
            {/* Store Owner Routes - Full CRUD Access */}
            <Route 
              path="/store-owner/dashboard" 
              element={
                <ProtectedRoute requiredRole="StoreOwner">
                  <StoreOwnerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/store-owner/products" 
              element={
                <ProtectedRoute requiredRole="StoreOwner">
                  <AdminProducts />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/store-owner/orders" 
              element={
                <ProtectedRoute requiredRole="StoreOwner">
                  <StoreOwnerOrders />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/store-owner/customers" 
              element={
                <ProtectedRoute requiredRole="StoreOwner">
                  <StoreOwnerCustomers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/store-owner/delivery-staff" 
              element={
                <ProtectedRoute requiredRole="StoreOwner">
                  <StoreOwnerDeliveryStaff />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/store-owner/profile" 
              element={
                <ProtectedRoute requiredRole="StoreOwner">
                  <StoreOwnerProfile />
                </ProtectedRoute>
              } 
            />
            
            {/* Delivery Staff Routes - Full CRUD Access */}
            <Route 
              path="/delivery-staff/dashboard" 
              element={
                <ProtectedRoute requiredRole="DeliveryStaff">
                  <DeliveryStaffDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/delivery-staff/active" 
              element={
                <ProtectedRoute requiredRole="DeliveryStaff">
                  <DeliveryStaffDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/delivery-staff/history" 
              element={
                <ProtectedRoute requiredRole="DeliveryStaff">
                  <DeliveryStaffDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/delivery-staff/routes" 
              element={
                <ProtectedRoute requiredRole="DeliveryStaff">
                  <DeliveryStaffDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/delivery-staff/profile" 
              element={
                <ProtectedRoute requiredRole="DeliveryStaff">
                  <DeliveryStaffDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes (StoreOwner has admin privileges) - Full CRUD Access */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute requiredRole="StoreOwner">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requiredRole="StoreOwner">
                  <AdminUsers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/products" 
              element={
                <ProtectedRoute requiredRole="StoreOwner">
                  <AdminProducts />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/orders" 
              element={
                <ProtectedRoute requiredRole="StoreOwner">
                  <AdminOrders />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/store-owners" 
              element={
                <ProtectedRoute requiredRole="StoreOwner">
                  <AdminStoreOwners />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/customers" 
              element={
                <ProtectedRoute requiredRole="StoreOwner">
                  <AdminCustomers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/delivery-staff" 
              element={
                <ProtectedRoute requiredRole="StoreOwner">
                  <AdminDeliveryStaff />
                </ProtectedRoute>
              } 
            />
            {/* ✅ CATEGORIES ROUTE - This is the missing Categories button fix */}
            <Route 
              path="/admin/categories" 
              element={
                <ProtectedRoute requiredRole="StoreOwner">
                  <AdminCategories />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/zones" 
              element={
                <ProtectedRoute requiredRole="StoreOwner">
                  <AdminZones />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <ProtectedRoute requiredRole="StoreOwner">
                  <AdminSettings />
                </ProtectedRoute>
              } 
            />
            
            {/* Error Routes */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/404" element={<NotFound />} />
            
            {/* Default Route - Always redirect to login first */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </div>
      </Router>
    </JwtAuthProvider>
  );
}

export default App;

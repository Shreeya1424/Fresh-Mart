import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useJwtAuth } from '../../contexts/JwtAuthContext';
import { Eye, EyeOff, User, Store, Truck, Mail, Lock } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

const ROLES = [
  { value: 'Customer', label: 'Customer', icon: User, desc: 'Browse and purchase', color: 'blue' },
  { value: 'StoreOwner', label: 'Store Owner', icon: Store, desc: 'Manage store and products', color: 'green' },
  { value: 'DeliveryStaff', label: 'Delivery Staff', icon: Truck, desc: 'Handle deliveries', color: 'orange' },
];

const getRoleRedirect = (role) => {
  switch (role) {
    case 'StoreOwner': return '/admin/dashboard';
    case 'DeliveryStaff': return '/delivery-staff/dashboard';
    case 'Customer':
    default: return '/customer/dashboard';
  }
};

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '', selectedRole: 'Customer' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { login, loading } = useJwtAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!formData.email?.trim() || !formData.password) {
      setErrors({ general: 'Please enter both email and password' });
      return;
    }
    const result = await login({
      email: formData.email.trim(),
      password: formData.password,
      expectedRole: formData.selectedRole,
    });
    if (result.success) {
      const redirect = getRoleRedirect(result.user?.role || formData.selectedRole);
      navigate(redirect, { replace: true });
    } else {
      setErrors({ general: result.error || 'Login failed' });
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SMMS</h1>
          <p className="text-gray-600 mt-1">Store Management System</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{errors.general}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">Login as</p>
              <div className="flex gap-2">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const active = formData.selectedRole === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, selectedRole: r.value }))}
                      className={`flex-1 flex flex-col items-center py-2 px-3 rounded-lg border-2 transition ${
                        active
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <Icon className="h-5 w-5 mb-1" />
                      <span className="text-xs font-medium">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign in
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-700">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

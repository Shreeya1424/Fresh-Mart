import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJwtAuth } from '../contexts/JwtAuthContext';
import { X, Mail, Lock, Eye, EyeOff, User, Store, Truck, ShoppingCart, Heart } from 'lucide-react';

const ROLES = [
  { value: 'Customer', label: 'Customer', icon: User, color: 'blue' },
  { value: 'StoreOwner', label: 'Store Owner', icon: Store, color: 'green' },
  { value: 'DeliveryStaff', label: 'Delivery', icon: Truck, color: 'orange' },
];

const getRoleRedirect = (role) => {
  switch (role) {
    case 'StoreOwner': return '/admin/dashboard';
    case 'DeliveryStaff': return '/delivery-staff/dashboard';
    case 'Customer':
    default: return '/customer/dashboard';
  }
};

export default function LoginPromptModal({ isOpen, onClose, actionType = 'cart' }) {
  const [mode, setMode] = useState('prompt'); // 'prompt' | 'login'
  const [formData, setFormData] = useState({ email: '', password: '', selectedRole: 'Customer' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useJwtAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const actionText = actionType === 'wishlist' ? 'add to wishlist' : 'add to cart';
  const ActionIcon = actionType === 'wishlist' ? Heart : ShoppingCart;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email?.trim() || !formData.password) {
      setError('Please enter both email and password');
      return;
    }
    setLoading(true);
    const result = await login({
      email: formData.email.trim(),
      password: formData.password,
      expectedRole: formData.selectedRole,
    });
    setLoading(false);
    if (result.success) {
      onClose();
      navigate(getRoleRedirect(result.user?.role || formData.selectedRole), { replace: true });
    } else {
      setError(result.error || 'Login failed');
    }
  };

  const handleClose = () => {
    setMode('prompt');
    setFormData({ email: '', password: '', selectedRole: 'Customer' });
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5">
          <button onClick={handleClose} className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <ActionIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {mode === 'prompt' ? 'Login Required' : 'Sign In'}
              </h2>
              <p className="text-sm text-blue-100">
                {mode === 'prompt' ? `Please login to ${actionText}` : 'Enter your credentials'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {mode === 'prompt' ? (
            /* Prompt Mode */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <ActionIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sign in to continue</h3>
                <p className="text-sm text-gray-500 mt-1">
                  You need to be logged in to {actionText}. It only takes a moment!
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setMode('login')}
                  className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { handleClose(); navigate('/register'); }}
                  className="w-full py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Create Account
                </button>
                <button onClick={handleClose} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">
                  Continue browsing
                </button>
              </div>
            </div>
          ) : (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
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
                    onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
                        onClick={() => setFormData(p => ({ ...p, selectedRole: r.value }))}
                        className={`flex-1 flex flex-col items-center py-2 px-2 rounded-lg border-2 transition text-xs ${
                          active ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        <span className="font-medium">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => setMode('prompt')} className="text-gray-500 hover:text-gray-700">
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => { handleClose(); navigate('/register'); }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

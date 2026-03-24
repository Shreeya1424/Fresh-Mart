import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useJwtAuth } from '../contexts/JwtAuthContext';
import { Eye, EyeOff, User, Mail, Lock, Phone, UserPlus, MapPin, Home } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Register = () => {
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    pincode: '',
    role: 'Customer' // Fixed to Customer only
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  
  const { register, loading } = useJwtAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (serverError) setServerError('');
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Full Name validation
    if (!formData.userName.trim()) {
      newErrors.userName = 'Full name is required';
    } else if (formData.userName.trim().length < 3) {
      newErrors.userName = 'Full name must be at least 3 characters';
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Phone validation
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (phoneDigits.length !== 10) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Complete address is required';
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    // Pincode validation
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Pincode must be exactly 6 digits';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    
    if (!validateForm()) return;

    try {
      const result = await register({
        userName: formData.userName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        pincode: formData.pincode.trim(),
        password: formData.password,
        role: 'Customer'
      });

      if (result.success) {
        navigate('/customer/dashboard');
      } else {
        setServerError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setServerError('An unexpected error occurred. Please try again later.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Creating your account..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-blue-600 p-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Create Customer Account</h1>
            <p className="mt-2 text-blue-100 opacity-90">Join our supermarket and start shopping online</p>
          </div>

          <form className="p-8 space-y-6" onSubmit={handleSubmit}>
            {serverError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                {serverError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name Field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    name="userName"
                    type="text"
                    value={formData.userName}
                    onChange={handleInputChange}
                    className={`input-field pl-10 ${errors.userName ? 'border-red-500 focus:ring-red-100' : ''}`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.userName && <p className="mt-1 text-xs text-red-500 font-medium">{errors.userName}</p>}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`input-field pl-10 ${errors.email ? 'border-red-500 focus:ring-red-100' : ''}`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>}
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`input-field pl-10 ${errors.phone ? 'border-red-500 focus:ring-red-100' : ''}`}
                    placeholder="10-digit number"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-500 font-medium">{errors.phone}</p>}
              </div>

              {/* Address Field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Complete Address *</label>
                <div className="relative">
                  <Home className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    name="address"
                    rows={2}
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`input-field pl-10 resize-none ${errors.address ? 'border-red-500 focus:ring-red-100' : ''}`}
                    placeholder="Street, area, landmark..."
                  />
                </div>
                {errors.address && <p className="mt-1 text-xs text-red-500 font-medium">{errors.address}</p>}
              </div>

              {/* City and Pincode Row */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`input-field pl-10 ${errors.city ? 'border-red-500 focus:ring-red-100' : ''}`}
                    placeholder="City"
                  />
                </div>
                {errors.city && <p className="mt-1 text-xs text-red-500 font-medium">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode *</label>
                <input
                  name="pincode"
                  type="text"
                  maxLength="6"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className={`input-field ${errors.pincode ? 'border-red-500 focus:ring-red-100' : ''}`}
                  placeholder="6-digit PIN"
                />
                {errors.pincode && <p className="mt-1 text-xs text-red-500 font-medium">{errors.pincode}</p>}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500 focus:ring-red-100' : ''}`}
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500 font-medium">{errors.password}</p>}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`input-field pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-100' : ''}`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-500 font-medium">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-4 flex justify-center items-center gap-2 text-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                    <span>Creating your account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    <span>Create Customer Account</span>
                  </>
                )}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center pt-2">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-bold text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
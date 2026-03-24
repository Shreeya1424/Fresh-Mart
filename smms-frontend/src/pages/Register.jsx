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
    city: 'Rajkot',
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
    
    // Prevent changing city
    if (name === 'city') return;

    // Handle phone number digits only
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: digitsOnly }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

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

          <form className="p-10 space-y-8" onSubmit={handleSubmit}>
            {serverError && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-sm font-medium flex items-center gap-3 animate-shake">
                <div className="flex-shrink-0 w-2 h-2 bg-red-600 rounded-full"></div>
                {serverError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Name Field */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 ml-1">
                  <User className="h-4 w-4 text-blue-600" />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="userName"
                  type="text"
                  value={formData.userName}
                  onChange={handleInputChange}
                  className={`w-full px-5 py-3.5 bg-gray-50 border-2 rounded-2xl transition-all duration-200 outline-none ${
                    errors.userName 
                    ? 'border-red-200 focus:border-red-500 bg-red-50/30' 
                    : 'border-transparent focus:border-blue-500 focus:bg-white'
                  } shadow-sm hover:shadow-md`}
                  placeholder="Enter your full name"
                />
                {errors.userName && <p className="mt-2 text-xs text-red-500 font-bold ml-1">{errors.userName}</p>}
              </div>

              {/* Email Field */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 ml-1">
                  <Mail className="h-4 w-4 text-blue-600" />
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-5 py-3.5 bg-gray-50 border-2 rounded-2xl transition-all duration-200 outline-none ${
                    errors.email 
                    ? 'border-red-200 focus:border-red-500 bg-red-50/30' 
                    : 'border-transparent focus:border-blue-500 focus:bg-white'
                  } shadow-sm hover:shadow-md`}
                  placeholder="you@example.com"
                />
                {errors.email && <p className="mt-2 text-xs text-red-500 font-bold ml-1">{errors.email}</p>}
              </div>

              {/* Phone Field */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 ml-1">
                  <Phone className="h-4 w-4 text-blue-600" />
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 flex items-center px-4 pointer-events-none z-10 border-r-2 border-gray-200 my-2">
                    <span className="text-blue-700 font-black text-sm">+91</span>
                  </div>
                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full pl-16 pr-5 py-3.5 bg-gray-50 border-2 rounded-2xl transition-all duration-200 outline-none ${
                      errors.phone 
                      ? 'border-red-200 focus:border-red-500 bg-red-50/30' 
                      : 'border-transparent focus:border-blue-500 focus:bg-white'
                    } shadow-sm hover:shadow-md`}
                    placeholder="10-digit number"
                  />
                </div>
                {errors.phone && <p className="mt-2 text-xs text-red-500 font-bold ml-1">{errors.phone}</p>}
              </div>

              {/* Address Field */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 ml-1">
                  <Home className="h-4 w-4 text-blue-600" />
                  Complete Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`w-full px-5 py-3.5 bg-gray-50 border-2 rounded-2xl transition-all duration-200 outline-none resize-none ${
                    errors.address 
                    ? 'border-red-200 focus:border-red-500 bg-red-50/30' 
                    : 'border-transparent focus:border-blue-500 focus:bg-white'
                  } shadow-sm hover:shadow-md`}
                  placeholder="Street, area, landmark..."
                />
                {errors.address && <p className="mt-2 text-xs text-red-500 font-bold ml-1">{errors.address}</p>}
              </div>

              {/* City Row */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 ml-1">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  City
                </label>
                <input
                  name="city"
                  type="text"
                  value={formData.city}
                  readOnly
                  className="w-full px-5 py-3.5 bg-gray-100 border-2 border-transparent rounded-2xl text-gray-500 cursor-not-allowed font-bold"
                />
              </div>

              {/* Pincode */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 ml-1">
                  <Database className="h-4 w-4 text-blue-600" />
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  name="pincode"
                  type="text"
                  maxLength="6"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className={`w-full px-5 py-3.5 bg-gray-50 border-2 rounded-2xl transition-all duration-200 outline-none ${
                    errors.pincode 
                    ? 'border-red-200 focus:border-red-500 bg-red-50/30' 
                    : 'border-transparent focus:border-blue-500 focus:bg-white'
                  } shadow-sm hover:shadow-md`}
                  placeholder="6-digit PIN"
                />
                {errors.pincode && <p className="mt-2 text-xs text-red-500 font-bold ml-1">{errors.pincode}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 ml-1">
                  <Lock className="h-4 w-4 text-blue-600" />
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-5 py-3.5 bg-gray-50 border-2 rounded-2xl transition-all duration-200 outline-none ${
                      errors.password 
                      ? 'border-red-200 focus:border-red-500 bg-red-50/30' 
                      : 'border-transparent focus:border-blue-500 focus:bg-white'
                    } shadow-sm hover:shadow-md pr-14`}
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-2 text-xs text-red-500 font-bold ml-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 ml-1">
                  <Lock className="h-4 w-4 text-blue-600" />
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-5 py-3.5 bg-gray-50 border-2 rounded-2xl transition-all duration-200 outline-none ${
                      errors.confirmPassword 
                      ? 'border-red-200 focus:border-red-500 bg-red-50/30' 
                      : 'border-transparent focus:border-blue-500 focus:bg-white'
                    } shadow-sm hover:shadow-md pr-14`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-2 text-xs text-red-500 font-bold ml-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-3 border-white/30 border-t-white"></div>
                    <span>CREATING ACCOUNT...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-6 w-6" />
                    <span>CREATE ACCOUNT</span>
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
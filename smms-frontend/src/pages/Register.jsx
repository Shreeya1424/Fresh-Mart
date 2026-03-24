import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useJwtAuth } from '../contexts/JwtAuthContext';
import { Eye, EyeOff, User, Mail, Lock, Phone, UserPlus, MapPin, Home, Database, ArrowLeft } from 'lucide-react';
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
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { register, logout, loading } = useJwtAuth();
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
        // Log out immediately to follow the "register -> then manual login" flow
        logout();
        setIsSuccess(true);
        // Automatically redirect after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-6 px-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-12 text-center border border-green-100">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
            <UserPlus className="h-12 w-12" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Registration Successful!</h2>
          <p className="text-gray-500 font-medium text-lg leading-relaxed mb-8">
            Your account has been created. You will be redirected to the login page in a moment to sign in manually.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0"
          >
            LOGIN NOW
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        {/* Floating Back Button */}
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 mb-6 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/50 overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-10 text-white text-center relative overflow-hidden">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl mb-6 shadow-xl">
                <UserPlus className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-black tracking-tight">Create Account</h1>
              <p className="mt-3 text-blue-100 font-medium text-lg opacity-90">Start your shopping journey with Fresh Mart</p>
            </div>
          </div>

          <form className="p-8 sm:p-12 space-y-10" onSubmit={handleSubmit}>
            {serverError && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-2xl text-sm font-bold flex items-center gap-3 animate-shake">
                <div className="flex-shrink-0 w-2 h-2 bg-red-600 rounded-full"></div>
                {serverError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              {/* Full Name */}
              <div className="md:col-span-2 group">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mb-3 ml-1 group-focus-within:text-blue-600 transition-colors">
                  <User className="h-4 w-4" />
                  Full Name
                </label>
                <input
                  name="userName"
                  type="text"
                  value={formData.userName}
                  onChange={handleInputChange}
                  className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl transition-all duration-300 outline-none text-gray-900 font-bold placeholder:text-gray-300 ${
                    errors.userName 
                    ? 'border-red-100 focus:border-red-500 bg-red-50/30' 
                    : 'border-transparent focus:border-blue-600 focus:bg-white focus:shadow-xl focus:shadow-blue-500/10'
                  }`}
                  placeholder="e.g. John Doe"
                />
                {errors.userName && <p className="mt-2 text-[11px] text-red-500 font-black uppercase tracking-wider ml-2">{errors.userName}</p>}
              </div>

              {/* Email */}
              <div className="group">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mb-3 ml-1 group-focus-within:text-blue-600 transition-colors">
                  <Mail className="h-4 w-4" />
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl transition-all duration-300 outline-none text-gray-900 font-bold placeholder:text-gray-300 ${
                    errors.email 
                    ? 'border-red-100 focus:border-red-500 bg-red-50/30' 
                    : 'border-transparent focus:border-blue-600 focus:bg-white focus:shadow-xl focus:shadow-blue-500/10'
                  }`}
                  placeholder="john@example.com"
                />
                {errors.email && <p className="mt-2 text-[11px] text-red-500 font-black uppercase tracking-wider ml-2">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div className="group">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mb-3 ml-1 group-focus-within:text-blue-600 transition-colors">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 flex items-center px-5 pointer-events-none border-r-2 border-gray-200/50 my-3">
                    <span className="text-blue-600 font-black text-sm">+91</span>
                  </div>
                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full pl-20 pr-6 py-4 bg-gray-50 border-2 rounded-2xl transition-all duration-300 outline-none text-gray-900 font-bold placeholder:text-gray-300 ${
                      errors.phone 
                      ? 'border-red-100 focus:border-red-500 bg-red-50/30' 
                      : 'border-transparent focus:border-blue-600 focus:bg-white focus:shadow-xl focus:shadow-blue-500/10'
                    }`}
                    placeholder="98765 43210"
                  />
                </div>
                {errors.phone && <p className="mt-2 text-[11px] text-red-500 font-black uppercase tracking-wider ml-2">{errors.phone}</p>}
              </div>

              {/* Address */}
              <div className="md:col-span-2 group">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mb-3 ml-1 group-focus-within:text-blue-600 transition-colors">
                  <Home className="h-4 w-4" />
                  Residential Address
                </label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl transition-all duration-300 outline-none resize-none text-gray-900 font-bold placeholder:text-gray-300 ${
                    errors.address 
                    ? 'border-red-100 focus:border-red-500 bg-red-50/30' 
                    : 'border-transparent focus:border-blue-600 focus:bg-white focus:shadow-xl focus:shadow-blue-500/10'
                  }`}
                  placeholder="Apartment, Street, Area..."
                />
                {errors.address && <p className="mt-2 text-[11px] text-red-500 font-black uppercase tracking-wider ml-2">{errors.address}</p>}
              </div>

              {/* City */}
              <div className="group">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mb-3 ml-1 transition-colors">
                  <MapPin className="h-4 w-4" />
                  Current City
                </label>
                <input
                  name="city"
                  type="text"
                  value={formData.city}
                  readOnly
                  className="w-full px-6 py-4 bg-gray-100 border-2 border-transparent rounded-2xl text-gray-400 font-black cursor-not-allowed select-none"
                />
              </div>

              {/* Pincode */}
              <div className="group">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mb-3 ml-1 group-focus-within:text-blue-600 transition-colors">
                  <Database className="h-4 w-4" />
                  Area Pincode
                </label>
                <input
                  name="pincode"
                  type="text"
                  maxLength="6"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl transition-all duration-300 outline-none text-gray-900 font-bold placeholder:text-gray-300 ${
                    errors.pincode 
                    ? 'border-red-100 focus:border-red-500 bg-red-50/30' 
                    : 'border-transparent focus:border-blue-600 focus:bg-white focus:shadow-xl focus:shadow-blue-500/10'
                  }`}
                  placeholder="360001"
                />
                {errors.pincode && <p className="mt-2 text-[11px] text-red-500 font-black uppercase tracking-wider ml-2">{errors.pincode}</p>}
              </div>

              {/* Password */}
              <div className="group">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mb-3 ml-1 group-focus-within:text-blue-600 transition-colors">
                  <Lock className="h-4 w-4" />
                  Secure Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl transition-all duration-300 outline-none text-gray-900 font-bold pr-16 placeholder:text-gray-300 ${
                      errors.password 
                      ? 'border-red-100 focus:border-red-500 bg-red-50/30' 
                      : 'border-transparent focus:border-blue-600 focus:bg-white focus:shadow-xl focus:shadow-blue-500/10'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-blue-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-2 text-[11px] text-red-500 font-black uppercase tracking-wider ml-2">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="group">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mb-3 ml-1 group-focus-within:text-blue-600 transition-colors">
                  <Lock className="h-4 w-4" />
                  Repeat Password
                </label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl transition-all duration-300 outline-none text-gray-900 font-bold pr-16 placeholder:text-gray-300 ${
                      errors.confirmPassword 
                      ? 'border-red-100 focus:border-red-500 bg-red-50/30' 
                      : 'border-transparent focus:border-blue-600 focus:bg-white focus:shadow-xl focus:shadow-blue-500/10'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-blue-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-2 text-[11px] text-red-500 font-black uppercase tracking-wider ml-2">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black py-5 rounded-3xl shadow-2xl shadow-blue-500/30 transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-4 text-xl tracking-tighter disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-4 border-white/30 border-t-white"></div>
                    <span className="animate-pulse">PROCESSING...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-6 w-6 transform group-hover:scale-110 transition-transform" />
                    <span>GET STARTED NOW</span>
                  </>
                )}
              </button>
            </div>
            {/* Login Link */}
            <div className="text-center pt-8 border-t border-gray-100 mt-10">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-700 ml-2 transition-colors"
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
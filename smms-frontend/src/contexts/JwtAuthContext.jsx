import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI, customerAPI } from '../api';

const JwtAuthContext = createContext();

export const useJwtAuth = () => {
  const context = useContext(JwtAuthContext);
  if (!context) throw new Error('useJwtAuth must be used within JwtAuthProvider');
  return context;
};

export const JwtAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData?.userName != null && userData?.role != null) {
          setUser(userData);
          setIsAuthenticated(true);
        } else clearAuth();
      } catch {
        clearAuth();
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const res = await authAPI.login({
        email: credentials.email?.trim(),
        password: credentials.password,
      });
      const data = res.data;
      if (!data?.user?.token) return { success: false, error: data?.message || 'Login failed' };
      const userData = data.user;
      if (credentials.expectedRole && userData.role && userData.role !== credentials.expectedRole) {
        const selected = credentials.expectedRole;
        const actual = userData.role;
        const friendlyMessage = `You tried to login as ${selected}, but this account is ${actual}. Please select the correct role for this user.`;
        return { success: false, error: friendlyMessage };
      }
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const payload = {
        userName: userData.userName?.trim(),
        email: userData.email?.trim(),
        phone: userData.phone?.trim(),
        password: userData.password,
        role: userData.role || 'Customer',
      };
      await userAPI.create(payload);
      const loginRes = await authAPI.login({ email: payload.email, password: payload.password });
      const token = loginRes.data?.user?.token;
      const newUser = loginRes.data?.user;
      if (!token || !newUser) return { success: true };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      if (userData.role === 'Customer') {
        try {
          await customerAPI.create({
            userId: newUser.userId,
            address: userData.address || '',
            city: userData.city || '',
            state: userData.state || '',
            pincode: userData.pincode || '',
          });
        } catch (err) {
          console.error('Error creating customer profile:', err);
          // If customer profile creation fails, we might want to inform the user
          // but they are already registered as a user at this point.
          // For now, we'll just throw the error to be caught by the outer catch block
          throw new Error('User registered but customer profile creation failed: ' + (err.response?.data?.message || err.message));
        }
      }
      setUser(newUser);
      setIsAuthenticated(true);
      return { success: true, user: newUser };
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.join?.(', ') || 'Registration failed';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
  };

  const hasRole = (role) => user?.role === role;
  const isCustomer = () => hasRole('Customer');
  const isStoreOwner = () => hasRole('StoreOwner');
  const isDeliveryStaff = () => hasRole('DeliveryStaff');

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    hasRole,
    isCustomer,
    isStoreOwner,
    isDeliveryStaff,
  };

  return <JwtAuthContext.Provider value={value}>{children}</JwtAuthContext.Provider>;
};

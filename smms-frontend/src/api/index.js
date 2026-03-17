/**
 * SMMS API - All endpoints aligned with backend SMMS (.NET)
 * Base path: /api/[controller]
 */
import api from './client';

// Auth (no token required for login)
export const authAPI = {
  login: (body) => api.post('/Auth/login', body),
};

// User (POST is AllowAnonymous for registration)
export const userAPI = {
  getAll: () => api.get('/User'),
  getById: (id) => api.get(`/User/${id}`),
  create: (data) => api.post('/User', data),
  update: (id, data) => api.put(`/User/${id}`, data),
  delete: (id) => api.delete(`/User/${id}`),
};

// Customer
export const customerAPI = {
  getAll: () => api.get('/Customer'),
  getById: (id) => api.get(`/Customer/${id}`),
  create: (data) => api.post('/Customer', data),
  update: (id, data) => api.put(`/Customer/${id}`, data),
  delete: (id) => api.delete(`/Customer/${id}`),
};

// StoreOwner
export const storeOwnerAPI = {
  getAll: () => api.get('/StoreOwner'),
  getById: (id) => api.get(`/StoreOwner/${id}`),
  create: (data) => api.post('/StoreOwner', data),
  update: (id, data) => api.put(`/StoreOwner/${id}`, data),
  delete: (id) => api.delete(`/StoreOwner/${id}`),
};

// DeliveryStaff
export const deliveryStaffAPI = {
  getAll: () => api.get('/DeliveryStaff'),
  getById: (id) => api.get(`/DeliveryStaff/${id}`),
  getMyProfile: () => api.get('/DeliveryStaff/my'),
  create: (data) => api.post('/DeliveryStaff', data),
  update: (id, data) => api.put(`/DeliveryStaff/${id}`, data),
  updateMyProfile: (data) => api.put('/DeliveryStaff/my', data),
  delete: (id) => api.delete(`/DeliveryStaff/${id}`),
};

// Category, SubCategory, Product
export const categoryAPI = {
  getAll: () => api.get('/Category'),
  getById: (id) => api.get(`/Category/${id}`),
  create: (data) => api.post('/Category', data),
  update: (id, data) => api.put(`/Category/${id}`, data),
  delete: (id) => api.delete(`/Category/${id}`),
};

export const subCategoryAPI = {
  getAll: () => api.get('/SubCategory'),
  getById: (id) => api.get(`/SubCategory/${id}`),
  create: (data) => api.post('/SubCategory', data),
  update: (id, data) => api.put(`/SubCategory/${id}`, data),
  delete: (id) => api.delete(`/SubCategory/${id}`),
};

export const productAPI = {
  getAll: (page = 1, pageSize = 10, searchTerm = '', categoryId = null, sortBy = 'name', sortOrder = 'asc') => {
    let url = `/Product?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    if (searchTerm) url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
    if (categoryId && categoryId !== 'all') url += `&categoryId=${categoryId}`;
    return api.get(url);
  },
  getById: (id) => api.get(`/Product/${id}`),
  create: (data) => api.post('/Product', data),
  update: (id, data) => api.put(`/Product/${id}`, data),
  delete: (id) => api.delete(`/Product/${id}`),
  uploadImage: (productId, file) => {
    const form = new FormData();
    form.append('Image', file);  // Match backend ProductImageUploadRequest.Image
    return api.post(`/Product/${productId}/image`, form);
  },
};

// Zone, StoreProfile
export const zoneAPI = {
  getAll: () => api.get('/Zone'),
  getById: (id) => api.get(`/Zone/${id}`),
  create: (data) => api.post('/Zone', data),
  update: (id, data) => api.put(`/Zone/${id}`, data),
  delete: (id) => api.delete(`/Zone/${id}`),
};

export const storeProfileAPI = {
  getAll: () => api.get('/StoreProfile'),
  getById: (id) => api.get(`/StoreProfile/${id}`),
  create: (data) => api.post('/StoreProfile', data),
  update: (id, data) => api.put(`/StoreProfile/${id}`, data),
  delete: (id) => api.delete(`/StoreProfile/${id}`),
};

// Cart, CartItem
export const cartAPI = {
  getAll: () => api.get('/Cart'),
  getById: (id) => api.get(`/Cart/${id}`),
  getMyCart: () => api.get('/Cart/my'),
  create: (data) => api.post('/Cart', data),
  update: (id, data) => api.put(`/Cart/${id}`, data),
  delete: (id) => api.delete(`/Cart/${id}`),
};

export const cartItemAPI = {
  getAll: () => api.get('/CartItem'),
  getById: (id) => api.get(`/CartItem/${id}`),
  create: (data) => api.post('/CartItem', data),
  update: (id, data) => api.put(`/CartItem/${id}`, data),
  delete: (id) => api.delete(`/CartItem/${id}`),
};

// Order, OrderItem, Payment, Feedback
export const orderAPI = {
  getAll: () => api.get('/Order'),
  getById: (id) => api.get(`/Order/${id}`),
  create: (data) => api.post('/Order', data),
  update: (id, data) => api.put(`/Order/${id}`, data),
  delete: (id) => api.delete(`/Order/${id}`),
};

export const orderItemAPI = {
  getAll: () => api.get('/OrderItem'),
  getById: (id) => api.get(`/OrderItem/${id}`),
  create: (data) => api.post('/OrderItem', data),
  update: (id, data) => api.put(`/OrderItem/${id}`, data),
  delete: (id) => api.delete(`/OrderItem/${id}`),
};

export const paymentAPI = {
  getAll: () => api.get('/Payment'),
  getById: (id) => api.get(`/Payment/${id}`),
  create: (data) => api.post('/Payment', data),
  update: (id, data) => api.put(`/Payment/${id}`, data),
  delete: (id) => api.delete(`/Payment/${id}`),
};

export const feedbackAPI = {
  getAll: () => api.get('/Feedback'),
  getById: (id) => api.get(`/Feedback/${id}`),
  create: (data) => api.post('/Feedback', data),
  update: (id, data) => api.put(`/Feedback/${id}`, data),
  delete: (id) => api.delete(`/Feedback/${id}`),
};

// OrderTrackingHistory, DeliveryStaffAssignment
export const orderTrackingAPI = {
  getAll: () => api.get('/OrderTrackingHistory'),
  getById: (id) => api.get(`/OrderTrackingHistory/${id}`),
  create: (data) => api.post('/OrderTrackingHistory', data),
  update: (id, data) => api.put(`/OrderTrackingHistory/${id}`, data),
  delete: (id) => api.delete(`/OrderTrackingHistory/${id}`),
};

export const deliveryAssignmentAPI = {
  getAll: () => api.get('/DeliveryStaffAssignment'),
  getById: (id) => api.get(`/DeliveryStaffAssignment/${id}`),
  getMyAssignments: () => api.get('/DeliveryStaffAssignment/my'),
  create: (data) => api.post('/DeliveryStaffAssignment', data),
  update: (id, data) => api.put(`/DeliveryStaffAssignment/${id}`, data),
  delete: (id) => api.delete(`/DeliveryStaffAssignment/${id}`),
};

export default api;

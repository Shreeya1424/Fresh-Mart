/**
 * SMMS Frontend - Application constants
 * Backend: SMMS .NET API (default http://localhost:5200)
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fresh-mart-105h.onrender.com/api';

export const ROLES = {
  STORE_OWNER: 'StoreOwner',
  CUSTOMER: 'Customer',
  DELIVERY_STAFF: 'DeliveryStaff',
};

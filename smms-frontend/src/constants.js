/**
 * SMMS Frontend - Application constants
 * Backend: SMMS .NET API (default http://localhost:5200)
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5200/api';

export const ROLES = {
  STORE_OWNER: 'StoreOwner',
  CUSTOMER: 'Customer',
  DELIVERY_STAFF: 'DeliveryStaff',
};

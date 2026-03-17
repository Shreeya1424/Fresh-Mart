# SMMS Frontend – Project Structure

## Overview
React + Vite frontend for **SMMS (Store Management System)** with role-based access: **StoreOwner (Admin)**, **Customer**, and **Delivery Staff**. Backend: SMMS .NET API.

---

## Folder Structure

```
smms-frontend/
├── public/
├── src/
│   ├── api/                    # Backend API layer
│   │   ├── client.js           # Axios instance + JWT interceptor
│   │   └── index.js            # All API endpoints (Auth, User, Product, Order, etc.)
│   ├── components/             # Reusable UI
│   │   ├── Layout.jsx          # Sidebar + header layout (uses AuthContext)
│   │   ├── LoadingSpinner.jsx
│   │   └── ProtectedRoute.jsx  # Role-based route guard
│   ├── contexts/
│   │   └── JwtAuthContext.jsx  # Auth state, login, register, logout
│   ├── pages/
│   │   ├── auth/
│   │   │   └── Login.jsx        # Login + role-based redirect
│   │   ├── admin/              # StoreOwner (Admin) – full CRUD
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminProducts.jsx
│   │   │   ├── AdminCategories.jsx
│   │   │   ├── AdminOrders.jsx
│   │   │   ├── AdminUsers.jsx
│   │   │   ├── AdminCustomers.jsx
│   │   │   ├── AdminStoreOwners.jsx
│   │   │   ├── AdminDeliveryStaff.jsx
│   │   │   ├── AdminZones.jsx
│   │   │   └── AdminSettings.jsx
│   │   ├── store-owner/        # Store owner views (same as admin)
│   │   │   ├── StoreOwnerDashboard.jsx
│   │   │   ├── StoreOwnerOrders.jsx
│   │   │   ├── StoreOwnerCustomers.jsx
│   │   │   ├── StoreOwnerDeliveryStaff.jsx
│   │   │   └── StoreOwnerProfile.jsx
│   │   ├── customer/           # Customer – browse, cart, orders
│   │   │   ├── CustomerDashboard.jsx
│   │   │   ├── CustomerProducts.jsx
│   │   │   ├── CustomerCart.jsx
│   │   │   ├── CustomerOrders.jsx
│   │   │   └── CustomerWishlist.jsx
│   │   ├── delivery-staff/     # Delivery staff – assignments, orders
│   │   │   └── DeliveryStaffDashboard.jsx
│   │   ├── Register.jsx
│   │   ├── Unauthorized.jsx
│   │   └── NotFound.jsx
│   ├── utils/
│   │   └── index.js            # Re-exports (e.g. constants)
│   ├── constants.js            # API_BASE_URL, ROLES
│   ├── App.jsx                 # Routes + ProtectedRoute by role
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── PROJECT_STRUCTURE.md        # This file
```

---

## Roles & Permissions

| Role           | Route prefix        | Main features |
|----------------|--------------------|----------------|
| **StoreOwner** | `/admin/*`, `/store-owner/*` | Users, Products, Categories, SubCategories, Zones, Orders, Customers, Delivery Staff, Store Profile, Payments, Feedback, Assignments |
| **Customer**   | `/customer/*`      | Dashboard, Products, Cart, Orders, Wishlist, Feedback |
| **DeliveryStaff** | `/delivery-staff/*` | Dashboard, Assignments, Order tracking |

---

## API Layer

- **Base URL:** `http://localhost:5200/api` (or `VITE_API_URL`).
- **Auth:** `POST /Auth/login` (email, password). No `/Auth/register`; registration uses `POST /User` (AllowAnonymous).
- **JWT:** Stored in `localStorage`; sent as `Authorization: Bearer <token>`.
- All other endpoints use the same axios client in `src/api/client.js` (token attached automatically).

---

## How to Run

1. **Backend:** Run SMMS .NET API (e.g. port 5200).
2. **Frontend:**  
   `npm install`  
   `npm run dev`  
   Default: http://localhost:3000
3. **Login:** Use backend user credentials; after login, redirect is by role (StoreOwner → admin dashboard, Customer → customer dashboard, DeliveryStaff → delivery dashboard).

---

## Cleanup Done

- Removed backup/duplicate App files (`App-*.jsx`).
- Removed test/debug utils and test-only components.
- Single API layer in `src/api` (replaced `services/api.js` and `services/jwtApi.js`).
- Single auth context: `JwtAuthContext` (removed `AuthContext`).
- Single Login: `src/pages/auth/Login.jsx`.

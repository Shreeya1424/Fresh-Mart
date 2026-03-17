# SMMS Frontend

A modern React frontend for the Store Management System (SMMS) with role-based authentication and beautiful UI.

## Features

- **Role-based Authentication**: Separate dashboards for Customer, Store Owner, and Delivery Staff
- **Modern UI**: Built with React, Tailwind CSS, and Lucide React icons
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Notifications**: Toast notifications for user feedback
- **Protected Routes**: Role-based access control
- **API Integration**: Full integration with SMMS backend

## Tech Stack

- **React 19** - Frontend framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Hot Toast** - Toast notifications
- **Lucide React** - Beautiful icons

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- SMMS Backend running on http://localhost:5131

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to `http://localhost:5174` (or the port shown in terminal)

### Backend Configuration

Make sure your SMMS backend is running on `http://localhost:5131` with CORS enabled for:
- `http://localhost:5173`
- `http://localhost:5174`

## User Roles & Features

### Customer
- **Dashboard**: View order statistics and featured products
- **Products**: Browse and search products, add to cart
- **Cart**: Manage shopping cart items
- **Orders**: View order history and track deliveries
- **Wishlist**: Save favorite products

### Store Owner
- **Dashboard**: View business analytics and metrics
- **Products**: Manage product inventory, add/edit/delete products
- **Orders**: Process customer orders and update status
- **Customers**: View customer information and order history
- **Store Profile**: Manage store information and settings

### Delivery Staff
- **Dashboard**: View delivery statistics and performance
- **Active Deliveries**: Manage current delivery assignments
- **Delivery History**: View completed deliveries
- **Route Planning**: Optimize delivery routes
- **Profile**: Update vehicle and contact information

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.jsx      # Main layout with navigation
│   ├── LoadingSpinner.jsx
│   └── ProtectedRoute.jsx
├── contexts/           # React contexts
│   └── AuthContext.jsx # Authentication state management
├── pages/              # Page components
│   ├── customer/       # Customer-specific pages
│   ├── store-owner/    # Store owner pages
│   ├── delivery-staff/ # Delivery staff pages
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Unauthorized.jsx
│   └── NotFound.jsx
├── services/           # API services
│   └── api.js         # Axios configuration and API calls
├── App.jsx            # Main app component with routing
├── main.jsx           # App entry point
└── index.css          # Global styles with Tailwind
```

## API Integration

The frontend integrates with the SMMS backend through RESTful APIs:

- **Authentication**: Login, register, logout, current user
- **Products**: CRUD operations for products
- **Orders**: Order management and tracking
- **Cart**: Shopping cart functionality
- **Users**: Customer, store owner, and delivery staff management

## Authentication Flow

1. User selects role on login page (Customer, Store Owner, Delivery Staff)
2. Credentials are validated against backend
3. User role is verified to match selected role
4. JWT token is stored in cookies (HttpOnly)
5. User is redirected to role-specific dashboard
6. Protected routes check authentication and role permissions

## Styling

The app uses Tailwind CSS with custom components:

- **Color Scheme**: Primary blue, secondary gray
- **Typography**: Inter font family
- **Components**: Custom button, input, and card styles
- **Responsive**: Mobile-first responsive design

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- Use functional components with hooks
- Follow React best practices
- Use Tailwind utility classes
- Implement proper error handling
- Add loading states for better UX

## Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your hosting service

3. **Update API URL** in `src/services/api.js` for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the SMMS system and follows the same licensing terms.
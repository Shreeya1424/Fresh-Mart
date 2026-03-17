import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import {
  ShoppingBag,
  Heart,
  ShoppingCart,
  Package,
  TrendingUp,
  User,
  Gift,
  Zap,
  Clock
} from 'lucide-react';
import { productAPI, cartAPI, cartItemAPI, categoryAPI } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useJwtAuth } from '../../contexts/JwtAuthContext';

const CustomerDashboard = () => {
  useJwtAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [categories, setCategories] = useState([]);

  const navigation = [
    { name: 'Dashboard', href: '/customer/dashboard', icon: ShoppingBag, current: true },
    { name: 'Products', href: '/customer/products', icon: Package, current: false },
    { name: 'Cart', href: '/customer/cart', icon: ShoppingCart, current: false },
    { name: 'Orders', href: '/customer/orders', icon: Clock, current: false },
    { name: 'Wishlist', href: '/customer/wishlist', icon: Heart, current: false },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [productsResponse, categoriesResponse] = await Promise.all([
        productAPI.getAll(),
        categoryAPI.getAll()
      ]);

      const productsList = Array.isArray(productsResponse?.data)
        ? productsResponse.data
        : productsResponse?.data?.data ?? [];
      
      setProducts(productsList);

      const categoriesList = Array.isArray(categoriesResponse?.data)
        ? categoriesResponse.data
        : categoriesResponse?.data?.data ?? [];
      setCategories(categoriesList);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };


  const addToCart = async (productId) => {
    try {
      setAddingToCart(true);
      const cartRes = await cartAPI.getMyCart();
      const cartId = cartRes.data?.data?.cartId;

      if (!cartId) {
        toast.error('Unable to find your cart. Please try again.');
        return;
      }

      await cartItemAPI.create({
        cartId,
        productId,
        quantity: 1
      });

      toast.success('Product added to cart!');
    } catch (error) {
      console.error('Error adding to cart from dashboard:', error);
      const message = error.response?.data?.message || 'Failed to add product to cart';
      toast.error(message);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." fullScreen />;
  }

  const getProductImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    return `http://localhost:5200${imageUrl}`;
  };

  const getCategoryImageUrl = (category) => {
    if (!category) return null;
    const name = (category.name || '').toLowerCase().trim();
    // Debugging to see category names in console
    console.log(`Mapping category: "${category.name}"`);

    // 1. PRIORITIZE KEYWORD MAPPING (Blinkit Style - Product Bundles)
    
    // Paan Corner (Specific Paan image)
    if (name.includes('paan') || name.includes('betel') || name.includes('mouth') || name.includes('freshener') || name.includes('hookah')) {
      return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRQ0Hg9kH4xVZk49QQF4wlnipBXaTTRa76XQ&s';
    }

    // Atta, Rice, Dal, Grains (Specific Grain bundle)
    if (name.includes('atta') || name.includes('rice') || name.includes('dal') || name.includes('grain') || name.includes('flour') || name.includes('pulses')) {
      return 'https://www.shutterstock.com/image-photo/beanspulseslentilsrice-wheat-grains-bowl-260nw-746324917.jpg';
    }

    // Bakery & Biscuits
    if (name.includes('bakery') || name.includes('biscuit') || name.includes('cookie') || name.includes('bread') || name.includes('pav') || name.includes('toast') || name.includes('rusk')) {
      return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIhoLhnFxC8cuSJb7t0f403seGF1gMqo3qzA&s';
    }

    // Dairy & Eggs (Specific Dairy bundle)
    if (name.includes('dairy') || name.includes('paneer') || name.includes('curd') || name.includes('yogurt') || name.includes('cheese') || name.includes('butter') || name.includes('egg')) {
      return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTizZfhmMYOMJ0cnTIT32HmEiRsdOIFCnC7ag&s';
    }

    // Munchies & Snacks (Specific Snack bundle)
    if (name.includes('munchies') || name.includes('snack') || name.includes('chips') || name.includes('namkeen') || name.includes('biscuit') || name.includes('cookie') || name.includes('candy')) {
      return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMHu9xJU-Ur7U_KB3z0VeGedZylBBU5MuCjA&s';
    }

    // Tea, Coffee & Health Drinks (Specific Beverage bundle)
    if (name.includes('tea') || name.includes('coffee') || name.includes('health drink') || name.includes('bournvita') || name.includes('horlicks') || name.includes('beverages') || name.includes('milk')) {
      return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgodnTmFfFE-se-JOXrTOWpI0V_p3k2vLUbQ&s';
    }

    // Dry Fruits & Nuts (Specific Nut bundle)
    if (name.includes('dry fruit') || name.includes('nut') || name.includes('cashew') || name.includes('almond') || name.includes('walnut') || name.includes('pistachio')) {
      return 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?q=80&w=400&h=400&fit=crop';
    }

    // Fruits & Vegetables (Fresh produce)
    if (name.includes('fruit') || name.includes('vegetable') || name.includes('sabzi') || name.includes('veg') || name.includes('fresh')) {
      return 'https://www.lalpathlabs.com/blog/wp-content/uploads/2019/01/Fruits-and-Vegetables.jpg';
    }

    // Cold Drinks & Juices
    if (name.includes('cold drink') || name.includes('juice') || name.includes('soft drink') || name.includes('pepsi') || name.includes('coke') || name.includes('colddrink') || name.includes('water') || name.includes('soda')) {
      return 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?q=80&w=400&h=400&fit=crop';
    }

    // Sweet Tooth
    if (name.includes('sweet tooth') || name.includes('mithai') || name.includes('dessert') || name.includes('sweet') || name.includes('chocolate')) {
      return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2JFS3ph7cgYCEC5jUQiVlyMC38mBG6D2mmg&s';
    }

    // Instant & Frozen Food
    if (name.includes('instant') || name.includes('maggi') || name.includes('noodle') || name.includes('frozen') || name.includes('ice cream') || name.includes('peas') || name.includes('nugget') || name.includes('pasta')) {
      return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=400&h=400&fit=crop';
    }

    // Personal Care
    if (name.includes('personal') || name.includes('shampoo') || name.includes('soap') || name.includes('skin') || name.includes('beauty') || name.includes('face') || name.includes('hair') || name.includes('body') || name.includes('grooming') || name.includes('sanitary')) {
      return 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=400&h=400&fit=crop';
    }

    // Cleaning Essentials
    if (name.includes('cleaning') || name.includes('essential') || name.includes('detergent') || name.includes('house') || name.includes('wash') || name.includes('floor') || name.includes('toilet') || name.includes('dish') || name.includes('liquid')) {
      return 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&h=400&fit=crop';
    }

    // Baby Care
    if (name.includes('baby') || name.includes('diaper') || name.includes('care') || name.includes('infant') || name.includes('kid')) {
      return 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=400&h=400&fit=crop';
    }

    // Pharma & Wellness
    if (name.includes('pharma') || name.includes('wellness') || name.includes('medicine') || name.includes('health') || name.includes('medical')) {
      return 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=400&h=400&fit=crop';
    }

    // Kitchen & Dining
    if (name.includes('kitchen') || name.includes('dining') || name.includes('crockery') || name.includes('cookware') || name.includes('serveware') || name.includes('bottle') || name.includes('lunch box')) {
      return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1sFXdRRc5RksMk6aa_gi1Bb_V6Xl2pXNHgQ&s';
    }

    // Home & Office
    if (name.includes('home') || name.includes('office') || name.includes('furnishing') || name.includes('stationery') || name.includes('decor')) {
      return 'https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=400&h=400&fit=crop';
    }

    // Electronics
    if (name.includes('electronics') || name.includes('gadget') || name.includes('phone') || name.includes('battery') || name.includes('accessory') || name.includes('cable') || name.includes('charger')) {
      return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=400&h=400&fit=crop';
    }

    // Sauces & Spreads
    if (name.includes('sauce') || name.includes('spread') || name.includes('jam') || name.includes('honey') || name.includes('dip') || name.includes('ketchup') || name.includes('mayo')) {
      return 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?q=80&w=400&h=400&fit=crop';
    }

    // Organic & Premium
    if (name.includes('organic') || name.includes('premium') || name.includes('healthy') || name.includes('diet') || name.includes('natural')) {
      return 'https://images.unsplash.com/photo-1506484381205-f7945653044d?q=80&w=400&h=400&fit=crop';
    }

    // 2. FALLBACK TO DATABASE ICON IF NO KEYWORD MATCH
    const iconName = category.iconName || category.IconName;
    if (iconName && iconName !== 'string' && iconName !== 'default.png') {
      if (iconName.startsWith('http://') || iconName.startsWith('https://')) return iconName;
      if (iconName.startsWith('/')) return `http://localhost:5200${iconName}`;
    }
    
    // 3. FINAL DEFAULT FALLBACK (High quality grocery bundle)
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&h=400&fit=crop'; 
  };

  const getCategoryTileImageUrl = (category) => {
    // ALWAYS use the keyword-based mapping for consistency on the dashboard.
    return getCategoryImageUrl(category);
  };
  
  const getCategoryFallbackImage = (category) => {
    return getCategoryImageUrl(category) || 'https://via.placeholder.com/112x112.png?text=Category';
  };

  return (
    <Layout navigation={navigation} title="Customer Dashboard">
      <div className="space-y-8 fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-[2.2fr,1.2fr] gap-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-500 via-lime-500 to-emerald-500 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-white/80 mb-2">
                  Delivery in minutes
                </p>
                <h2 className="text-3xl md:text-4xl font-extrabold mb-3 leading-tight">
                  Stock up on daily essentials
                </h2>
                <p className="text-sm md:text-base text-white/90 max-w-xl">
                  Get fresh groceries, snacks, and household items delivered from Fresh Mart with your favourite local products.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Link
                  to="/customer/products"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-emerald-700 font-semibold shadow-md hover:bg-emerald-50 transition-colors"
                >
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Shop Now
                </Link>
                <div className="flex items-center gap-2 bg-black/15 rounded-full px-4 py-2 text-sm">
                  <Zap className="h-4 w-4 text-yellow-300" />
                  <span>Fast delivery across your city</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-rows-3 gap-4">
            <div className="rounded-3xl bg-gradient-to-r from-cyan-500 to-sky-500 p-4 text-white shadow-md flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-semibold tracking-wide text-white/80">
                  Pharmacy at your doorstep
                </p>
                <p className="text-sm font-medium">Health essentials and OTC medicines</p>
                <Link to="/customer/products" className="mt-2 inline-flex items-center text-xs font-semibold underline underline-offset-4">
                  Order Now
                </Link>
              </div>
              <Gift className="h-10 w-10 text-white/90" />
            </div>
            <div className="rounded-3xl bg-gradient-to-r from-orange-400 to-amber-500 p-4 text-white shadow-md flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-semibold tracking-wide text-white/80">
                  Snacks and drinks
                </p>
                <p className="text-sm font-medium">Cold drinks, chips, and more</p>
                <Link to="/customer/products" className="mt-2 inline-flex items-center text-xs font-semibold underline underline-offset-4">
                  View Offers
                </Link>
              </div>
              <TrendingUp className="h-10 w-10 text-white/90" />
            </div>
            <div className="rounded-3xl bg-gradient-to-r from-purple-500 to-fuchsia-500 p-4 text-white shadow-md flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-semibold tracking-wide text-white/80">
                  Baby and home care
                </p>
                <p className="text-sm font-medium">Diapers, cleaning and personal care</p>
                <Link to="/customer/products" className="mt-2 inline-flex items-center text-xs font-semibold underline underline-offset-4">
                  Explore
                </Link>
              </div>
              <User className="h-10 w-10 text-white/90" />
            </div>
          </div>
        </div>

        {/* Shop by Category Section */}
        <div className="card-gradient rounded-3xl p-8 shadow-soft border border-gray-200/50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Shop by Category</h3>
              <p className="text-gray-600">Browse all your favourite sections in one place</p>
            </div>
            <Link to="/customer/products" className="text-emerald-700 font-semibold hover:underline">
              View All
            </Link>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {categories.length > 0 ? (
              categories.map((category) => (
                <Link
                  key={category.categoryId}
                  to={`/customer/products?category=${category.categoryId}`}
                  className="group flex flex-col items-center flex-shrink-0"
                >
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:scale-105 group-hover:border-emerald-200 transition-all duration-300 overflow-hidden">
                    <img
                      src={getCategoryTileImageUrl(category)}
                      alt={category.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&h=400&fit=crop';
                        }}
                    />
                  </div>
                  <p className="text-sm font-bold text-gray-900 text-center group-hover:text-emerald-700 transition-colors w-24 truncate">
                    {category.name}
                  </p>
                </Link>
              ))
            ) : (
              <div className="flex gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="w-24 flex flex-col items-center flex-shrink-0 animate-pulse">
                    <div className="w-24 h-24 rounded-3xl bg-gray-100 mb-4"></div>
                    <div className="h-4 w-16 bg-gray-100 rounded"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions - Simplified */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              href: "/customer/products",
              icon: Package,
              title: "Browse Products",
              description: "Discover new items",
              color: "blue"
            },
            {
              href: "/customer/cart",
              icon: ShoppingCart,
              title: "View Cart",
              description: "Check your items",
              color: "green"
            },
            {
              href: "/customer/wishlist",
              icon: Heart,
              title: "My Wishlist",
              description: "Saved favorites",
              color: "red"
            }
          ].map((action, index) => {
            const IconComponent = action.icon;
            const colorClasses = {
              blue: 'from-blue-500 to-blue-600 bg-blue-50',
              green: 'from-green-500 to-green-600 bg-green-50',
              red: 'from-red-500 to-red-600 bg-red-50'
            };
            return (
              <Link
                key={action.title}
                to={action.href}
                className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 block"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative z-10 flex items-center gap-4">
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${colorClasses[action.color]} group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{action.title}</h4>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </Layout>
  );
};

export default CustomerDashboard;

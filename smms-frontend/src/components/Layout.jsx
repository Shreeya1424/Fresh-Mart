import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useJwtAuth } from '../contexts/JwtAuthContext';
import { Menu, X, LogOut, User, Bell, Settings, ChevronDown, Search, ShoppingBag, MapPin, Navigation, XCircle, Heart, ShoppingCart, Trash2, Check } from 'lucide-react';
import { zoneAPI } from '../api';

const Layout = ({ children, navigation, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [zones, setZones] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [locationError, setLocationError] = useState('');
  const [currentLocationLabel, setCurrentLocationLabel] = useState('');
  const [savedLocations, setSavedLocations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const navigate = useNavigate();
  const { user, logout } = useJwtAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Customer': return 'from-blue-500 to-blue-600';
      case 'StoreOwner': return 'from-green-500 to-green-600';
      case 'DeliveryStaff': return 'from-orange-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Customer': return 'bg-blue-100 text-blue-800';
      case 'StoreOwner': return 'bg-green-100 text-green-800';
      case 'DeliveryStaff': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLocationStorageKey = () => {
    return user?.userId ? `customerLocations_${user.userId}` : 'customerLocations';
  };

  const loadZones = async () => {
    try {
      setLocationLoading(true);
      const response = await zoneAPI.getAll();
      const list = Array.isArray(response?.data) ? response.data : response?.data?.data ?? [];
      setZones(list);
    } catch (error) {
      console.error('Error loading zones for location selector', error);
      setZones([]);
    } finally {
      setLocationLoading(false);
    }
  };

  const loadStoredLocation = () => {
    try {
      const stored = localStorage.getItem(getLocationStorageKey());
      if (!stored) {
        setSavedLocations([]);
        setCurrentLocation(null);
        setCurrentLocationLabel('Set location');
        return false;
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSavedLocations(parsed);
        const activeLocation = parsed.find(loc => loc.isActive) || parsed[0];
        setCurrentLocation(activeLocation);
        const labelParts = [];
        const displayName = normalizeAreaName(activeLocation.areaName);
        labelParts.push(displayName || activeLocation.zoneName);
        if (activeLocation.pincodeNumber) {
          labelParts.push(activeLocation.pincodeNumber);
        }
        setCurrentLocationLabel(labelParts.join(' • '));
        return true;
      }
      setSavedLocations([]);
      setCurrentLocation(null);
      setCurrentLocationLabel('Set location');
      return false;
    } catch (error) {
      console.error('Error reading stored location', error);
      return false;
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'Customer') return;
    const hasLocation = loadStoredLocation();
    if (!hasLocation) {
      loadZones();
      setLocationModalOpen(true);
    }
  }, [user]);

  const handleOpenLocationModal = async () => {
    if (zones.length === 0) {
      await loadZones();
    }
    setLocationModalOpen(true);
  };

  const saveAndSetActiveLocation = (locations) => {
    localStorage.setItem(getLocationStorageKey(), JSON.stringify(locations));
    loadStoredLocation();
  }

  const handleSelectLocation = (locationId) => {
    const updatedLocations = savedLocations.map(loc => ({ 
      ...loc, 
      isActive: loc.id === locationId 
    }));
    saveAndSetActiveLocation(updatedLocations);
  };

  const handleDeleteLocation = (locationId) => {
    let updatedLocations = savedLocations.filter(loc => loc.id !== locationId);
    if (updatedLocations.length > 0 && !updatedLocations.some(loc => loc.isActive)) {
      updatedLocations[0].isActive = true;
    }
    saveAndSetActiveLocation(updatedLocations);
  };

  const handleSaveLocation = async () => {
    setLocationError('');
    if (!newZoneName || !newAreaName || !newPincode) {
      setLocationError('All fields are required.');
      return;
    }

    const newLocation = {
      id: Date.now(),
      zoneName: newZoneName,
      areaName: newAreaName,
      pincodeNumber: newPincode,
      city: 'Rajkot',
      isActive: true
    };

    const updatedLocations = savedLocations.map(loc => ({ ...loc, isActive: false }));
    updatedLocations.push(newLocation);
    saveAndSetActiveLocation(updatedLocations);

    setNewZoneName('');
    setNewAreaName('');
    setNewPincode('');
  };

  const normalizeAreaName = (value) => {
    if (!value) return '';
    const firstPart = value.split(',')[0].trim();
    if (!firstPart) return '';
    return firstPart.split(' ').filter(Boolean).map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1)).join(' ');
  };

  const handleViewProfile = () => {
    if (!user) return;
    const role = user.role;
    switch (role) {
      case 'StoreOwner': navigate('/store-owner/profile'); break;
      case 'Customer': navigate('/customer/dashboard'); break;
      case 'DeliveryStaff': navigate('/delivery-staff/dashboard'); break;
      case 'Admin': navigate('/admin/dashboard'); break;
      default: navigate('/login'); break;
    }
    setProfileDropdownOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center"><ShoppingBag className="h-5 w-5 text-white" /></div>
            <div>
              <h1 className="text-lg font-bold text-white">SMMS</h1>
              <p className="text-xs text-blue-100">Store Management</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-md text-white text-opacity-80 hover:text-white hover:bg-white hover:bg-opacity-10"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`h-10 w-10 bg-gradient-to-br ${getRoleColor(user?.role)} rounded-lg flex items-center justify-center shadow-md`}><User className="h-5 w-5 text-white" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.userName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getRoleBadgeColor(user?.role)}`}>{user?.role}</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link key={item.name} to={item.href} className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${item.current ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}>
                <IconComponent className={`mr-3 h-5 w-5 ${item.current ? 'text-white' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <button onClick={handleLogout} className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors duration-200">
            <LogOut className="mr-3 h-5 w-5" />
            Sign out
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white shadow-sm border-b border-gray-200 z-10">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"><Menu className="h-5 w-5" /></button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-500">Welcome back, {user?.userName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400" /></div>
                <input type="text" placeholder="Search..." className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50" />
              </div>
              {user?.role === 'Customer' && (
                <button onClick={handleOpenLocationModal} className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span className="max-w-[160px] truncate">{currentLocationLabel || 'Set location'}</span>
                </button>
              )}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center"><span className="text-xs text-white font-medium">3</span></span>
              </button>
              {user?.role === 'Customer' && (
                <>
                  <Link to="/customer/wishlist" className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><Heart className="h-5 w-5" /></Link>
                  <Link to="/customer/cart" className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><ShoppingCart className="h-5 w-5" /></Link>
                </>
              )}
              <div className="relative">
                <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="flex items-center space-x-3 p-2 text-sm rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className={`h-8 w-8 bg-gradient-to-br ${getRoleColor(user?.role)} rounded-lg flex items-center justify-center shadow-md`}><User className="h-4 w-4 text-white" /></div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.userName}</p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user?.userName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getRoleBadgeColor(user?.role)}`}>{user?.role}</span>
                    </div>
                    <button onClick={handleViewProfile} className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><User className="mr-3 h-4 w-4" />View Profile</button>
                    <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Settings className="mr-3 h-4 w-4" />Settings</a>
                    <div className="border-t border-gray-200 mt-1 pt-1">
                      <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="mr-3 h-4 w-4" />Sign out</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6"><div className="max-w-7xl mx-auto">{children}</div></main>
        {user?.role === 'Customer' && locationModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><MapPin className="h-5 w-5 text-emerald-600" />Choose your delivery location</h2>
                  <p className="text-xs text-gray-500">Service city is fixed to Rajkot, Gujarat, India.</p>
                </div>
                <button onClick={() => setLocationModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100"><XCircle className="h-5 w-5 text-gray-400" /></button>
              </div>
              <div className="space-y-4">
                {savedLocations.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-800">Saved Locations</h3>
                    <div className="max-h-32 overflow-y-auto space-y-2 rounded-lg bg-gray-50 p-2 border">
                      {savedLocations.map((loc) => (
                        <div key={loc.id} className={`flex items-center justify-between p-2 rounded-md ${loc.isActive ? 'bg-emerald-100 border border-emerald-200' : 'bg-white'}`}>
                          <div className="text-sm">
                            <p className="font-semibold">{loc.zoneName}</p>
                            <p className="text-xs text-gray-600">{loc.pincodeNumber}, {loc.city}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleSelectLocation(loc.id)} className={`p-1 rounded-full ${loc.isActive ? 'bg-green-500 text-white' : 'text-gray-400 hover:bg-gray-200'}`}>
                              <Check className="h-3 w-3" />
                            </button>
                            <button onClick={() => handleDeleteLocation(loc.id)} className="p-1 text-red-600 hover:bg-red-100 rounded-full"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-medium text-gray-800">Add New Location</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Zone</label>
                      <select 
                        value={newZoneName} 
                        onChange={(e) => setNewZoneName(e.target.value)} 
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                      >
                        <option value="">Select a Zone</option>
                        {zones.length > 0 ? (
                          zones.map((zone) => (
                            <option key={zone.zoneId || zone.id} value={zone.name || zone.zoneName}>
                              {zone.name || zone.zoneName}
                            </option>
                          ))
                        ) : (
                          <option disabled>Loading zones...</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Area / Society name</label>
                      <input type="text" value={newAreaName} onChange={(e) => setNewAreaName(e.target.value)} placeholder="e.g. Shri Ram Park" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Pincode</label>
                      <input type="text" value={newPincode} onChange={(e) => setNewPincode(e.target.value)} placeholder="6-digit" maxLength={6} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                      <input type="text" value="Rajkot" disabled className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-100 cursor-not-allowed" />
                    </div>
                  </div>
                  {locationError && (<p className="text-xs text-red-600">{locationError}</p>)}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setLocationModalOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">Close</button>
                <button type="button" onClick={() => handleSaveLocation()} disabled={locationLoading} className="px-4 py-2 text-sm rounded-lg btn-primary">{locationLoading ? 'Saving...' : 'Save Location'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;

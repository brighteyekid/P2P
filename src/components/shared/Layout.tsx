import { useState, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  FiHome, FiUser, FiBook, FiUsers, FiMessageSquare, 
  FiLogOut, FiMenu, FiX, FiActivity
} from 'react-icons/fi';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { userData, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/profile', label: 'Profile', icon: FiUser },
    { path: '/skills', label: 'Skills', icon: FiBook },
    { path: '/skill-exchanges', label: 'Exchanges', icon: FiActivity },
    { path: '/connections', label: 'Connections', icon: FiUsers },
    { path: '/chats', label: 'Chats', icon: FiMessageSquare },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-950 flex">
      {/* Desktop Sidebar */}
      <motion.div 
        className="hidden md:flex flex-col w-64 bg-zinc-900/50 backdrop-blur-xl border-r border-zinc-800/50"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Logo */}
        <div className="p-6">
          <h1 className="text-xl font-bold text-white">Skill Barter</h1>
          <p className="text-zinc-400 text-sm">Peer-to-peer education</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <motion.li key={item.path}>
                  <Link 
                    to={item.path} 
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors relative ${
                      isActive 
                        ? 'bg-primary-500/20 text-white font-medium shadow-inner' 
                        : 'text-gray-300 hover:bg-zinc-800/70 hover:text-white'
                    }`}
                  >
                    <Icon className={`mr-3 ${isActive ? 'text-cyan-400' : ''}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        className="absolute left-0 w-2 h-8 bg-gradient-to-r from-cyan-400 to-primary-500 rounded-r shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                        layoutId="activeNavIndicator"
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      />
                    )}
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-zinc-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center overflow-hidden">
              {userData?.photoURL ? (
                <img
                  src={userData.photoURL}
                  alt={userData.displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-primary-500">
                  {userData?.displayName?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userData?.displayName || 'User'}
              </p>
              <p className="text-xs text-zinc-400 truncate">
                {userData?.email || ''}
              </p>
            </div>
            <motion.button
              onClick={handleLogout}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/50"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Logout"
            >
              <FiLogOut />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <motion.button
          onClick={toggleMobileMenu}
          className="p-2 rounded-lg bg-zinc-800 text-white"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </motion.button>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleMobileMenu}
          >
            <motion.div
              className="absolute top-0 left-0 w-64 h-full bg-zinc-900 py-4"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Logo */}
              <div className="px-6 py-4">
                <h1 className="text-xl font-bold text-white">Skill Barter</h1>
                <p className="text-zinc-400 text-sm">Peer-to-peer education</p>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-4">
                <ul className="space-y-2">
                  {navigationItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    
                    return (
                      <motion.li key={item.path}>
                        <Link 
                          to={item.path} 
                          className={`flex items-center px-4 py-3 rounded-lg transition-colors relative ${
                            isActive 
                              ? 'bg-primary-500/20 text-white font-medium shadow-inner' 
                              : 'text-gray-300 hover:bg-zinc-800/70 hover:text-white'
                          }`}
                          onClick={toggleMobileMenu}
                        >
                          <Icon className={`mr-3 ${isActive ? 'text-cyan-400' : ''}`} />
                          <span>{item.label}</span>
                          {isActive && (
                            <motion.div
                              className="absolute left-0 w-2 h-8 bg-gradient-to-r from-cyan-400 to-primary-500 rounded-r shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                              layoutId="mobileActiveNavIndicator"
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            />
                          )}
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>

              {/* User Profile */}
              <div className="p-4 border-t border-zinc-800/50 mt-auto">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center overflow-hidden">
                    {userData?.photoURL ? (
                      <img
                        src={userData.photoURL}
                        alt={userData.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-primary-500">
                        {userData?.displayName?.[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {userData?.displayName || 'User'}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">
                      {userData?.email || ''}
                    </p>
                  </div>
                  <motion.button
                    onClick={handleLogout}
                    className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/50"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title="Logout"
                  >
                    <FiLogOut />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout; 
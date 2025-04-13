import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  FiUser, FiBook, FiStar, FiUsers, FiActivity, FiAward, 
  FiTrendingUp, FiCalendar, FiCheck,
  FiX, FiUserPlus, FiUserCheck, FiClock, FiMessageSquare
} from 'react-icons/fi';
import { getRecentActivities, getUpcomingSessions, respondToConnectionRequest } from '../../services/firestore';
import { RecentActivity, UpcomingSession } from '../../types/dashboard';


const skillCategories = [
  { id: 'technical', name: 'Technical Skills', icon: FiBook },
  { id: 'soft', name: 'Soft Skills', icon: FiUsers },
  { id: 'language', name: 'Language Skills', icon: FiActivity },
  { id: 'artistic', name: 'Artistic Skills', icon: FiAward },
  { id: 'business', name: 'Business Skills', icon: FiTrendingUp },
  { id: 'other', name: 'Other Skills', icon: FiCalendar }
];

const Dashboard = () => {
  const { userData, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [_selectedCategory, _setSelectedCategory] = useState<string | null>(null);
  const [_recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [_upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [_isLoading, setIsLoading] = useState(true);

  // Mouse position tracking for parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left - width / 2);
    mouseY.set(clientY - top - height / 2);
  };

  const springConfig = { damping: 20, stiffness: 100 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!userData) return;
      
      setIsLoading(true);
      
      try {
        // Fetch recent activities
        const activities = await getRecentActivities(userData.id, 10);
        setRecentActivities(activities);
        
        // Fetch upcoming sessions
        const sessions = await getUpcomingSessions(userData.id, 10);
        setUpcomingSessions(sessions);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [userData]);

  const handleAcceptRequest = async (requestId: string) => {
    if (!userData) return;
    
    try {
      await respondToConnectionRequest(userData.id, requestId, true);
      
      // Update local state
      const updatedRequests = userData.connectionRequests.map(req =>
        req.id === requestId ? { ...req, status: 'accepted' as const } : req
      );
      
      await updateUserProfile({ connectionRequests: updatedRequests });
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    if (!userData) return;
    
    try {
      await respondToConnectionRequest(userData.id, requestId, false);
      
      // Update local state
      const updatedRequests = userData.connectionRequests.map(req =>
        req.id === requestId ? { ...req, status: 'rejected' as const } : req
      );
      
      await updateUserProfile({ connectionRequests: updatedRequests });
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  const stats = [
    {
      id: 'skills',
      label: 'Skills',
      value: userData?.skills?.length || 0,
      icon: FiBook,
      color: 'from-blue-500 to-blue-600',
      link: '/skills'
    },
    {
      id: 'desired',
      label: 'Desired Skills',
      value: userData?.desiredSkills?.length || 0,
      icon: FiTrendingUp,
      color: 'from-purple-500 to-purple-600',
      link: '/skills'
    },
    {
      id: 'connections',
      label: 'Connections',
      value: userData?.connections?.length || 0,
      icon: FiUsers,
      color: 'from-green-500 to-green-600',
      link: '/connections'
    },
    {
      id: 'exchanges',
      label: 'Skill Exchanges',
      value: '0', // This would be dynamic in a real implementation
      icon: FiActivity,
      color: 'from-amber-500 to-amber-600',
      link: '/skill-exchanges'
    },
    {
      id: 'chats',
      label: 'Chats',
      value: userData?.chats?.length || 0,
      icon: FiMessageSquare,
      color: 'from-indigo-500 to-indigo-600',
      link: '/chats'
    },
    {
      id: 'rating',
      label: 'Rating',
      value: userData?.rating?.toFixed(1) || '0.0',
      icon: FiStar,
      color: 'from-yellow-500 to-yellow-600',
      link: '/profile'
    }
  ];

  const pendingRequests = userData?.connectionRequests?.filter(
    (req) => req.status === 'pending'
  ) || [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiActivity },
    { id: 'skills', label: 'Skills', icon: FiBook },
    { id: 'connections', label: 'Connections', icon: FiUsers },
    { id: 'requests', label: 'Requests', icon: FiUserPlus },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        {/* Welcome Header */}
        <motion.div
          className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-800/50 mb-6 overflow-hidden"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'perspective(1000px)',
            rotateX: useTransform(springY, [-200, 200], [2, -2]),
            rotateY: useTransform(springX, [-200, 200], [-2, 2]),
          }}
        >
          <div className="p-6">
            <motion.h1 
              className="text-2xl font-bold text-white mb-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Welcome back, {userData?.displayName}
            </motion.h1>
            <motion.p 
              className="text-zinc-400"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {userData?.bio || 'Add a bio to tell others about yourself'}
            </motion.p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnimatePresence>
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  onHoverStart={() => setHoveredCard(stat.id)}
                  onHoverEnd={() => setHoveredCard(null)}
                >
                  <Link to={stat.link}>
                    <div className="bg-zinc-900/50 backdrop-blur-xl p-6 rounded-2xl border border-zinc-800/50 shadow-lg relative overflow-hidden group">
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                        animate={{
                          scale: hoveredCard === stat.id ? 1.1 : 1,
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <Icon className={`w-6 h-6 text-${stat.color.split('-')[1]}-500`} />
                          <motion.span
                            className="text-3xl font-bold text-white"
                            animate={{ scale: hoveredCard === stat.id ? 1.1 : 1 }}
                          >
                            {stat.value}
                          </motion.span>
                        </div>
                        <h3 className="text-zinc-400 font-medium">{stat.label}</h3>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Main Content */}
        <motion.div
          className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-800/50 overflow-hidden"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'perspective(1000px)',
            rotateX: useTransform(springY, [-200, 200], [1, -1]),
            rotateY: useTransform(springX, [-200, 200], [-1, 1]),
          }}
        >
          {/* Navigation Tabs */}
          <div className="border-b border-zinc-800/50">
            <nav className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-4 text-sm font-medium relative ${
                      activeTab === tab.id
                        ? 'text-primary-500'
                        : 'text-zinc-400 hover:text-zinc-300'
                    }`}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Icon className="mr-2" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-t"
                        layoutId="activeTab"
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <div className="bg-zinc-800/50 rounded-xl p-4">
                      <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
                      <div className="space-y-4">
                        {userData?.skills?.slice(0, 3).map((skill) => (
                          <div key={skill.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <FiBook className="text-primary-500 mr-2" />
                              <span className="text-zinc-300">{skill.name}</span>
                            </div>
                            <span className="text-zinc-400 text-sm">{skill.level}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Connection Requests */}
                    <div className="bg-zinc-800/50 rounded-xl p-4">
                      <h3 className="text-lg font-medium text-white mb-4">Connection Requests</h3>
                      <div className="space-y-4">
                        {pendingRequests.length > 0 ? (
                          pendingRequests.map((request) => (
                            <div key={request.id} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <FiUserPlus className="text-primary-500 mr-2" />
                                <span className="text-zinc-300">{request.fromUserId}</span>
                              </div>
                              <div className="flex space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="p-1 rounded-full bg-green-500/20 text-green-500"
                                  onClick={() => handleAcceptRequest(request.id)}
                                >
                                  <FiCheck />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="p-1 rounded-full bg-red-500/20 text-red-500"
                                  onClick={() => handleDeclineRequest(request.id)}
                                >
                                  <FiX />
                                </motion.button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-zinc-400">No pending requests</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'skills' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {skillCategories.map((category) => {
                        const CategoryIcon = category.icon;
                        const categorySkills = userData?.skills?.filter(
                          (skill) => skill.category === category.id
                        ) || [];
                        
                        return (
                          <motion.div
                            key={category.id}
                            className="bg-zinc-800/50 p-4 rounded-xl"
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center">
                                <CategoryIcon className="text-primary-500 mr-2" />
                                <h4 className="text-white font-medium">{category.name}</h4>
                              </div>
                              <span className="text-zinc-400 text-sm">
                                {categorySkills.length} skills
                              </span>
                            </div>
                            <div className="space-y-2">
                              {categorySkills.map((skill) => (
                                <div
                                  key={skill.id}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="text-zinc-300">{skill.name}</span>
                                  <span className="text-zinc-400">{skill.level}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'connections' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userData?.connections?.map((connection) => (
                      <motion.div
                        key={connection}
                        className="bg-zinc-800/50 p-4 rounded-xl flex items-center justify-between"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                            <FiUser className="text-primary-500" />
                          </div>
                          <div className="ml-3">
                            <p className="text-white">{connection}</p>
                            <p className="text-sm text-zinc-400">Connected</p>
                          </div>
                        </div>
                        <FiUserCheck className="text-green-500" />
                      </motion.div>
                    ))}
                  </div>
                )}

                {activeTab === 'requests' && (
                  <div className="space-y-4">
                    {pendingRequests.length > 0 ? (
                      pendingRequests.map((request) => (
                        <motion.div
                          key={request.id}
                          className="bg-zinc-800/50 p-4 rounded-xl flex items-center justify-between"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                              <FiUserPlus className="text-primary-500" />
                            </div>
                            <div className="ml-3">
                              <p className="text-white">{request.fromUserId}</p>
                              <p className="text-sm text-zinc-400">
                                <FiClock className="inline mr-1" />
                                Pending Request
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 rounded-lg bg-green-500/20 text-green-500"
                              onClick={() => handleAcceptRequest(request.id)}
                            >
                              Accept
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 rounded-lg bg-red-500/20 text-red-500"
                              onClick={() => handleDeclineRequest(request.id)}
                            >
                              Decline
                            </motion.button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FiUserPlus className="mx-auto h-12 w-12 text-zinc-600" />
                        <p className="mt-4 text-zinc-400">No pending connection requests</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard; 
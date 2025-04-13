import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { FiEdit2, FiSave, FiX, FiCamera, FiStar, FiAward, FiCalendar, FiLogOut, FiArrowLeft, FiUserPlus, FiMessageSquare, FiShare2 } from 'react-icons/fi';

const Profile = () => {
  const { userData, updateUserProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [editedProfile, setEditedProfile] = useState({
    displayName: userData?.displayName || '',
    bio: userData?.bio || '',
    photoURL: userData?.photoURL || '',
  });

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

  const handleSave = async () => {
    try {
      await updateUserProfile(editedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditedProfile({
            ...editedProfile,
            photoURL: event.target.result as string,
          });
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const stats = [
    { 
      label: 'Skills', 
      value: userData?.skills?.length || 0, 
      icon: FiAward,
      color: 'from-blue-500 to-blue-600',
      onClick: () => navigate('/skills'),
      description: 'Skills you can teach others'
    },
    { 
      label: 'Rating', 
      value: userData?.rating?.toFixed(1) || '0.0', 
      icon: FiStar,
      color: 'from-yellow-500 to-yellow-600',
      onClick: () => {},
      description: 'Your average rating from peers'
    },
    { 
      label: 'Connections', 
      value: userData?.connections?.length || 0, 
      icon: FiUserPlus,
      color: 'from-green-500 to-green-600',
      onClick: () => {},
      description: 'People you\'ve connected with'
    },
    { 
      label: 'Member Since', 
      value: '2024', 
      icon: FiCalendar,
      color: 'from-purple-500 to-purple-600',
      onClick: () => {},
      description: 'Your account creation date'
    },
  ];

  const actions = [
    { icon: FiMessageSquare, label: 'Message', onClick: () => {}, color: 'bg-blue-500' },
    { icon: FiUserPlus, label: 'Connect', onClick: () => {}, color: 'bg-green-500' },
    { icon: FiShare2, label: 'Share', onClick: () => {}, color: 'bg-purple-500' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-950 py-12 px-4"
      onMouseMove={handleMouseMove}
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <motion.button
            onClick={() => navigate('/')}
            className="flex items-center px-4 py-2 bg-zinc-800/50 text-zinc-400 rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiArrowLeft className="mr-2" />
            Back to Dashboard
          </motion.button>
          <motion.button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-zinc-800/50 text-zinc-400 rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiLogOut className="mr-2" />
            Logout
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Profile Header */}
          <motion.div
            className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-800/50 overflow-hidden"
            style={{
              transformStyle: 'preserve-3d',
              transform: 'perspective(1000px)',
              rotateX: useTransform(springY, [-200, 200], [2, -2]),
              rotateY: useTransform(springX, [-200, 200], [-2, 2]),
            }}
          >
            {/* Cover Image */}
            <div className="h-64 bg-gradient-to-r from-primary-600/20 to-primary-800/20 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-primary-600/10"
                style={{
                  x: useTransform(springX, [-200, 200], [-20, 20]),
                  y: useTransform(springY, [-200, 200], [-20, 20]),
                }}
              />
              
              {/* Floating particles for the cover */}
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/30 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    scale: Math.random() * 2 + 1,
                  }}
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            {/* Profile Picture */}
            <div className="relative -mt-20 px-6 flex justify-between items-end mb-4">
              <motion.div
                className="relative h-40 w-40 rounded-full border-4 border-zinc-900 overflow-hidden bg-gradient-to-r from-primary-500 to-primary-600 shadow-xl"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {(userData?.photoURL || editedProfile.photoURL) ? (
                  <img
                    src={isEditing ? editedProfile.photoURL : userData?.photoURL}
                    alt={userData?.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-5xl font-bold text-white">
                      {userData?.displayName?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                {isEditing && (
                  <>
                    <input
                      type="file"
                      ref={imageInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                      accept="image/*"
                    />
                    <motion.button
                      onClick={() => imageInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiCamera size={24} className="text-white" />
                    </motion.button>
                  </>
                )}
              </motion.div>

              {/* Profile actions */}
              {!isEditing && (
                <div className="flex space-x-2 mb-6 mr-6">
                  {actions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <motion.button
                        key={action.label}
                        onClick={action.onClick}
                        className={`p-3 rounded-full text-white ${action.color} shadow-lg hover:shadow-xl`}
                        whileHover={{ scale: 1.1, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                      >
                        <Icon size={20} />
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Profile Content */}
            <div className="p-6 pt-0">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  {isEditing ? (
                    <motion.input
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      type="text"
                      value={editedProfile.displayName}
                      onChange={(e) =>
                        setEditedProfile({ ...editedProfile, displayName: e.target.value })
                      }
                      className="text-3xl font-bold bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2 w-full"
                    />
                  ) : (
                    <motion.h1 
                      className="text-3xl font-bold text-white mb-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      {userData?.displayName}
                    </motion.h1>
                  )}
                  <div className="flex items-center">
                    <motion.p 
                      className="text-zinc-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      {userData?.email}
                    </motion.p>
                    {!isEditing && (
                      <div className="flex items-center ml-4">
                        <span className="inline-flex h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                        <span className="text-green-500 text-sm">Online</span>
                      </div>
                    )}
                  </div>
                </div>
                <motion.button
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  className={`p-3 rounded-full ${isEditing ? 'bg-primary-600 text-white' : 'bg-zinc-800/50 text-zinc-400 hover:text-white'} transition-colors`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isEditing ? <FiSave size={20} /> : <FiEdit2 size={20} />}
                </motion.button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  const isHovered = hoveredStat === stat.label;
                  
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative bg-zinc-800/50 rounded-xl border border-zinc-700/50 overflow-hidden group cursor-pointer"
                      onClick={stat.onClick}
                      onHoverStart={() => setHoveredStat(stat.label)}
                      onHoverEnd={() => setHoveredStat(null)}
                      whileHover={{ scale: 1.03, y: -5 }}
                    >
                      <motion.div 
                        className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                        animate={{ scale: isHovered ? 1.1 : 1 }}
                      />
                      <div className="p-4 relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <Icon className={`text-${stat.color.split('-')[1]}`} size={20} />
                          <motion.span 
                            className="text-2xl font-bold text-white"
                            animate={{ scale: isHovered ? 1.1 : 1 }}
                          >
                            {stat.value}
                          </motion.span>
                        </div>
                        <p className="text-sm text-zinc-400 group-hover:text-white transition-colors">{stat.label}</p>
                        <AnimatePresence>
                          {isHovered && (
                            <motion.p 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-xs text-zinc-500 mt-1 overflow-hidden"
                            >
                              {stat.description}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Bio */}
              <div className="space-y-4 bg-zinc-800/30 p-6 rounded-xl border border-zinc-700/20">
                <h2 className="text-xl font-medium text-white flex items-center">
                  <span className="inline-block w-1 h-6 bg-primary-500 mr-3 rounded-full"></span>
                  About Me
                </h2>
                {isEditing ? (
                  <motion.textarea
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    value={editedProfile.bio}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, bio: e.target.value })
                    }
                    rows={5}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Tell us about yourself, your interests, and what you want to learn or teach..."
                  />
                ) : (
                  <motion.div 
                    className="relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div 
                      className="absolute -left-4 top-0 w-0.5 h-full bg-zinc-700/50"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    />
                    <motion.p 
                      className="text-zinc-300 whitespace-pre-wrap leading-relaxed pl-2"
                    >
                      {userData?.bio || 'This user has not added a bio yet.'}
                    </motion.p>
                  </motion.div>
                )}
              </div>

              {/* Save Button */}
              <AnimatePresence>
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="flex justify-end mt-6 space-x-3"
                  >
                    <motion.button
                      onClick={() => setIsEditing(false)}
                      className="px-5 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiX className="mr-2" />
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleSave}
                      className="px-5 py-2.5 rounded-lg bg-primary-600 text-white hover:bg-primary-500 transition-colors flex items-center"
                      whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.3)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiSave className="mr-2" />
                      Save Changes
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Profile; 
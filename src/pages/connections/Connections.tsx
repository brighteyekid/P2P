import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUsers, FiUserPlus, FiArrowLeft, FiLogOut, FiSearch, 
  FiRefreshCw, FiCheck, FiX, FiMessageSquare, FiFilter,
  FiInfo, FiAlertCircle, FiStar, FiVideo, FiMessageCircle,
  FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import { 
  discoverUsers, sendConnectionRequest, respondToConnectionRequest, 
  getUserDetailsById, getUserChats, createChat, initiateSession
} from '../../services/firestore';
import { User, Skill, ConnectionRequest } from '../../types';

// Placeholder for socket connection - will be implemented later
// import { socket } from '../../lib/socket';

const Connections = () => {
  const { userData, signOut, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'discover' | 'pending' | 'connected'>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [potentialMatches, setPotentialMatches] = useState<User[]>([]);
  const [pendingConnections, setPendingConnections] = useState<ConnectionRequest[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('info');
  const [loadingUserId, setLoadingUserId] = useState('');
  
  // New filter states
  const [matchType, setMatchType] = useState<'all' | 'teaching' | 'learning' | 'both'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'name' | 'activity'>('relevance');

  // Add to state variables
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [iWillLearn, setIWillLearn] = useState('');
  const [theyWillLearn, setTheyWillLearn] = useState('');

  // Fetch potential matches on component mount or when filters change
  useEffect(() => {
    if (!userData) return;
    if (activeTab === 'discover') {
      fetchPotentialMatches();
    }
  }, [userData, selectedSkill, activeTab, matchType, searchQuery]);

  const fetchPotentialMatches = async () => {
    if (!userData) return;
    
    setIsLoading(true);
    
    try {
      // Convert match type to the format expected by discoverUsers
      const includedSkillTypes = matchType === 'all' 
        ? undefined 
        : matchType as 'teaching' | 'learning' | 'both';
      
      // Create filter object
      const filters = {
        skillIds: selectedSkill ? [selectedSkill] : [],
        query: searchQuery,
        includedSkillTypes
      };
      
      // Fetch potential matches from Firestore
      const matches = await discoverUsers(userData.id, filters);
      
      // Apply sorting
      let sortedMatches = [...matches];
      if (sortBy === 'name') {
        sortedMatches.sort((a, b) => a.displayName.localeCompare(b.displayName));
      } else if (sortBy === 'activity') {
        // Sort by last active, most recent first
        sortedMatches.sort((a, b) => {
          if (!a.lastActive) return 1;
          if (!b.lastActive) return -1;
          return b.lastActive.getTime() - a.lastActive.getTime();
        });
      }
      
      setPotentialMatches(sortedMatches);
    } catch (error) {
      console.error('Error fetching potential matches:', error);
      
      // Show error notification
      showToast('Failed to load potential matches. Please try again later.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Get pending connections and connected users from userData
  useEffect(() => {
    if (!userData) return;
    
    // Extract pending connection requests
    const pending = userData.connectionRequests || [];
    setPendingConnections(pending);
    
    // Fetch connected users
    if (activeTab === 'connected') {
      fetchConnectedUsers();
    }
  }, [userData, activeTab]);

  const fetchConnectedUsers = async () => {
    if (!userData || !userData.connections || userData.connections.length === 0) {
      setConnectedUsers([]);
      return;
    }
    
    setConnectionsLoading(true);
    
    try {
      // Fetch actual user details for each connection ID
      const connectedUserPromises = userData.connections.map(userId => 
        getUserDetailsById(userId)
      );
      
      const connectedUserDetails = await Promise.all(connectedUserPromises);
      
      // Filter out any null values from failed fetches
      const validConnectedUsers = connectedUserDetails.filter(user => user !== null) as User[];
      
      setConnectedUsers(validConnectedUsers);
    } catch (error) {
      console.error('Error fetching connected users:', error);
      showToast('Failed to load connections. Please try again later.', 'error');
    } finally {
      setConnectionsLoading(false);
    }
  };

  // Show a notification toast 
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSendRequest = (user: User) => {
    setSelectedUser(user);
    
    // Pre-populate based on skills match
    const userTeachingSkills = user.skills?.filter(skill => 
      userData?.desiredSkills?.some(desiredSkill => 
        desiredSkill.name.toLowerCase() === skill.name.toLowerCase()
      )
    );
    
    const userLearningSkills = user.desiredSkills?.filter(desiredSkill => 
      userData?.skills?.some(skill => 
        skill.name.toLowerCase() === desiredSkill.name.toLowerCase()
      )
    );
    
    if (userTeachingSkills && userTeachingSkills.length > 0) {
      setIWillLearn(userTeachingSkills.map(skill => skill.name).join(', '));
    }
    
    if (userLearningSkills && userLearningSkills.length > 0) {
      setTheyWillLearn(userLearningSkills.map(skill => skill.name).join(', '));
    }
    
    setIsRequestModalOpen(true);
  };

  // New function to submit the connection request with learning details
  const submitConnectionRequest = async () => {
    if (!userData || !selectedUser) return;
    
    try {
      setIsLoading(true);
      
      // Create exchange details object
      await sendConnectionRequest(
        userData.id, 
        selectedUser.id,
        {
          message: requestMessage,
          iWillLearn,
          theyWillLearn
        }
      );
      
      // Show success notification
      showToast('Connection request sent successfully!', 'success');
      
      // Close the modal
      setIsRequestModalOpen(false);
      setRequestMessage('');
      setIWillLearn('');
      setTheyWillLearn('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error sending connection request:', error);
      showToast('Failed to send connection request. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (fromUserId: string, requestId: string) => {
    if (!userData) return;
    
    try {
      setIsLoading(true);
      
      // Accept the connection request
      await respondToConnectionRequest(userData.id, requestId, true);
      
      // Update local state - remove from pending
      const updatedPendingConnections = pendingConnections.filter(
        conn => conn.id !== requestId
      );
      setPendingConnections(updatedPendingConnections);
      
      // Add to connections array in local state if not already there
      if (!userData.connections.includes(fromUserId)) {
        const updatedConnections = [...userData.connections, fromUserId];
        await updateUserProfile({ connections: updatedConnections });
      }
      
      showToast('Connection request accepted!', 'success');
      
      // Refresh connected users if on that tab
      if (activeTab === 'connected') {
        fetchConnectedUsers();
      }
    } catch (error) {
      console.error('Error accepting connection request:', error);
      showToast('Failed to accept connection request. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async (_fromUserId: string, requestId: string) => {
    if (!userData) return;
    
    try {
      setLoadingUserId(requestId);
      
      // Call Firestore to reject the request
      await respondToConnectionRequest(userData.id, requestId, false);
      
      // Update local state
      setPendingConnections(pendingConnections.filter(
        conn => conn.id !== requestId
      ));
      
      showToast('Connection request rejected', 'info');
    } catch (error) {
      console.error('Error rejecting connection request:', error);
      showToast('Failed to reject connection request', 'error');
    } finally {
      setLoadingUserId('');
    }
  };

  // Handle initiate session
  const handleInitiateSession = async (userId: string) => {
    try {
      setLoadingUserId(userId);
      if (!userData) return;
      
      // Get the skill to exchange (for demo we'll use the first one)
      const userSkills = userData.skills || [];
      if (userSkills.length === 0) {
        showToast("You need to add skills before initiating a session", "error");
        return;
      }
      
      // Use the first skill for now (in a real app, you'd select a specific skill)
      const skillId = userSkills[0].id;
      
      // Initiate the session
      await initiateSession(
        userData.id,
        userId,
        skillId
      );
      
      showToast("Session request sent! The user will be notified.", "success");
    } catch (error) {
      console.error("Error initiating session:", error);
      showToast("Failed to initiate session. Please try again.", "error");
    } finally {
      setLoadingUserId("");
    }
  };

  // Handle sending a message
  const handleMessage = async (userId: string) => {
    if (!userData) return;
    
    try {
      setIsLoading(true);
      
      // Check if a chat already exists between the current user and the selected user
      const userChats = await getUserChats(userData.id);
      
      // Find a chat where participants include both the current user and the selected user
      const existingChat = userChats.find(chat => 
        chat.participants.includes(userId) && 
        chat.participants.length === 2 // Ensure it's a direct chat
      );
      
      if (existingChat) {
        // Chat exists, navigate to it
        navigate(`/chat/${existingChat.id}`);
        showToast(`Opening chat with ${userId}`, 'info');
      } else {
        // Create a new chat
        const chatId = await createChat([userData.id, userId]);
        
        // Navigate to the new chat
        navigate(`/chat/${chatId}`);
        showToast(`Created a new chat with ${userId}`, 'success');
      }
    } catch (error) {
      console.error('Failed to open messaging:', error);
      showToast('Failed to open messaging. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to remove notifications after they've been displayed
  const removeNotification = (id: number) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  // Get initials from display name
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Format the last active timestamp in a human-readable way
  const formatLastActive = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-950"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with navigation */}
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
          <div className="flex space-x-2">
            <motion.button
              onClick={() => navigate('/chats')}
              className="flex items-center px-4 py-2 bg-zinc-800/50 text-zinc-400 rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiMessageSquare className="mr-2" />
              All Chats
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
        </div>

        {/* Main content container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-800/50 overflow-hidden"
        >
          {/* Page title and tabs */}
          <div className="p-6 border-b border-zinc-800/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <h1 className="text-2xl font-bold text-white flex items-center">
                <FiUsers className="mr-3 text-primary-500" />
                Connections
              </h1>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('discover')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'discover'
                      ? 'bg-primary-600 text-white'
                      : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white'
                  }`}
                >
                  Discover
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                    activeTab === 'pending'
                      ? 'bg-primary-600 text-white'
                      : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white'
                  }`}
                >
                  Pending
                  {pendingConnections.length > 0 && (
                    <span className="ml-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {pendingConnections.filter(c => c.status === 'pending').length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('connected')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'connected'
                      ? 'bg-primary-600 text-white'
                      : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white'
                  }`}
                >
                  Connected
                </button>
              </div>
            </div>
          </div>

          {/* Search and filters bar */}
          {activeTab === 'discover' && (
            <div className="p-6 border-b border-zinc-800/50">
              <div className="flex flex-col space-y-4">
                {/* Search bar */}
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search for skills or users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <motion.button
                      onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                      className={`flex items-center px-4 py-2 ${isFiltersOpen ? 'bg-primary-600 text-white' : 'bg-zinc-800/50 text-zinc-400'} rounded-lg hover:bg-primary-500 hover:text-white transition-colors`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiFilter className="mr-2" />
                      Filters
                      {isFiltersOpen ? <FiChevronUp className="ml-2" /> : <FiChevronDown className="ml-2" />}
                    </motion.button>
                    <motion.button
                      onClick={fetchPotentialMatches}
                      className="flex items-center px-4 py-2 bg-zinc-800/50 text-zinc-400 rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiRefreshCw className="mr-2" />
                      Refresh
                    </motion.button>
                  </div>
                </div>
                
                {/* Advanced filters */}
                <AnimatePresence>
                  {isFiltersOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-zinc-800/30 p-4 rounded-lg border border-zinc-700/50">
                        {/* Skill filter */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Filter by Skills
                          </label>
                          <select
                            value={selectedSkill || ''}
                            onChange={(e) => setSelectedSkill(e.target.value || null)}
                            className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">All Skills</option>
                            {userData?.skills?.map((skill: Skill) => (
                              <option key={skill.id} value={skill.id}>{skill.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Match type */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Match Type
                          </label>
                          <select
                            value={matchType}
                            onChange={(e) => setMatchType(e.target.value as 'all' | 'teaching' | 'learning' | 'both')}
                            className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="all">All Users</option>
                            <option value="teaching">Can Teach Me</option>
                            <option value="learning">Want to Learn from Me</option>
                            <option value="both">Mutual Interest</option>
                          </select>
                        </div>

                        {/* Sort by */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Sort By
                          </label>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'relevance' | 'name' | 'activity')}
                            className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="relevance">Most Relevant</option>
                            <option value="name">Name</option>
                            <option value="activity">Last Activity</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Reset filters button */}
                      <div className="mt-3 flex justify-end">
                        <motion.button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedSkill(null);
                            setMatchType('all');
                            setSortBy('relevance');
                            // Fetch after reset
                            setTimeout(fetchPotentialMatches, 0);
                          }}
                          className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition-colors flex items-center"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <FiX className="mr-2" />
                          Reset Filters
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Tab content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Discover tab */}
              {activeTab === 'discover' && (
                <motion.div
                  key="discover"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Results summary */}
                  {!isLoading && (
                    <div className="flex justify-between items-center">
                      <p className="text-zinc-400">
                        Found <span className="text-white font-medium">{potentialMatches.length}</span> users
                        {searchQuery && <span> matching "<span className="text-primary-400">{searchQuery}</span>"</span>}
                        {matchType !== 'all' && (
                          <span> with {matchType === 'teaching' ? 'teaching' : matchType === 'learning' ? 'learning' : 'mutual'} skill matches</span>
                        )}
                      </p>
                    </div>
                  )}
                  
                  {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-12">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mb-4"
                      >
                        <FiRefreshCw className="text-primary-500" size={40} />
                      </motion.div>
                      <p className="text-zinc-400">Finding potential connections...</p>
                    </div>
                  ) : potentialMatches.length === 0 ? (
                    <div className="text-center py-12">
                      <FiUsers className="mx-auto h-16 w-16 text-zinc-600 mb-4" />
                      <h3 className="text-xl font-medium text-white mb-2">No users found</h3>
                      <p className="text-zinc-400 mb-6">
                        {(searchQuery || selectedSkill || matchType !== 'all') 
                          ? "Try adjusting your filters to see more results" 
                          : "There are no other users available at this time"}
                      </p>
                      {(searchQuery || selectedSkill || matchType !== 'all') && (
                        <motion.button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedSkill(null);
                            setMatchType('all');
                            setSortBy('relevance');
                            setTimeout(fetchPotentialMatches, 0);
                          }}
                          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors inline-flex items-center"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <FiX className="mr-2" />
                          Clear Filters
                        </motion.button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {potentialMatches.map(user => {
                        // Determine if there's a teaching match (they can teach what you want to learn)
                        const teachingMatch = userData?.desiredSkills?.some(desiredSkill => 
                          user.skills?.some(skill => 
                            skill.name.toLowerCase() === desiredSkill.name.toLowerCase()
                          )
                        );
                        
                        // Determine if there's a learning match (they want to learn what you can teach)
                        const learningMatch = userData?.skills?.some(skill => 
                          user.desiredSkills?.some(desiredSkill => 
                            desiredSkill.name.toLowerCase() === skill.name.toLowerCase()
                          )
                        );
                        
                        return (
                          <motion.div
                            key={user.id}
                            className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 overflow-hidden"
                            whileHover={{ scale: 1.02, y: -5 }}
                          >
                            <div className="p-5">
                              {/* User header with match badges */}
                              <div className="flex items-center mb-4">
                                <div className="h-12 w-12 rounded-full bg-primary-500/20 flex items-center justify-center text-xl font-bold text-white mr-3 relative">
                                  {getInitials(user.displayName)}
                                  {user.lastActive && (Date.now() - user.lastActive.getTime()) < 1000 * 60 * 60 * 24 && (
                                    <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-zinc-800"></span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-white font-medium">{user.displayName}</h3>
                                    <div className="flex items-center text-zinc-400 text-sm">
                                      <FiStar className="text-yellow-500 mr-1" size={14} />
                                      {user.rating ? user.rating.toFixed(1) : "No rating"}
                                    </div>
                                  </div>
                                  <div className="flex items-center text-xs space-x-2 mt-1">
                                    {teachingMatch && (
                                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                                        Can teach you
                                      </span>
                                    )}
                                    {learningMatch && (
                                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                                        Wants to learn
                                      </span>
                                    )}
                                    {user.lastActive && (
                                      <span className="text-zinc-500">
                                        Active {formatLastActive(user.lastActive)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <p className="text-zinc-300 text-sm mb-4 line-clamp-2">{user.bio || "No bio available"}</p>
                              
                              {/* Skills section */}
                              <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-zinc-400 text-xs uppercase tracking-wider">Skills</h4>
                                  <span className="text-xs text-zinc-500">{user.skills?.length || 0} skills</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {user.skills && user.skills.length > 0 ? (
                                    user.skills.slice(0, 4).map((skill: Skill) => {
                                      // Check if this skill matches any of your desired skills
                                      const isMatch = userData?.desiredSkills?.some(
                                        d => d.name.toLowerCase() === skill.name.toLowerCase()
                                      );
                                      
                                      return (
                                        <span 
                                          key={skill.id} 
                                          className={`px-2 py-1 rounded text-xs flex items-center ${
                                            isMatch 
                                              ? 'bg-blue-500/30 text-blue-300 border border-blue-500/30' 
                                              : 'bg-blue-500/10 text-blue-400'
                                          }`}
                                        >
                                          {skill.name}
                                          {isMatch && <FiCheck className="ml-1" size={10} />}
                                        </span>
                                      );
                                    })
                                  ) : (
                                    <span className="text-zinc-500 text-xs">No skills listed</span>
                                  )}
                                  {user.skills && user.skills.length > 4 && (
                                    <span className="px-2 py-1 bg-zinc-700/30 text-zinc-400 rounded text-xs">
                                      +{user.skills.length - 4} more
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Looking For section */}
                              <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-zinc-400 text-xs uppercase tracking-wider">Looking For</h4>
                                  <span className="text-xs text-zinc-500">{user.desiredSkills?.length || 0} skills</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {user.desiredSkills && user.desiredSkills.length > 0 ? (
                                    user.desiredSkills.slice(0, 4).map((skill: Skill) => {
                                      // Check if this is a skill you can teach
                                      const isMatch = userData?.skills?.some(
                                        s => s.name.toLowerCase() === skill.name.toLowerCase()
                                      );
                                      
                                      return (
                                        <span 
                                          key={skill.id} 
                                          className={`px-2 py-1 rounded text-xs flex items-center ${
                                            isMatch 
                                              ? 'bg-green-500/30 text-green-300 border border-green-500/30' 
                                              : 'bg-purple-500/10 text-purple-400'
                                          }`}
                                        >
                                          {skill.name}
                                          {isMatch && <FiCheck className="ml-1" size={10} />}
                                        </span>
                                      );
                                    })
                                  ) : (
                                    <span className="text-zinc-500 text-xs">No desired skills listed</span>
                                  )}
                                  {user.desiredSkills && user.desiredSkills.length > 4 && (
                                    <span className="px-2 py-1 bg-zinc-700/30 text-zinc-400 rounded text-xs">
                                      +{user.desiredSkills.length - 4} more
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Connect button */}
                              <motion.button
                                onClick={() => handleSendRequest(user)}
                                className={`w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors flex items-center justify-center ${
                                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                whileHover={!isLoading ? { scale: 1.02 } : undefined}
                                whileTap={!isLoading ? { scale: 0.98 } : undefined}
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <>
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      className="mr-2"
                                    >
                                      <FiRefreshCw />
                                    </motion.div>
                                    Connecting...
                                  </>
                                ) : (
                                  <>
                                    <FiUserPlus className="mr-2" />
                                    Connect
                                  </>
                                )}
                              </motion.button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Pending tab */}
              {activeTab === 'pending' && (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {isLoading && !pendingConnections.length ? (
                    <div className="flex justify-center items-center py-12">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <FiRefreshCw className="text-primary-500" size={30} />
                      </motion.div>
                    </div>
                  ) : pendingConnections.length === 0 ? (
                    <div className="text-center py-12">
                      <FiUserPlus className="mx-auto h-12 w-12 text-zinc-600" />
                      <p className="mt-4 text-zinc-400">No pending connection requests</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingConnections.map(connection => (
                        <motion.div
                          key={connection.id}
                          className="bg-zinc-800/50 p-5 rounded-xl border border-zinc-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="flex items-center">
                            <div className="h-12 w-12 rounded-full bg-primary-500/20 flex items-center justify-center text-xl font-bold text-white mr-3">
                              {connection.fromUserId.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-white font-medium">{connection.fromUserId}</h3>
                              <p className="text-zinc-400 text-sm">
                                Request received • {' '}
                                {connection.createdAt && new Date(connection.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          {connection.status === 'pending' && (
                            <div className="flex space-x-2">
                              <motion.button
                                onClick={() => handleAcceptRequest(connection.fromUserId, connection.id)}
                                className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors flex items-center ${
                                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                whileHover={!isLoading ? { scale: 1.05 } : undefined}
                                whileTap={!isLoading ? { scale: 0.95 } : undefined}
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <>
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      className="mr-2"
                                    >
                                      <FiRefreshCw size={14} />
                                    </motion.div>
                                    Accept
                                  </>
                                ) : (
                                  <>
                                    <FiCheck className="mr-2" />
                                    Accept
                                  </>
                                )}
                              </motion.button>
                              <motion.button
                                onClick={() => handleRejectRequest(connection.fromUserId, connection.id)}
                                className={`px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors flex items-center ${
                                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                whileHover={!isLoading ? { scale: 1.05 } : undefined}
                                whileTap={!isLoading ? { scale: 0.95 } : undefined}
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <>
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      className="mr-2"
                                    >
                                      <FiRefreshCw size={14} />
                                    </motion.div>
                                    Reject
                                  </>
                                ) : (
                                  <>
                                    <FiX className="mr-2" />
                                    Decline
                                  </>
                                )}
                              </motion.button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Connected tab */}
              {activeTab === 'connected' && (
                <motion.div
                  key="connected"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-6">
                    <h2 className="text-xl font-medium text-white mb-1">Your connections</h2>
                    <p className="text-zinc-400 text-sm">People you've connected with to learn or teach skills</p>
                  </div>
                  
                  {connectionsLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <FiRefreshCw className="text-primary-500" size={30} />
                      </motion.div>
                      <p className="mt-3 text-zinc-400">Loading your connections...</p>
                    </div>
                  ) : connectedUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <FiUsers className="mx-auto h-12 w-12 text-zinc-600" />
                      <p className="mt-4 text-zinc-400">No active connections yet</p>
                      <button 
                        onClick={() => setActiveTab('discover')}
                        className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-400 transition-colors"
                      >
                        Find people to connect with
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {connectedUsers.map(user => (
                        <motion.div
                          key={user.id}
                          className="bg-zinc-800/50 p-5 rounded-xl border border-zinc-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="flex items-center">
                            <div className="h-12 w-12 rounded-full bg-primary-500/20 flex items-center justify-center text-xl font-bold text-white mr-3">
                              {getInitials(user.displayName)}
                            </div>
                            <div>
                              <h3 className="text-white font-medium">{user.displayName}</h3>
                              <div className="flex items-center text-zinc-400 text-sm">
                                {user.lastActive ? (
                                  Math.round((Date.now() - new Date(user.lastActive).getTime()) / (1000 * 60 * 60)) < 24 ? (
                                    <>
                                      <span className="inline-flex h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                      <span>Active recently</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="inline-flex h-2 w-2 rounded-full bg-zinc-500 mr-2"></span>
                                      <span>Last active {Math.round((Date.now() - new Date(user.lastActive).getTime()) / (1000 * 60 * 60 * 24))} days ago</span>
                                    </>
                                  )
                                ) : (
                                  <>
                                    <span className="inline-flex h-2 w-2 rounded-full bg-zinc-500 mr-2"></span>
                                    <span>Last active unknown</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <motion.button
                              onClick={() => handleMessage(user.id)}
                              className="px-4 py-2 bg-zinc-700/50 text-white rounded-lg hover:bg-zinc-600/50 transition-colors flex items-center"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FiMessageCircle className="mr-2" />
                              Message
                            </motion.button>
                            
                            <motion.button
                              onClick={() => handleInitiateSession(user.id)}
                              className={`px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-400 transition-colors flex items-center ${
                                loadingUserId === user.id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              whileHover={loadingUserId !== user.id ? { scale: 1.05 } : undefined}
                              whileTap={loadingUserId !== user.id ? { scale: 0.95 } : undefined}
                              disabled={loadingUserId === user.id}
                            >
                              {loadingUserId === user.id ? (
                                <>
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="mr-2"
                                  >
                                    <FiRefreshCw size={14} />
                                  </motion.div>
                                  Starting...
                                </>
                              ) : (
                                <>
                                  <FiVideo className="mr-2" />
                                  Start Session
                                </>
                              )}
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Notifications */}
      <div className="fixed bottom-6 right-6 space-y-3 z-50">
        <AnimatePresence>
          {notifications.map(notification => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`p-4 rounded-lg shadow-lg flex items-start ${
                notification.type === 'success' ? 'bg-green-500/90' :
                notification.type === 'error' ? 'bg-red-500/90' :
                'bg-blue-500/90'
              } backdrop-blur-sm max-w-md`}
              onClick={() => removeNotification(notification.id)}
            >
              <div className="flex-shrink-0 mr-3 mt-0.5">
                {notification.type === 'success' ? <FiCheck className="text-white" /> :
                notification.type === 'error' ? <FiAlertCircle className="text-white" /> :
                <FiInfo className="text-white" />}
              </div>
              <div className="flex-1">
                <p className="text-white">{notification.message}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notification.id);
                }}
                className="ml-3 text-white/80 hover:text-white"
              >
                <FiX />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg flex items-center ${
              notificationType === 'success' ? 'bg-green-500' :
              notificationType === 'error' ? 'bg-red-500' :
              'bg-blue-500'
            } text-white z-50`}
          >
            <div className="mr-2">
              {notificationType === 'success' ? <FiCheck /> :
               notificationType === 'error' ? <FiAlertCircle /> :
               <FiInfo />}
            </div>
            <p>{notificationMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request modal */}
      <AnimatePresence>
        {isRequestModalOpen && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setIsRequestModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Send Connection Request</h2>
                <button
                  onClick={() => setIsRequestModalOpen(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-white mb-2 font-medium">Connecting with {selectedUser.displayName}</p>
                  <p className="text-zinc-400 text-sm">Specify what skills you'll both learn from each other</p>
                </div>
                
                <div>
                  <label className="block text-zinc-300 text-sm font-medium mb-1">
                    What will you learn?
                  </label>
                  <input
                    type="text"
                    value={iWillLearn}
                    onChange={(e) => setIWillLearn(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Skills you want to learn from them..."
                  />
                </div>
                
                <div>
                  <label className="block text-zinc-300 text-sm font-medium mb-1">
                    What will they learn?
                  </label>
                  <input
                    type="text"
                    value={theyWillLearn}
                    onChange={(e) => setTheyWillLearn(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Skills you can teach them..."
                  />
                </div>
                
                <div>
                  <label className="block text-zinc-300 text-sm font-medium mb-1">
                    Personal message (optional)
                  </label>
                  <textarea
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="Add a personal message..."
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <motion.button
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition-colors mr-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={submitConnectionRequest}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading || !iWillLearn || !theyWillLearn}
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-2 inline-block"
                      >
                        <FiRefreshCw size={14} />
                      </motion.div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FiUserPlus className="mr-2 inline-block" />
                      Send Request
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Connections;
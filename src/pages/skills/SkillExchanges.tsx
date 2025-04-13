import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiArrowLeft, FiLogOut, FiRefreshCw, FiCheck, FiX, 
  FiInfo, FiMessageSquare, FiStar, FiClock, FiAward, 
  FiCalendar, FiUser, FiBook
} from 'react-icons/fi';
import RatingComponent from '../../components/shared/RatingComponent';
import { 
  getUserSkillExchanges, 
  rateSkillExchange, 
  updateSkillExchangeStatus,
  getUserDetailsById,
  getUserById
} from '../../services/firestore';

const SkillExchanges = () => {
  const { userData, signOut } = useAuth();
  const navigate = useNavigate();
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'teaching' | 'learning'>('teaching');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (!userData) return;
    fetchExchanges();
  }, [userData, activeTab, activeFilter]);

  const fetchExchanges = async () => {
    if (!userData) return;
    
    setLoading(true);
    try {
      const role = activeTab === 'teaching' ? 'teacher' : 'student';
      const fetchedExchanges = await getUserSkillExchanges(userData.id, role, activeFilter);
      
      // Fetch user details for each exchange
      const exchangesWithDetails = await Promise.all(
        fetchedExchanges.map(async (exchange) => {
          const partnerId = activeTab === 'teaching' ? exchange.studentId : exchange.teacherId;
          const partnerData = await getUserDetailsById(partnerId);
          
          // Get skill details
          const exchangeCreator = await getUserById(exchange.teacherId);
          const skill = exchangeCreator?.skills?.find((s: any) => s.id === exchange.skillId);
          
          return {
            ...exchange,
            partner: partnerData,
            skillDetails: skill || { name: 'Unknown Skill' },
            exchangeDetails: exchange.exchangeDetails
          };
        })
      );
      
      setExchanges(exchangesWithDetails);
    } catch (error) {
      console.error('Error fetching exchanges:', error);
      showNotification('error', 'Failed to load skill exchanges. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (exchangeId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      await updateSkillExchangeStatus(exchangeId, newStatus);
      
      if (newStatus === 'completed' && activeTab === 'learning') {
        // Open rating modal for students when marking completed
        const exchange = exchanges.find(ex => ex.id === exchangeId);
        if (exchange) {
          setSelectedExchange(exchange);
          setIsRatingModalOpen(true);
        }
      } else {
        // Just refresh the list
        fetchExchanges();
      }
      
      showNotification('success', `Exchange status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('error', 'Failed to update status. Please try again.');
    }
  };

  const handleSubmitRating = async () => {
    if (!selectedExchange) return;
    
    try {
      await rateSkillExchange(selectedExchange.id, rating, feedback);
      setIsRatingModalOpen(false);
      setRating(0);
      setFeedback('');
      fetchExchanges();
      showNotification('success', 'Rating submitted successfully!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      showNotification('error', 'Failed to submit rating. Please try again.');
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

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({
      show: true,
      message,
      type
    });
    
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400';
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-zinc-500/20 text-zinc-400';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Not specified';
    
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000) 
      : new Date(timestamp);
      
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-950"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with navigation */}
        <div className="mb-6 flex justify-between items-center">
          <motion.button
            onClick={() => navigate('/skills')}
            className="flex items-center px-4 py-2 bg-zinc-800/50 text-zinc-400 rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiArrowLeft className="mr-2" />
            Back to Skills
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

        {/* Content container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-800/50 overflow-hidden"
        >
          {/* Page title and tabs */}
          <div className="p-6 border-b border-zinc-800/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <h1 className="text-2xl font-bold text-white flex items-center">
                <FiAward className="mr-3 text-primary-500" />
                Skill Exchanges
              </h1>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('teaching')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'teaching'
                      ? 'bg-primary-600 text-white'
                      : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white'
                  }`}
                >
                  Teaching
                </button>
                <button
                  onClick={() => setActiveTab('learning')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'learning'
                      ? 'bg-primary-600 text-white'
                      : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white'
                  }`}
                >
                  Learning
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-zinc-800/50 flex flex-wrap gap-2">
            {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter as any)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors capitalize ${
                  activeFilter === filter
                    ? 'bg-primary-600/30 text-primary-400 border border-primary-600/50'
                    : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/50 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Exchanges list */}
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <FiRefreshCw className="text-primary-500" size={30} />
                </motion.div>
                <p className="mt-3 text-zinc-400">Loading skill exchanges...</p>
              </div>
            ) : exchanges.length === 0 ? (
              <div className="text-center py-12">
                <FiInfo className="mx-auto h-12 w-12 text-zinc-600" />
                <p className="mt-4 text-zinc-400">
                  {activeTab === 'teaching' 
                    ? "You're not teaching anyone yet." 
                    : "You're not learning from anyone yet."}
                </p>
                <button
                  onClick={() => navigate('/connections')}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
                >
                  Find connections
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {exchanges.map((exchange) => (
                  <motion.div
                    key={exchange.id}
                    className="bg-zinc-800/50 p-5 rounded-xl border border-zinc-700/50"
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-500/20 flex items-center justify-center text-lg font-bold text-white mr-3">
                          {exchange.partner?.displayName?.charAt(0).toUpperCase() || <FiUser />}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <h3 className="text-white font-medium mr-2">{exchange.partner?.displayName}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(exchange.status)}`}>
                              {exchange.status}
                            </span>
                          </div>
                          <p className="text-zinc-400 text-sm">
                            {activeTab === 'teaching' ? 'Student' : 'Teacher'} • {exchange.skillDetails.name}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 items-center">
                        {exchange.status === 'pending' && (
                          <>
                            <motion.button
                              onClick={() => handleStatusChange(exchange.id, 'in_progress')}
                              className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-600/30 hover:bg-blue-600/30 transition-colors flex items-center text-sm"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FiClock className="mr-1" size={14} />
                              Start
                            </motion.button>
                            <motion.button
                              onClick={() => handleStatusChange(exchange.id, 'cancelled')}
                              className="px-3 py-1 bg-red-600/20 text-red-400 rounded-lg border border-red-600/30 hover:bg-red-600/30 transition-colors flex items-center text-sm"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FiX className="mr-1" size={14} />
                              Cancel
                            </motion.button>
                          </>
                        )}
                        
                        {exchange.status === 'in_progress' && (
                          <motion.button
                            onClick={() => handleStatusChange(exchange.id, 'completed')}
                            className="px-3 py-1 bg-green-600/20 text-green-400 rounded-lg border border-green-600/30 hover:bg-green-600/30 transition-colors flex items-center text-sm"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FiCheck className="mr-1" size={14} />
                            Complete
                          </motion.button>
                        )}
                        
                        <motion.button
                          onClick={() => navigate(`/chat/${exchange.chatId || '123'}`)}
                          className="px-3 py-1 bg-zinc-700/50 text-white rounded-lg hover:bg-zinc-600/50 transition-colors flex items-center text-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FiMessageSquare className="mr-1" size={14} />
                          Message
                        </motion.button>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {exchange.exchangeDetails && (
                        <>
                          <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                            <div className="flex items-center text-zinc-400 mb-1">
                              <FiBook className="mr-1" size={14} />
                              <span>{activeTab === 'teaching' ? 'They Will Learn' : 'You Will Learn'}</span>
                            </div>
                            <span className="text-white">
                              {activeTab === 'teaching' 
                                ? exchange.exchangeDetails.recipientWillLearn || 'Not specified'
                                : exchange.exchangeDetails.requesterWillLearn || 'Not specified'}
                            </span>
                          </div>
                          
                          <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                            <div className="flex items-center text-zinc-400 mb-1">
                              <FiBook className="mr-1" size={14} />
                              <span>{activeTab === 'teaching' ? 'You Will Teach' : 'They Will Teach'}</span>
                            </div>
                            <span className="text-white">
                              {activeTab === 'teaching'
                                ? exchange.exchangeDetails.requesterWillLearn || 'Not specified'
                                : exchange.exchangeDetails.recipientWillLearn || 'Not specified'}
                            </span>
                          </div>
                        </>
                      )}
                      
                      <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                        <div className="flex items-center text-zinc-400 mb-1">
                          <FiCalendar className="mr-1" size={14} />
                          <span>Start Date</span>
                        </div>
                        <span className="text-white">{formatDate(exchange.startDate)}</span>
                      </div>
                      
                      {exchange.status === 'completed' && (
                        <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                          <div className="flex items-center text-zinc-400 mb-1">
                            <FiCalendar className="mr-1" size={14} />
                            <span>End Date</span>
                          </div>
                          <span className="text-white">{formatDate(exchange.endDate)}</span>
                        </div>
                      )}
                      
                      {exchange.rating && activeTab === 'teaching' && (
                        <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                          <div className="flex items-center text-zinc-400 mb-1">
                            <FiStar className="mr-1" size={14} />
                            <span>Rating</span>
                          </div>
                          <div className="text-white">
                            <RatingComponent initialRating={exchange.rating} readOnly size="sm" />
                          </div>
                        </div>
                      )}
                      
                      {exchange.feedback && (
                        <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50 md:col-span-3">
                          <div className="flex items-center text-zinc-400 mb-1">
                            <FiInfo className="mr-1" size={14} />
                            <span>Feedback</span>
                          </div>
                          <span className="text-white">{exchange.feedback}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Rating modal */}
      <AnimatePresence>
        {isRatingModalOpen && selectedExchange && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setIsRatingModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Rate your experience</h2>
                <button
                  onClick={() => setIsRatingModalOpen(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-zinc-400 mb-4">
                  How would you rate your learning experience with {selectedExchange.partner?.displayName}?
                </p>
                
                <div className="flex justify-center my-6">
                  <RatingComponent 
                    initialRating={rating} 
                    onChange={setRating}
                    size="lg"
                  />
                </div>
                
                <div className="mt-4">
                  <label className="block text-zinc-400 mb-2">Feedback (optional)</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Share your experience..."
                    rows={4}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <motion.button
                  onClick={handleSubmitRating}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={rating === 0}
                >
                  <FiStar className="mr-2" />
                  Submit Rating
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification toast */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 p-4 rounded-lg shadow-lg flex items-start ${
              notification.type === 'success' ? 'bg-green-500/90' :
              notification.type === 'error' ? 'bg-red-500/90' :
              'bg-blue-500/90'
            } backdrop-blur-sm max-w-md`}
          >
            <div className="flex-shrink-0 mr-3 mt-0.5">
              {notification.type === 'success' ? <FiCheck className="text-white" /> :
              notification.type === 'error' ? <FiX className="text-white" /> :
              <FiInfo className="text-white" />}
            </div>
            <div className="flex-1">
              <p className="text-white">{notification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SkillExchanges; 
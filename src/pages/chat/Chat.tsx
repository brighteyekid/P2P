import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSend, FiArrowLeft, FiLogOut, FiMessageSquare, 
  FiRefreshCw, FiCheck, FiAlertCircle, FiInfo, 
  FiX, FiTarget
} from 'react-icons/fi';
import { 
  getChatMessages, sendMessage, markMessagesAsRead, 
  getSkillProgress, updateSkillProgress, getUserDetailsById,
  getChatById
} from '../../services/firestore';
import { Message, SkillProgress, User } from '../../types';

const Chat = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { userData, signOut } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [partnerUser, setPartnerUser] = useState<User | null>(null);
  const [skillProgress, setSkillProgress] = useState<SkillProgress | null>(null);
  const [progressUpdating, setProgressUpdating] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'info' });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetch chat messages on component mount
  useEffect(() => {
    if (!chatId || !userData) return;
    
    const fetchChatData = async () => {
      try {
        setLoading(true);
        
        // Fetch chat messages
        const chatMessages = await getChatMessages(chatId);
        setMessages(chatMessages);
        
        // Mark messages as read
        await markMessagesAsRead(chatId, userData.id);
        
        // Get the chat document
        const chatDocument = await getChatById(chatId);
        
        if (!chatDocument) {
          throw new Error('Chat not found');
        }
        
        // Find the partner's ID (the participant who is not the current user)
        const otherParticipantId = chatDocument.participants.find(
          id => id !== userData.id
        );
        
        // Fetch partner user details if available
        if (otherParticipantId) {
          const partnerData = await getUserDetailsById(otherParticipantId);
          setPartnerUser(partnerData);
        }
        
        // Check if this chat has an associated skill exchange
        if (chatDocument.skillExchangeId) {
          const progress = await getSkillProgress(chatDocument.skillExchangeId);
          setSkillProgress(progress);
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
        showNotification('Failed to load messages. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChatData();
    
    // Set up real-time listener for new messages
    // This is a placeholder for your actual real-time implementation
    const messageInterval = setInterval(() => {
      getChatMessages(chatId).then(latestMessages => {
        if (latestMessages.length > messages.length) {
          setMessages(latestMessages);
          markMessagesAsRead(chatId, userData.id);
        }
      });
    }, 10000);
    
    return () => {
      clearInterval(messageInterval);
      // Unsubscribe from real-time listener if needed
    };
  }, [chatId, userData]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !userData || !chatId) return;
    
    try {
      setSending(true);
      await sendMessage(chatId, userData.id, messageText);
      setMessageText('');
      
      // For better UX, we optimistically add the message to the UI
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        chatId,
        senderId: userData.id,
        content: messageText,
        timestamp: new Date(),
        read: false
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification('Failed to send message. Please try again.', 'error');
    } finally {
      setSending(false);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({
      show: true,
      message,
      type
    });
    
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const msgDate = new Date(timestamp);
    
    // Same day
    if (msgDate.toDateString() === now.toDateString()) {
      return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // This week
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    if (msgDate > oneWeekAgo) {
      return msgDate.toLocaleDateString([], { weekday: 'short' }) + ' ' + 
        msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Older
    return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
      msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleToggleMilestone = async (milestoneId: string, completed: boolean) => {
    if (!skillProgress) return;
    
    try {
      setProgressUpdating(true);
      
      // Find the milestone and update its completed status
      const updatedMilestones = skillProgress.milestones.map(milestone => 
        milestone.id === milestoneId 
          ? { ...milestone, completed, completedAt: completed ? new Date() : undefined } 
          : milestone
      );
      
      // Update the skill progress
      await updateSkillProgress(skillProgress.id, { milestones: updatedMilestones });
      
      // Update the local state
      setSkillProgress(prev => prev ? {
        ...prev,
        milestones: updatedMilestones,
        progressPercentage: Math.round(
          (updatedMilestones.filter(m => m.completed).length / updatedMilestones.length) * 100
        )
      } : null);
      
      // If all milestones are completed, show a celebration message
      const allCompleted = updatedMilestones.every(m => m.completed);
      if (allCompleted) {
        showNotification('🎉 Congratulations! All milestones completed!', 'success');
        
        // Send a message to the chat about the completion
        await sendMessage(
          chatId!,
          userData!.id,
          '🎉 All learning milestones have been completed! Great job!'
        );
      } else {
        showNotification(
          completed ? 'Milestone marked as completed!' : 'Milestone marked as incomplete.',
          'success'
        );
        
        // Send a message to the chat about the milestone
        const milestone = skillProgress.milestones.find(m => m.id === milestoneId);
        if (milestone) {
          await sendMessage(
            chatId!,
            userData!.id,
            `${completed ? '✅' : '⏱️'} Milestone "${milestone.title}" ${completed ? 'completed' : 'marked as in progress'}.`
          );
        }
      }
    } catch (error) {
      console.error('Error updating milestone:', error);
      showNotification('Failed to update milestone. Please try again.', 'error');
    } finally {
      setProgressUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-950"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with navigation */}
        <div className="mb-6 flex justify-between items-center">
          <motion.button
            onClick={() => navigate('/connections')}
            className="flex items-center px-4 py-2 bg-zinc-800/50 text-zinc-400 rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiArrowLeft className="mr-2" />
            Back to Connections
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

        {/* Chat container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-800/50 overflow-hidden"
        >
          {/* Chat header */}
          <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-primary-500/20 flex items-center justify-center text-lg font-bold text-white mr-3">
                {partnerUser?.displayName?.charAt(0).toUpperCase() || <FiMessageSquare />}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {partnerUser?.displayName || 'Chat'}
                </h1>
                {partnerUser?.lastActive && (
                  <p className="text-zinc-400 text-sm">
                    Last active {new Date(partnerUser.lastActive).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            
            {skillProgress && (
              <motion.button
                onClick={() => setShowProgressModal(true)}
                className="flex items-center px-4 py-2 bg-primary-600/20 text-primary-400 rounded-lg hover:bg-primary-600/30 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiTarget className="mr-2" />
                <span className="mr-2">Progress: {skillProgress.progressPercentage}%</span>
                <div className="w-16 h-2 bg-zinc-700 rounded-full">
                  <div 
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${skillProgress.progressPercentage}%` }}
                  />
                </div>
              </motion.button>
            )}
          </div>

          {/* Messages area */}
          <div 
            className="p-6 h-[calc(100vh-350px)] overflow-y-auto"
            ref={messagesContainerRef}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <FiRefreshCw className="text-primary-500" size={30} />
                </motion.div>
                <p className="mt-3 text-zinc-400">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <FiMessageSquare className="mx-auto h-12 w-12 text-zinc-600" />
                <p className="mt-4 text-zinc-400">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const isUserMessage = message.senderId === userData?.id;
                  const showDate = index === 0 || 
                    new Date(message.timestamp).toDateString() !== 
                    new Date(messages[index - 1].timestamp).toDateString();
                  
                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <div className="px-3 py-1 rounded-full bg-zinc-800/50 text-zinc-400 text-xs">
                            {new Date(message.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                      
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            isUserMessage 
                              ? 'bg-primary-600 text-white rounded-tr-none' 
                              : 'bg-zinc-800 text-zinc-100 rounded-tl-none'
                          }`}
                        >
                          <div className="flex flex-col">
                            <div className="text-sm break-words whitespace-pre-wrap">
                              {message.content}
                            </div>
                            <div className={`text-xs mt-1 flex items-center ${
                              isUserMessage ? 'text-primary-200 justify-end' : 'text-zinc-400'
                            }`}>
                              {formatTimestamp(message.timestamp)}
                              {isUserMessage && message.read && (
                                <FiCheck className="ml-1 text-primary-200" size={12} />
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message input area */}
          <div className="p-4 border-t border-zinc-800/50">
            <div className="flex items-end">
              <textarea
                className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 h-14 max-h-32"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                rows={1}
              />
              <motion.button
                onClick={handleSendMessage}
                className={`ml-2 p-3 bg-primary-600 text-white rounded-lg transition-colors ${
                  !messageText.trim() || sending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-500'
                }`}
                whileHover={messageText.trim() && !sending ? { scale: 1.05 } : undefined}
                whileTap={messageText.trim() && !sending ? { scale: 0.95 } : undefined}
                disabled={!messageText.trim() || sending}
              >
                {sending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <FiRefreshCw size={20} />
                  </motion.div>
                ) : (
                  <FiSend size={20} />
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Progress Modal */}
      <AnimatePresence>
        {showProgressModal && skillProgress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowProgressModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Skill Progress</h2>
                <button
                  onClick={() => setShowProgressModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Overall Progress</span>
                  <span className="text-white font-medium">{skillProgress.progressPercentage}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full mt-2">
                  <div 
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${skillProgress.progressPercentage}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-3 my-4">
                <h3 className="text-zinc-300 font-medium">Milestones</h3>
                
                {skillProgress.milestones.map((milestone) => (
                  <div 
                    key={milestone.id}
                    className="bg-zinc-800/50 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center border ${
                        milestone.completed 
                          ? 'bg-green-600/20 border-green-600 text-green-500' 
                          : 'bg-zinc-700/20 border-zinc-700 text-zinc-500'
                      }`}>
                        {milestone.completed && <FiCheck size={16} />}
                      </div>
                      <div className="ml-3">
                        <p className={`text-sm ${milestone.completed ? 'text-white' : 'text-zinc-300'}`}>
                          {milestone.title}
                        </p>
                        {milestone.completedAt && (
                          <p className="text-xs text-zinc-500">
                            Completed on {new Date(milestone.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleToggleMilestone(milestone.id, !milestone.completed)}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        milestone.completed
                          ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                          : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                      } transition-colors`}
                      disabled={progressUpdating}
                    >
                      {progressUpdating ? (
                        <FiRefreshCw className="animate-spin" />
                      ) : milestone.completed ? (
                        'Mark Incomplete'
                      ) : (
                        'Mark Complete'
                      )}
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <textarea
                  placeholder="Add notes about progress..."
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={skillProgress.notes}
                  onChange={(e) => setSkillProgress(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  rows={3}
                />
                
                <div className="flex justify-end mt-4">
                  <button
                    onClick={async () => {
                      if (!skillProgress) return;
                      
                      try {
                        setProgressUpdating(true);
                        await updateSkillProgress(skillProgress.id, { notes: skillProgress.notes });
                        showNotification('Progress notes updated', 'success');
                      } catch (error) {
                        console.error('Error updating notes:', error);
                        showNotification('Failed to update notes', 'error');
                      } finally {
                        setProgressUpdating(false);
                      }
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
                    disabled={progressUpdating}
                  >
                    {progressUpdating ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
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
              notification.type === 'error' ? <FiAlertCircle className="text-white" /> :
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

export default Chat; 
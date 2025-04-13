import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  FiMessageSquare, FiArrowLeft, FiLogOut, FiPlus, 
  FiRefreshCw, FiSearch, FiCheck, FiClock, FiUser
} from 'react-icons/fi';
import { getUserChats, getUserDetailsById } from '../../services/firestore';
import { Chat, User } from '../../types';

const ChatList = () => {
  const { userData, signOut } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatUsers, setChatUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user's chats on component mount
  useEffect(() => {
    if (!userData) return;
    
    const fetchChats = async () => {
      try {
        setLoading(true);
        const userChats = await getUserChats(userData.id);
        
        // Sort chats by most recent activity
        userChats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        
        setChats(userChats);
        
        // Fetch all user details for participants in chats
        const usersToFetch = new Set<string>();
        
        userChats.forEach(chat => {
          chat.participants.forEach(participantId => {
            if (participantId !== userData.id) {
              usersToFetch.add(participantId);
            }
          });
        });
        
        const userPromises = Array.from(usersToFetch).map(async userId => {
          const user = await getUserDetailsById(userId);
          return { userId, user };
        });
        
        const userResults = await Promise.all(userPromises);
        
        const userMap: Record<string, User> = {};
        userResults.forEach(result => {
          if (result.user) {
            userMap[result.userId] = result.user;
          }
        });
        
        setChatUsers(userMap);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChats();
  }, [userData]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getChatTitle = (chat: Chat): string => {
    // If the chat has a title, use it
    if (chat.title) return chat.title;
    
    // Otherwise, use the name of the other participant
    const otherParticipantId = chat.participants.find(id => id !== userData?.id);
    
    if (otherParticipantId && chatUsers[otherParticipantId]) {
      return chatUsers[otherParticipantId].displayName;
    }
    
    return 'Unnamed Chat';
  };

  const formatLastActive = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than a minute
    if (diff < 60 * 1000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    
    // Otherwise, show the date
    return date.toLocaleDateString();
  };

  const filteredChats = searchQuery
    ? chats.filter(chat => {
        const title = getChatTitle(chat).toLowerCase();
        const lastMessage = chat.lastMessage?.content.toLowerCase() || '';
        return title.includes(searchQuery.toLowerCase()) || 
               lastMessage.includes(searchQuery.toLowerCase());
      })
    : chats;

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

        {/* Chat list container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-800/50 overflow-hidden"
        >
          {/* Chat list header */}
          <div className="p-6 border-b border-zinc-800/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <h1 className="text-2xl font-bold text-white flex items-center">
                <FiMessageSquare className="mr-3 text-primary-500" />
                Conversations
              </h1>
              
              <motion.button
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiPlus className="mr-2" />
                New Chat
              </motion.button>
            </div>
          </div>

          {/* Search bar */}
          <div className="p-4 border-b border-zinc-800/50">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Chat list */}
          <div className="p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <FiRefreshCw className="text-primary-500" size={30} />
                </motion.div>
                <p className="mt-3 text-zinc-400">Loading conversations...</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-12">
                <FiMessageSquare className="mx-auto h-12 w-12 text-zinc-600" />
                <p className="mt-4 text-zinc-400">
                  {searchQuery 
                    ? 'No conversations match your search.' 
                    : 'No conversations yet. Start chatting!'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredChats.map(chat => {
                  const otherParticipantId = chat.participants.find(id => id !== userData?.id);
                  const otherUser = otherParticipantId ? chatUsers[otherParticipantId] : null;
                  
                  return (
                    <motion.div
                      key={chat.id}
                      className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:bg-zinc-800 cursor-pointer transition-colors"
                      whileHover={{ scale: 1.01 }}
                      onClick={() => navigate(`/chat/${chat.id}`)}
                    >
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-primary-500/20 flex items-center justify-center text-lg font-bold text-white mr-3">
                          {otherUser?.displayName?.charAt(0).toUpperCase() || <FiUser />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="text-white font-medium truncate">{getChatTitle(chat)}</h3>
                            {chat.lastMessage && (
                              <span className="text-xs text-zinc-400 ml-2 flex-shrink-0">
                                {formatLastActive(chat.updatedAt)}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center text-sm text-zinc-400 mt-1">
                            {chat.lastMessage ? (
                              <>
                                <span className="truncate">
                                  {chat.lastMessage.senderId === userData?.id ? 'You: ' : ''}
                                  {chat.lastMessage.content}
                                </span>
                                {chat.lastMessage.senderId !== userData?.id && (
                                  <FiCheck className="ml-1 text-primary-500" size={14} />
                                )}
                              </>
                            ) : (
                              <span className="text-zinc-500 flex items-center">
                                <FiClock className="mr-1" size={14} />
                                No messages yet
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ChatList; 
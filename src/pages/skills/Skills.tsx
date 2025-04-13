import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiSearch, FiX, FiArrowLeft, FiLogOut, 
  FiTag, FiEdit, FiTrash2,
  FiSliders, FiBookOpen, FiCode,
  FiUsers, FiMessageSquare, FiMusic, FiBriefcase, FiGrid,
  FiRefreshCw, FiCheck, FiInfo
} from 'react-icons/fi';
import { Skill, SkillLevel } from '../../types';
import { createActivity } from '../../services/firestore';
import SkillForm from '../../components/skills/SkillForm';

const skillCategories = [
  { id: 'technical', name: 'Technical Skills', description: 'Programming, software, hardware skills', icon: FiCode },
  { id: 'soft', name: 'Soft Skills', description: 'Communication, leadership, teamwork', icon: FiUsers },
  { id: 'language', name: 'Language Skills', description: 'Foreign languages, sign language', icon: FiMessageSquare },
  { id: 'artistic', name: 'Artistic Skills', description: 'Visual arts, music, performance', icon: FiMusic },
  { id: 'business', name: 'Business Skills', description: 'Marketing, finance, entrepreneurship', icon: FiBriefcase },
  { id: 'other', name: 'Other Skills', description: 'Skills that don\'t fit other categories', icon: FiGrid },
];

const skillLevels: SkillLevel[] = ['Beginner', 'Intermediate', 'Expert'];

const levelColors = {
  'Beginner': 'text-blue-400',
  'Intermediate': 'text-yellow-400',
  'Expert': 'text-green-400'
};

const Skills = () => {
  const { userData, updateUserProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'mySkills' | 'desiredSkills'>('mySkills');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isEditingSkill, setIsEditingSkill] = useState<Skill | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: number;
    type: 'success' | 'error' | 'info';
    message: string;
  }>>([]);

  // Display a notification
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now();
    setNotifications([...notifications, { id, type, message }]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(current => current.filter(notification => notification.id !== id));
    }, 5000);
  };
  
  // Remove a notification
  const removeNotification = (id: number) => {
    setNotifications(current => current.filter(notification => notification.id !== id));
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleAddSkill = async (newSkill: Partial<Skill>) => {
    if (!newSkill.name || !newSkill.category || !userData) return;

    try {
      setIsLoading(true);
      
      // Create skill object
      const skill: Skill = {
        id: Date.now().toString(), // Will be replaced by Firestore-generated ID for new skills
        name: newSkill.name,
        category: newSkill.category,
        level: newSkill.level as SkillLevel,
        tags: newSkill.tags || [],
        userId: userData.id,
      };

      const skillsArray = activeTab === 'mySkills' ? 
        [...(userData.skills || [])] : 
        [...(userData.desiredSkills || [])];

      // Add to the local array
      skillsArray.push(skill);

      // Update user profile in Firestore
      if (activeTab === 'mySkills') {
        await updateUserProfile({ skills: skillsArray });
        
        // Create an activity record
        await createActivity({
          type: 'skill_added',
          userId: userData.id,
          description: `Added new skill: ${skill.name}`,
          timestamp: new Date(),
          relatedSkillId: skill.id
        });
      } else {
        await updateUserProfile({ desiredSkills: skillsArray });
        
        // Create an activity record for desired skill
        await createActivity({
          type: 'skill_added',
          userId: userData.id,
          description: `Added new desired skill: ${skill.name}`,
          timestamp: new Date(),
          relatedSkillId: skill.id
        });
      }

      // Reset form and close modal
      setIsAddingSkill(false);
      showNotification('success', `${activeTab === 'mySkills' ? 'Skill' : 'Desired skill'} "${skill.name}" added successfully!`);
    } catch (error) {
      console.error('Error adding skill:', error);
      showNotification('error', 'An error occurred while adding the skill. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSkill = async (updatedSkill: Partial<Skill>) => {
    if (!updatedSkill.name || !updatedSkill.category || !isEditingSkill || !userData) return;

    try {
      setIsLoading(true);
      
      const skillsArray = activeTab === 'mySkills' ? 
        [...(userData.skills || [])] : 
        [...(userData.desiredSkills || [])];

      // Update the skills array
      const updatedSkills = skillsArray.map(skill => 
        skill.id === isEditingSkill.id ? {...skill, ...updatedSkill} : skill
      );

      // Update in Firestore
      if (activeTab === 'mySkills') {
        await updateUserProfile({ skills: updatedSkills });
        
        // Create activity record for the update
        await createActivity({
          type: 'skill_added', // Using same type, but it's an update
          userId: userData.id,
          description: `Updated skill: ${updatedSkill.name}`,
          timestamp: new Date(),
          relatedSkillId: isEditingSkill.id
        });
      } else {
        await updateUserProfile({ desiredSkills: updatedSkills });
      }

      // Reset form
      setIsEditingSkill(null);
      showNotification('success', `${activeTab === 'mySkills' ? 'Skill' : 'Desired skill'} "${updatedSkill.name}" updated successfully!`);
    } catch (error) {
      console.error('Error updating skill:', error);
      showNotification('error', 'An error occurred while updating the skill. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!userData) return;
    
    try {
      setIsLoading(true);
      
      const skillsArray = activeTab === 'mySkills' ? 
        [...(userData.skills || [])] : 
        [...(userData.desiredSkills || [])];
      
      // Find the skill to be removed (for activity logging)
      const skillToRemove = skillsArray.find(skill => skill.id === skillId);
      if (!skillToRemove) return;
      
      // Filter out the deleted skill
      const updatedSkills = skillsArray.filter(skill => skill.id !== skillId);

      // Update in Firestore
      if (activeTab === 'mySkills') {
        await updateUserProfile({ skills: updatedSkills });
        
        // Log activity for skill removal
        await createActivity({
          type: 'skill_added', // Reusing the type, but it's a removal
          userId: userData.id,
          description: `Removed skill: ${skillToRemove.name}`,
          timestamp: new Date(),
          relatedSkillId: skillId
        });
      } else {
        await updateUserProfile({ desiredSkills: updatedSkills });
      }
      showNotification('success', `${activeTab === 'mySkills' ? 'Skill' : 'Desired skill'} "${skillToRemove.name}" removed successfully!`);
    } catch (error) {
      console.error('Error deleting skill:', error);
      showNotification('error', 'An error occurred while deleting the skill. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredSkills = () => {
    const skillsArray = activeTab === 'mySkills' ? 
      (userData?.skills || []) : 
      (userData?.desiredSkills || []);

    return skillsArray.filter(skill => {
      // Apply search filter
      const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          skill.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Apply category filter
      const matchesCategory = !selectedCategory || skill.category === selectedCategory;
      
      // Apply level filter
      const matchesLevel = !selectedLevel || skill.level === selectedLevel;
      
      return matchesSearch && matchesCategory && matchesLevel;
    });
  };

  const filteredSkills = getFilteredSkills();

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedLevel(null);
    setSearchQuery('');
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-800/50 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-800/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <motion.button
                  onClick={() => navigate('/')}
                  className="flex items-center px-4 py-2 bg-zinc-800/50 text-zinc-400 rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                >
                  <FiArrowLeft className="mr-2" />
                  Back
                </motion.button>
                <h1 className="text-2xl font-bold text-white">Skills Management</h1>
              </div>
              <div className="flex items-center space-x-4">
                <motion.button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 bg-zinc-800/50 text-zinc-400 rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                >
                  <FiLogOut className="mr-2" />
                  Logout
                </motion.button>
                <motion.button
                  onClick={() => setIsAddingSkill(true)}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                >
                  <FiPlus className="mr-2" />
                  Add {activeTab === 'mySkills' ? 'Skill' : 'Desired Skill'}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Search and Tabs */}
          <div className="p-6 border-b border-zinc-800/50">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search skills or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isLoading}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('mySkills')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'mySkills'
                      ? 'bg-primary-600 text-white'
                      : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white'
                  }`}
                  disabled={isLoading}
                >
                  My Skills
                </button>
                <button
                  onClick={() => setActiveTab('desiredSkills')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'desiredSkills'
                      ? 'bg-primary-600 text-white'
                      : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white'
                  }`}
                  disabled={isLoading}
                >
                  Desired Skills
                </button>
                <motion.button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 rounded-lg bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white transition-colors flex items-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                >
                  <FiSliders className="mr-2" />
                  Filters
                  {(selectedCategory || selectedLevel) && (
                    <span className="ml-2 bg-primary-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {(selectedCategory ? 1 : 0) + (selectedLevel ? 1 : 0)}
                    </span>
                  )}
                </motion.button>
              </div>
            </div>
            
            {/* Display loading indicator if loading */}
            {isLoading && (
              <div className="mt-4 flex items-center justify-center py-2 bg-primary-500/10 text-primary-500 rounded-md">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  <FiRefreshCw />
                </motion.div>
                <span>Loading...</span>
              </div>
            )}
            
            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden mt-4"
                >
                  <div className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-700/50 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Category filter */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">
                        Category
                      </label>
                      <select
                        value={selectedCategory || ''}
                        onChange={(e) => setSelectedCategory(e.target.value || null)}
                        className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">All Categories</option>
                        {skillCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Level filter */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">
                        Proficiency Level
                      </label>
                      <select
                        value={selectedLevel || ''}
                        onChange={(e) => setSelectedLevel(e.target.value as SkillLevel || null)}
                        className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">All Levels</option>
                        {skillLevels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Reset filters */}
                    <div className="flex items-end">
                      <motion.button
                        onClick={resetFilters}
                        className="w-full px-4 py-2 bg-zinc-700/50 text-zinc-300 rounded-lg hover:bg-zinc-600/50 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Reset Filters
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Add/Edit Skill Modal using SkillForm */}
          <AnimatePresence>
            {isAddingSkill && (
              <SkillForm
                mode="add"
                type={activeTab === 'mySkills' ? 'skill' : 'desiredSkill'}
                onSubmit={handleAddSkill}
                onCancel={() => setIsAddingSkill(false)}
                isLoading={isLoading}
              />
            )}
            {isEditingSkill && (
              <SkillForm
                mode="edit"
                type={activeTab === 'mySkills' ? 'skill' : 'desiredSkill'}
                initialSkill={isEditingSkill}
                onSubmit={handleUpdateSkill}
                onCancel={() => setIsEditingSkill(null)}
                isLoading={isLoading}
              />
            )}
          </AnimatePresence>

          {/* Skills List */}
          <div className="p-6">
            {filteredSkills.length === 0 ? (
              <div className="text-center py-12">
                <motion.div 
                  className="w-16 h-16 mx-auto bg-zinc-800/50 rounded-full flex items-center justify-center mb-4"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                >
                  <FiBookOpen className="text-primary-500" size={24} />
                </motion.div>
                <h3 className="text-xl font-medium text-white mb-2">No skills found</h3>
                <p className="text-zinc-400 mb-6">
                  {searchQuery || selectedCategory || selectedLevel
                    ? "Try adjusting your filters or search terms"
                    : `You haven't added any ${
                        activeTab === 'mySkills' ? 'skills' : 'desired skills'
                      } yet`}
                </p>
                {(searchQuery || selectedCategory || selectedLevel) ? (
                  <motion.button
                    onClick={resetFilters}
                    className="px-4 py-2 bg-zinc-800/50 text-zinc-300 rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors inline-flex items-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiX className="mr-2" />
                    Clear Filters
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={() => setIsAddingSkill(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors inline-flex items-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiPlus className="mr-2" />
                    Add Your First {activeTab === 'mySkills' ? 'Skill' : 'Desired Skill'}
                  </motion.button>
                )}
              </div>
            ) : (
              <div>
                {/* Group by category */}
                {skillCategories.map((category) => {
                  const categorySkills = filteredSkills.filter(
                    (skill) => skill.category === category.id
                  );

                  if (categorySkills.length === 0) return null;

                  const CategoryIcon = category.icon;

                  return (
                    <div key={category.id} className="mb-8">
                      <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <CategoryIcon className="mr-2 text-primary-500" size={18} />
                        {category.name}
                        <span className="ml-2 text-sm bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                          {categorySkills.length}
                        </span>
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categorySkills.map((skill) => (
                          <motion.div
                            key={skill.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 relative group"
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-medium text-white">{skill.name}</h3>
                                <p className={`text-sm ${levelColors[skill.level]}`}>
                                  {skill.level}
                                </p>
                              </div>
                              <div className="flex space-x-1">
                                <motion.button
                                  onClick={() => setIsEditingSkill(skill)}
                                  className="p-1.5 bg-zinc-700/50 text-zinc-400 rounded-lg hover:bg-zinc-700 hover:text-white"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <FiEdit size={16} />
                                </motion.button>
                                <motion.button
                                  onClick={() => handleDeleteSkill(skill.id)}
                                  className="p-1.5 bg-zinc-700/50 text-zinc-400 rounded-lg hover:bg-red-600/20 hover:text-red-500"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <FiTrash2 size={16} />
                                </motion.button>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {skill.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 bg-zinc-700/50 text-zinc-300 rounded-md text-xs flex items-center"
                                >
                                  <FiTag className="mr-1 text-zinc-500" size={10} />
                                  {tag}
                                </span>
                              ))}
                              {skill.tags.length === 0 && (
                                <span className="text-xs text-zinc-500">No tags</span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                notification.type === 'error' ? <FiX className="text-white" /> :
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
    </motion.div>
  );
};

export default Skills; 
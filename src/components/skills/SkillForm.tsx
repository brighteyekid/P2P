import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiTag, FiStar, FiRefreshCw, FiCheck, FiHelpCircle
} from 'react-icons/fi';
import { Skill, SkillLevel } from '../../types';

// Import the same categories and levels used in Skills.tsx
const skillCategories = [
  { id: 'technical', name: 'Technical Skills', description: 'Programming, software, hardware skills', icon: FiCheck },
  { id: 'soft', name: 'Soft Skills', description: 'Communication, leadership, teamwork', icon: FiCheck },
  { id: 'language', name: 'Language Skills', description: 'Foreign languages, sign language', icon: FiCheck },
  { id: 'artistic', name: 'Artistic Skills', description: 'Visual arts, music, performance', icon: FiCheck },
  { id: 'business', name: 'Business Skills', description: 'Marketing, finance, entrepreneurship', icon: FiCheck },
  { id: 'other', name: 'Other Skills', description: 'Skills that don\'t fit other categories', icon: FiCheck },
];

const skillLevels: SkillLevel[] = ['Beginner', 'Intermediate', 'Expert'];

const levelStyles = {
  'Beginner': 'bg-blue-500/20 border-blue-500/40 text-blue-400',
  'Intermediate': 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
  'Expert': 'bg-green-500/20 border-green-500/40 text-green-400'
};

interface SkillFormProps {
  mode: 'add' | 'edit';
  type: 'skill' | 'desiredSkill';
  initialSkill?: Partial<Skill>;
  onSubmit: (skill: Partial<Skill>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const SkillForm = ({ 
  mode, 
  type, 
  initialSkill, 
  onSubmit, 
  onCancel, 
  isLoading 
}: SkillFormProps) => {
  const [skill, setSkill] = useState<Partial<Skill>>(initialSkill || {
    name: '',
    category: '',
    level: 'Beginner',
    tags: [],
  });
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    category?: string;
  }>({});
  const [activeStep, setActiveStep] = useState<'info' | 'category' | 'level' | 'tags'>('info');

  useEffect(() => {
    if (initialSkill) {
      setSkill(initialSkill);
    }
  }, [initialSkill]);

  const validate = (data: Partial<Skill>, field?: string) => {
    const newErrors: {name?: string; category?: string} = {};
    
    if (field === 'name' || !field) {
      if (!data.name || data.name.trim() === '') {
        newErrors.name = 'Skill name is required';
      } else if (data.name.length < 2) {
        newErrors.name = 'Skill name must be at least 2 characters';
      }
    }
    
    if (field === 'category' || !field) {
      if (!data.category || data.category.trim() === '') {
        newErrors.category = 'Please select a category';
      }
    }
    
    setErrors(prev => ({...prev, ...newErrors}));
    return Object.keys(newErrors).length === 0;
  };

  const handleNameChange = (name: string) => {
    const newData = {...skill, name};
    setSkill(newData);
    validate(newData, 'name');
  };

  const handleCategoryChange = (category: string) => {
    const newData = {...skill, category};
    setSkill(newData);
    validate(newData, 'category');
    if (category) {
      setActiveStep('level');
    }
  };

  const handleLevelChange = (level: SkillLevel) => {
    setSkill({...skill, level});
    setActiveStep('tags');
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const tagToAdd = newTag.trim();
    
    // Prevent duplicates
    if (skill.tags?.includes(tagToAdd)) {
      setNewTag('');
      return;
    }
    
    setSkill(prev => ({
      ...prev,
      tags: [...(prev.tags || []), tagToAdd],
    }));
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSkill(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || [],
    }));
  };

  const handleSubmit = async () => {
    if (!validate(skill)) return;
    await onSubmit(skill);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && !isLoading && onCancel()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {mode === 'add' ? 'Add New' : 'Edit'} {type === 'skill' ? 'Skill' : 'Desired Skill'}
          </h2>
          <motion.button
            onClick={onCancel}
            className={`text-zinc-400 hover:text-white ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={isLoading}
          >
            <FiX size={24} />
          </motion.button>
        </div>

        <div className="space-y-6">
          {/* Step 1: Basic info */}
          <div className={`transition-opacity ${activeStep !== 'info' ? 'opacity-60' : 'opacity-100'}`}>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-zinc-300">
                What's the name of this {type === 'skill' ? 'skill' : 'skill you want to learn'}?
              </label>
              {activeStep !== 'info' && (
                <button 
                  onClick={() => setActiveStep('info')} 
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  Edit
                </button>
              )}
            </div>
            <input
              type="text"
              value={skill.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`w-full px-3 py-3 bg-zinc-800 border ${errors.name ? 'border-red-500' : 'border-zinc-700'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg`}
              placeholder={type === 'skill' ? "e.g., JavaScript, Public Speaking" : "e.g., French, Piano"}
              disabled={activeStep !== 'info' && !!skill.name}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && skill.name) {
                  setActiveStep('category');
                }
              }}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
            {activeStep === 'info' && skill.name && !errors.name && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setActiveStep('category')}
                className="mt-3 w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue
              </motion.button>
            )}
          </div>

          {/* Step 2: Category selection */}
          <AnimatePresence>
            {(activeStep === 'category' || activeStep === 'level' || activeStep === 'tags') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`overflow-hidden transition-opacity ${activeStep !== 'category' ? 'opacity-60' : 'opacity-100'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-zinc-300">
                    Which category does this skill belong to?
                  </label>
                  {activeStep !== 'category' && (
                    <button 
                      onClick={() => setActiveStep('category')} 
                      className="text-xs text-primary-400 hover:text-primary-300"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {skillCategories.map((category) => (
                    <motion.button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryChange(category.id)}
                      className={`px-3 py-3 rounded-lg border text-left transition-colors ${
                        skill.category === category.id
                          ? 'bg-primary-500/20 border-primary-500/40 text-primary-300'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={activeStep !== 'category' && !!skill.category}
                    >
                      <div className="font-medium">{category.name}</div>
                      <div className="text-xs opacity-70">{category.description}</div>
                    </motion.button>
                  ))}
                </div>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3: Proficiency Level */}
          <AnimatePresence>
            {(activeStep === 'level' || activeStep === 'tags') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`overflow-hidden transition-opacity ${activeStep !== 'level' ? 'opacity-60' : 'opacity-100'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-zinc-300">
                    {type === 'skill' ? 'What is your proficiency level?' : 'What level do you want to reach?'}
                  </label>
                  {activeStep !== 'level' && (
                    <button 
                      onClick={() => setActiveStep('level')} 
                      className="text-xs text-primary-400 hover:text-primary-300"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {skillLevels.map((level) => (
                    <motion.button
                      key={level}
                      type="button"
                      onClick={() => handleLevelChange(level)}
                      className={`px-3 py-3 rounded-lg border text-center transition-colors ${
                        skill.level === level
                          ? levelStyles[level]
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={activeStep !== 'level' && !!skill.level}
                    >
                      <div className="font-medium">{level}</div>
                      {skill.level === level && (
                        <FiStar className="inline ml-1" size={14} />
                      )}
                    </motion.button>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-xs text-zinc-500">
                  <span>Novice</span>
                  <span>Skilled</span>
                  <span>Advanced</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 4: Tags */}
          <AnimatePresence>
            {activeStep === 'tags' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300">
                      Add tags (optional)
                    </label>
                    <p className="text-xs text-zinc-500">
                      Tags help others find your skills
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-zinc-500 hover:text-zinc-300"
                    onClick={() => {
                      const wrapper = document.createElement('div');
                      wrapper.innerHTML = `
                        <p>Tags help make your skills searchable and more visible to potential matches.</p>
                        <p class="mt-2">Examples:</p>
                        <ul class="list-disc pl-5 mt-1 space-y-1">
                          <li>For JavaScript: "web development", "frontend", "react"</li>
                          <li>For Public Speaking: "presentations", "leadership", "communication"</li>
                        </ul>
                      `;
                      alert(wrapper.textContent);
                    }}
                  >
                    <FiHelpCircle size={16} />
                  </motion.button>
                </div>
                <div className="flex flex-wrap gap-2 mb-2 min-h-[40px]">
                  {skill.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded-lg text-sm flex items-center group"
                    >
                      <FiTag className="mr-1 text-zinc-500" size={12} />
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-zinc-500 group-hover:text-zinc-300"
                      >
                        <FiX size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="e.g., web development, javascript"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-l-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <motion.button
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-primary-600 text-white rounded-r-lg hover:bg-primary-500"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Add
                  </motion.button>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Press Enter or click Add to add a tag
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit button */}
          {(activeStep === 'tags' || mode === 'edit') && (
            <motion.button
              onClick={handleSubmit}
              className={`w-full py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-500 flex items-center justify-center mt-6 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
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
                  {mode === 'edit' ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>{mode === 'edit' ? 'Update' : 'Add'} {type === 'skill' ? 'Skill' : 'Desired Skill'}</>
              )}
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SkillForm; 
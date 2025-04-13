import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiStar } from 'react-icons/fi';

interface RatingComponentProps {
  initialRating: number;
  maxRating?: number;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (rating: number) => void;
  label?: string;
}

const RatingComponent = ({
  initialRating,
  maxRating = 5,
  readOnly = false,
  size = 'md',
  onChange,
  label
}: RatingComponentProps) => {
  const [rating, setRating] = useState(initialRating);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleRatingClick = (newRating: number) => {
    if (readOnly) return;
    
    setRating(newRating);
    if (onChange) {
      onChange(newRating);
    }
  };

  const starSizes = {
    sm: { width: 14, height: 14 },
    md: { width: 20, height: 20 },
    lg: { width: 24, height: 24 }
  };

  const containerClasses = {
    sm: 'space-x-1',
    md: 'space-x-2',
    lg: 'space-x-3'
  };

  return (
    <div className="flex flex-col">
      {label && <span className="text-zinc-400 text-sm mb-1">{label}</span>}
      <div className={`flex items-center ${containerClasses[size]}`}>
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1;
          const isFilled = (hoveredRating || rating) >= starValue;
          
          return (
            <motion.div
              key={`star-${index}`}
              onMouseEnter={() => !readOnly && setHoveredRating(starValue)}
              onMouseLeave={() => !readOnly && setHoveredRating(0)}
              onClick={() => handleRatingClick(starValue)}
              whileHover={!readOnly ? { scale: 1.2 } : undefined}
              whileTap={!readOnly ? { scale: 0.9 } : undefined}
              className={`cursor-${readOnly ? 'default' : 'pointer'}`}
            >
              <FiStar
                className={`${isFilled ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'} transition-colors`}
                strokeWidth={1.5}
                style={starSizes[size]}
              />
            </motion.div>
          );
        })}
        
        {!readOnly && (
          <span className="text-zinc-400 text-sm ml-2">
            {rating.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
};

export default RatingComponent; 
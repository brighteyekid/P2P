import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={typeof window !== 'undefined' ? window.location.pathname : 'key'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          type: "tween",
          ease: "easeInOut",
          duration: 0.3,
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition; 
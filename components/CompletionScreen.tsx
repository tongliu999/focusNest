
import React from 'react';
import { motion } from 'framer-motion';

interface CompletionScreenProps {
  onRestart: () => void;
  reward: number;
  onDownloadPdf: () => void;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({ onRestart, reward, onDownloadPdf }) => {
  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-lg text-center animate-fade-in">
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <span className="text-7xl" role="img" aria-label="Trophy">🏆</span>
      </motion.div>
      <h2 className="text-3xl font-bold text-dark-text mt-4">Journey Complete!</h2>
      <p className="text-light-text mt-2 mb-2">
        Fantastic work! You've mastered the material. Take a moment to celebrate your success.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, type: 'spring' }}
        className="my-6"
      >
        <p className="text-xl font-bold text-amber-500 bg-amber-100/50 py-2 px-4 rounded-full inline-block">
            Bonus: +{reward} Coins!
        </p>
      </motion.div>

      <div className="flex justify-center gap-4">
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDownloadPdf}
            className="py-3 px-8 bg-secondary text-white font-semibold rounded-xl shadow-md hover:bg-secondary-light transition-colors duration-300"
        >
            Download PDF
        </motion.button>
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRestart}
            className="py-3 px-8 bg-primary text-white font-semibold rounded-xl shadow-md hover:bg-primary-light transition-colors duration-300"
        >
            Start a New Journey
        </motion.button>
      </div>
    </div>
  );
};

export default CompletionScreen;
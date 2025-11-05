
import React from 'react';
import { motion } from 'framer-motion';
import { Module } from '../types';
import { GameIcon } from './icons';

interface ModuleCompletionProps {
  module: Module;
  onContinue: () => void;
}

const ModuleCompletion: React.FC<ModuleCompletionProps> = ({ module, onContinue }) => {
  return (
    <div className="w-full max-w-lg mx-auto p-8 bg-white rounded-2xl shadow-lg text-center">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <span className="text-7xl" role="img" aria-label="Checkmark">✅</span>
      </motion.div>
      <h2 className="text-3xl font-bold text-dark-text mt-4">Congratulations!</h2>
      <p className="text-light-text mt-2 mb-8">
        You've completed the <span className="font-semibold text-primary">"{module.title}"</span> section. Time for a quick break!
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onContinue}
        className="py-3 px-8 bg-accent text-white font-semibold rounded-xl shadow-md hover:bg-amber-500 transition-colors duration-300 flex items-center justify-center w-full"
      >
        <GameIcon className="w-5 h-5 mr-2" />
        Play Game
      </motion.button>
    </div>
  );
};

export default ModuleCompletion;

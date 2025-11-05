

import React from 'react';
import { motion } from 'framer-motion';
import { Module, ModuleType } from '../types';
// FIX: Removed unused TrophyIcon as ModuleType.Test does not exist.
import { BookIcon, GameIcon, QuizIcon, CloseIcon, MatchingIcon } from './icons';

interface JourneyMapProps {
  modules: Module[];
  currentIndex: number;
  currentStatus: 'journey' | 'game' | 'module_complete';
  onClose: () => void;
}

const getStepClass = (isActive: boolean, isCompleted: boolean) => {
    if (isActive) return 'bg-primary text-white ring-4 ring-primary-light/50';
    if (isCompleted) return 'bg-secondary text-white';
    return 'bg-gray-200 text-gray-500';
}

const getIconForModule = (module: Module) => {
    switch(module.type) {
        case ModuleType.Learn: return <BookIcon className="w-6 h-6" />;
        case ModuleType.Quiz: return <QuizIcon className="w-6 h-6" />;
        // FIX: Removed case for ModuleType.Test as it does not exist in the enum.
        case ModuleType.MatchingGame: return <MatchingIcon className="w-6 h-6" />;
        default: return null;
    }
};

const JourneyMap: React.FC<JourneyMapProps> = ({ modules, currentIndex, currentStatus, onClose }) => {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
        aria-hidden="true"
      />
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '0%' }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 bottom-0 w-80 bg-light-bg p-6 z-50 shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="journey-map-title"
      >
        <div className="flex items-center justify-between mb-8">
            <h2 id="journey-map-title" className="text-2xl font-bold text-primary">Focus Flow</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition" aria-label="Close menu">
                <CloseIcon className="w-6 h-6 text-dark-text" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto -ml-2 pr-2">
            <div className="relative pl-6">
                {/* Vertical Connector Line */}
                <div className="absolute top-5 bottom-5 left-[30px] w-0.5 bg-gray-200"></div>

                {modules.map((module, index) => {
                    const isModuleCompleted = index < currentIndex;
                    const isModuleActive = index === currentIndex && (currentStatus === 'journey' || currentStatus === 'module_complete');
                    
                    const nextModule = modules[index + 1];
                    // FIX: Removed ModuleType.Test from the array as it does not exist.
                    const isFollowedByGame = !nextModule || [ModuleType.Quiz, ModuleType.MatchingGame].includes(module.type);
                    
                    const isGameActiveAfterModule = index === currentIndex && currentStatus === 'game';
                    const isGameCompleted = index < currentIndex;

                    return (
                        <React.Fragment key={index}>
                            <div className="flex items-start mb-4 relative">
                                <div className="absolute left-[-6px] top-0 z-10">
                                    <motion.div
                                        animate={isModuleActive ? { scale: 1.1 } : { scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors duration-500 flex-shrink-0 ${getStepClass(isModuleActive, isModuleCompleted)}`}
                                    >
                                        {getIconForModule(module)}
                                    </motion.div>
                                </div>
                                <div className="ml-16 pt-2">
                                    <p className={`font-bold transition-colors duration-300 ${isModuleActive || isModuleCompleted ? 'text-dark-text' : 'text-light-text'}`}>{module.title}</p>
                                    <p className={`text-sm transition-colors duration-300 ${isModuleActive || isModuleCompleted ? 'text-primary' : 'text-light-text'}`}>{module.type}</p>
                                </div>
                            </div>

                            {isFollowedByGame && index < modules.length - 1 && (
                                <div className="flex items-start mb-4 h-20 relative">
                                    <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 z-10">
                                        <motion.div
                                            animate={isGameActiveAfterModule ? { scale: 1.1 } : { scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors duration-500 flex-shrink-0 ${getStepClass(isGameActiveAfterModule, isGameCompleted)}`}
                                        >
                                            <GameIcon className="w-6 h-6" />
                                        </motion.div>
                                    </div>
                                    <div className="ml-16 pt-5">
                                        <p className={`font-bold transition-colors duration-300 ${isGameActiveAfterModule || isGameCompleted ? 'text-dark-text' : 'text-light-text'}`}>Brain Break</p>
                                        <p className={`text-sm transition-colors duration-300 ${isGameActiveAfterModule || isGameCompleted ? 'text-accent' : 'text-light-text'}`}>Mini-Game</p>
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
      </motion.div>
    </>
  );
};

export default JourneyMap;
import React from 'react';
import { motion } from 'framer-motion';
import { Module } from '../types';
import { LearnIcon, QuizIcon, MatchingGameIcon, TestIcon, GameIcon, LockIcon, ChevronLeftIcon } from './icons';

interface JourneyMapProps {
  modules: Module[];
  currentIndex: number;
  highestIndex: number;
  currentStatus: 'journey' | 'game';
  onSave: () => void;
  onModuleSelect: (index: number) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const getModuleIcon = (moduleType: string) => {
    switch(moduleType) {
        case 'Learn': return <LearnIcon className="w-6 h-6" />;
        case 'Quiz': return <QuizIcon className="w-6 h-6" />;
        case 'Matching Game': return <MatchingGameIcon className="w-6 h-6" />;
        case 'Test': return <TestIcon className="w-6 h-6" />;
        default: return null;
    }
};

const sidebarVariants = {
    open: { width: '20rem', transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { width: '0rem', transition: { type: 'spring', stiffness: 300, damping: 30 } }
};

const contentVariants = {
    open: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 30, delay: 0.1 } },
    closed: { opacity: 0, x: -20, transition: { type: 'spring', stiffness: 300, damping: 30 } }
};


const JourneyMap: React.FC<JourneyMapProps> = ({ modules, currentIndex, highestIndex, currentStatus, onSave, onModuleSelect, isVisible, onToggleVisibility }) => {
  return (
    <motion.aside 
      className="bg-light-bg h-screen flex-col overflow-hidden hidden md:flex"
      initial="open"
      animate={isVisible ? "open" : "closed"}
      variants={sidebarVariants}
    >
      <motion.div
        className="p-6 border-r border-gray-200 flex flex-col h-full w-80"
        initial="open"
        animate={isVisible ? "open" : "closed"}
        variants={contentVariants}
      >
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Focus Flow</h1>
            <div className="flex items-center space-x-2">
              <button onClick={onSave} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  Save
              </button>
              <button 
                onClick={onToggleVisibility} 
                className="p-2 rounded-md hover:bg-gray-200"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
            </div>
        </div>

        <nav className="flex-1 overflow-y-auto -mr-4 pr-4">
            <ul className="space-y-2">
                {modules.map((module, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const isLocked = index > highestIndex;
                    
                    let statusStyles = "bg-white text-dark-text";
                    if (isCompleted) {
                        statusStyles = "bg-green-100 text-green-800 border-l-4 border-green-500";
                    } else if (isCurrent) {
                        statusStyles = "bg-blue-100 text-blue-800 border-l-4 border-blue-500 font-bold shadow-md";
                    } else if (isLocked) {
                        statusStyles = "bg-gray-100 text-gray-500 opacity-70";
                    } else {
                        statusStyles = "bg-gray-50 text-gray-700";
                    }
                    const canNavigate = !isLocked;

                    return (
                        <motion.li 
                            key={index}
                            className={`p-4 rounded-lg flex items-center space-x-4 transition-all duration-300 ${statusStyles} ${canNavigate ? 'cursor-pointer hover:shadow-lg' : 'cursor-default'}`}
                            onClick={() => canNavigate && onModuleSelect(index)}
                        >
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-500 text-white' : isLocked ? 'bg-gray-300 text-gray-600' : 'bg-gray-200 text-gray-700'}`}>
                                {isLocked ? <LockIcon className="w-5 h-5"/> : getModuleIcon(module.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{module.title}</p>
                                <p className="text-xs text-light-text">{module.type}</p>
                            </div>
                            {isCurrent && (
                                <div className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full ${currentStatus === 'journey' ? 'bg-primary-light/20 text-primary' : 'bg-accent/20 text-accent'}`}>
                                    {currentStatus === 'journey' ? 'Focus' : 'Break'}
                                </div>
                            )}
                        </motion.li>
                    );
                })}
            </ul>
        </nav>
      </motion.div>
    </motion.aside>
  );
};

export default JourneyMap;

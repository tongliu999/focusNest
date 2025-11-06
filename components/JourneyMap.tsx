import React from 'react';
import { motion } from 'framer-motion';
import { Module } from '../types';
import { LearnIcon, QuizIcon, MatchingGameIcon, TestIcon, GameIcon, LockIcon } from './icons';

interface JourneyMapProps {
  modules: Module[];
  currentIndex: number;
  currentStatus: 'journey' | 'game';
  onSave: () => void;
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

const JourneyMap: React.FC<JourneyMapProps> = ({ modules, currentIndex, currentStatus, onSave }) => {
  return (
    <aside className="w-80 bg-light-bg p-6 border-r border-gray-200 flex flex-col">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Focus Flow</h1>
            <button onClick={onSave} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Save
            </button>
        </div>

        <nav className="flex-1 overflow-y-auto -mr-4 pr-4">
            <ul className="space-y-2">
                {modules.map((module, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const isLocked = index > currentIndex;
                    
                    let statusStyles = "bg-white text-dark-text";
                    if (isCompleted) {
                        statusStyles = "bg-green-100 text-green-800 border-l-4 border-green-500";
                    } else if (isCurrent) {
                        statusStyles = "bg-blue-100 text-blue-800 border-l-4 border-blue-500 font-bold shadow-md";
                    } else if (isLocked) {
                        statusStyles = "bg-gray-100 text-gray-500 opacity-70";
                    }

                    return (
                        <motion.li 
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-4 rounded-lg flex items-center space-x-4 transition-all duration-300 ${statusStyles}`}
                        >
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                {isLocked ? <LockIcon className="w-5 h-5"/> : getModuleIcon(module.type)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold">{module.title}</p>
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
    </aside>
  );
};

export default JourneyMap;

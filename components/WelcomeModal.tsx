
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeModalProps {
    step: number;
    onNext: () => void;
    onStart: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ step, onNext, onStart }) => {
    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg text-center"
                >
                    {step === 1 && (
                        <>
                            <h2 className="text-3xl font-bold text-dark-text">Welcome to Focus Flow!</h2>
                            <p className="text-light-text my-6">
                                Get ready for a new way to learn. We've broken down your material into bite-sized lessons, quizzes, and fun breaks to keep you engaged.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onNext}
                                className="w-full py-3 px-6 bg-primary text-white font-semibold rounded-xl shadow-md hover:bg-primary-light transition-colors duration-300"
                            >
                                Next
                            </motion.button>
                        </>
                    )}
                    {step === 2 && (
                         <>
                            <h2 className="text-3xl font-bold text-dark-text">Ready?</h2>
                            <p className="text-light-text my-6">
                               Your personalized journey is ready. Follow the path, complete each step, and enjoy the process!
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onStart}
                                className="w-full py-3 px-6 bg-secondary text-white font-semibold rounded-xl shadow-md hover:bg-secondary-light transition-colors duration-300 animate-pulse-strong"
                            >
                                LET'S GO
                            </motion.button>
                        </>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default WelcomeModal;

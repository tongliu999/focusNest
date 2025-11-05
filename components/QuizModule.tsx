import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Module } from '../types';

interface QuizModuleProps {
    module: Module;
    onComplete: () => void;
    onIncorrect: (module: Module, questionIndex: number) => void;
    refresher: { content: string, questionIndex: number } | null;
    onClearRefresher: () => void;
}

const QuizModule: React.FC<QuizModuleProps> = ({ module, onComplete, onIncorrect, refresher, onClearRefresher }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    const question = module.questions?.[currentQuestionIndex];
    
    useEffect(() => {
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setIsCorrect(false);
      onClearRefresher();
    }, [module, onClearRefresher]);

    if (!module.questions || !question || !question.options || question.options.length < 1) {
        return (
            <div className="w-full max-w-2xl mx-auto p-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg text-center border border-white/30">
                <h2 className="text-xl font-bold text-dark-text mb-1">{module.title}</h2>
                <p className="text-light-text my-4">Apologies, there was an issue loading this question. You can continue to the next part of your journey.</p>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onComplete}
                    className="w-full mt-4 py-3 px-6 bg-primary text-white font-semibold rounded-xl shadow-md hover:bg-primary-light transition-colors duration-300"
                >
                    Continue
                </motion.button>
            </div>
        );
    }

    const handleAnswerSelect = (index: number) => {
        if (isAnswered) return;
        setSelectedAnswer(index);
        const correct = index === question.correctAnswerIndex;
        setIsCorrect(correct);
        setIsAnswered(true);
        if(!correct) {
            onIncorrect(module, currentQuestionIndex);
        }
    };
    
    const handleNext = () => {
        setIsAnswered(false);
        setSelectedAnswer(null);
        onClearRefresher();
        if (module.questions && currentQuestionIndex < module.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };
    
    const getButtonClass = (index: number) => {
        if (!isAnswered) {
            return "bg-white/50 hover:bg-violet-100/70 border-white/50";
        }
        if (index === question.correctAnswerIndex) {
            return "bg-green-200/80 border-secondary text-green-800 font-semibold";
        }
        if (index === selectedAnswer) {
            return "bg-red-200/80 border-red-500 text-red-800 font-semibold";
        }
        return "bg-gray-200/50 border-gray-300/50 opacity-70";
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/30">
            <h2 className="text-xl font-bold text-dark-text mb-1">{module.title}</h2>
            <p className="text-light-text mb-6">Question {currentQuestionIndex + 1} of {module.questions.length}</p>

            <p className="text-lg text-dark-text mb-6 font-medium">{question.question}</p>

            <div className="space-y-3">
                {question.options.map((option, index) => (
                    <motion.button
                        key={index}
                        whileHover={{ scale: isAnswered ? 1 : 1.02 }}
                        whileTap={{ scale: isAnswered ? 1 : 0.98 }}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={isAnswered}
                        className={`w-full text-left p-4 border rounded-xl transition-all duration-200 ${getButtonClass(index)}`}
                    >
                        {option}
                    </motion.button>
                ))}
            </div>

            <AnimatePresence>
            {isAnswered && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mt-6 p-4 rounded-lg ${isCorrect ? 'bg-green-100/80 border-green-200' : 'bg-red-100/80 border-red-200'} border`}
                >
                    <h3 className={`font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                        {isCorrect ? "Correct!" : "Not quite..."}
                    </h3>
                    <p className="mt-1 text-sm text-dark-text">{question.explanation}</p>
                </motion.div>
            )}
            {refresher && refresher.questionIndex === currentQuestionIndex && (
                 <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 p-4 rounded-lg bg-amber-100/80 border-accent border"
                >
                    <h3 className="font-bold text-amber-800">Here's a hint:</h3>
                    <p className="mt-1 text-sm text-dark-text">{refresher.content}</p>
                </motion.div>
            )}
            </AnimatePresence>


            {isAnswered && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNext}
                    className="w-full mt-6 py-3 px-6 bg-primary text-white font-semibold rounded-xl shadow-md hover:bg-primary-light transition-colors duration-300"
                >
                    {module.questions && currentQuestionIndex < module.questions.length - 1 ? 'Next Question' : "Finish Quiz"}
                </motion.button>
            )}
        </div>
    );
};

export default QuizModule;

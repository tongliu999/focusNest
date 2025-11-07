import React, { useState } from 'react';
import { Module } from '../types';
import { motion } from 'framer-motion';

interface AssignmentModuleProps {
  module: Module;
  onComplete: (answer: string) => void;
  feedback: string | null;
  checking: boolean;
}

const AssignmentModule: React.FC<AssignmentModuleProps> = ({ module, onComplete, feedback, checking }) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(answer);
  };

  return (
    <div className="p-4 sm:p-8 w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">{module.title}</h2>
      <p className="mb-4">{module.questions?.[0]?.question}</p>
      <form onSubmit={handleSubmit}>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          className="w-full h-48 p-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 transition duration-200 resize-none text-lg bg-white text-gray-800 placeholder:text-gray-400"
        />
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg"
          >
            <p>{feedback}</p>
          </motion.div>
        )}
        <button
          type="submit"
          disabled={!answer.trim() || checking}
          className="mt-4 w-full py-3 px-6 bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold rounded-lg shadow-md hover:from-blue-500 hover:to-purple-600 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {checking ? 'Checking answer...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default AssignmentModule;

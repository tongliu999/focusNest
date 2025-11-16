import React, { useState } from 'react';
import { Module, QuestionType } from '../types';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

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

  const question = module.questions?.[0];

  const renderQuestion = () => {
    if (question?.questionType === QuestionType.Code) {
        return (
            <Editor
                height="200px"
                language="javascript"
                value={question.question}
                options={{ readOnly: true, minimap: { enabled: false } }}
                theme="vs-dark"
            />
        );
    }
    return (
        <p>{question?.question.split('\n').map((line, i) => {
          if (line.includes('$')) {
            return <span key={i}><InlineMath math={line} /></span>;
          }
          return <React.Fragment key={i}>{line}<br/></React.Fragment>;
        })}</p>
    );
  };

  const renderEditor = () => {
    switch (question?.questionType) {
      case QuestionType.Code:
        return (
          <Editor
            height="50vh"
            defaultLanguage="javascript"
            defaultValue="// Write your code here"
            onChange={(value) => setAnswer(value || '')}
            theme="vs-dark"
          />
        );
      case QuestionType.Latex:
        return (
          <div className="grid grid-cols-2 gap-4">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter your LaTeX solution here..."
              className="w-full h-64 p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 transition duration-200 resize-none text-lg bg-gray-50 text-gray-800 placeholder:text-gray-400"
            />
            <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2 text-center text-gray-700">Live Preview</h3>
              <div className="h-full flex items-center justify-center">
                {answer ? <BlockMath math={answer} /> : <p className="text-gray-500">Your LaTeX will render here</p>}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full h-48 p-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 transition duration-200 resize-none text-lg bg-white text-gray-800 placeholder:text-gray-400"
          />
        );
    }
  };

  return (
    <div className="p-4 sm:p-8 w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">{module.title}</h2>
      <div className="mb-6 prose prose-lg max-w-none">
        {renderQuestion()}
      </div>
      <form onSubmit={handleSubmit}>
        {renderEditor()}
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded-lg border-l-4 ${feedback.startsWith('Correct') ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700'}`}
          >
            <p className="font-semibold">{feedback}</p>
          </motion.div>
        )}
        <button
          type="submit"
          disabled={!answer.trim() || checking}
          className="mt-6 w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105"
        >
          {checking ? (
            <div className="flex justify-center items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking...
            </div>
          ) : 'Submit Answer'}
        </button>
      </form>
    </div>
  );
};

export default AssignmentModule;

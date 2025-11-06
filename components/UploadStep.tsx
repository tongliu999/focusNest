import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, ArrowRightIcon } from './icons';

interface UploadStepProps {
  onStart: (text: string) => void;
  error: string | null;
}

const defaultContent = `A brief history of the internet.`;


const UploadStep: React.FC<UploadStepProps> = ({ onStart, error }) => {
  const [text, setText] = useState(defaultContent);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onStart(text);
    }
  };

  const handleAttachFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileContent = event.target?.result;
        if (typeof fileContent === 'string') {
          setText(fileContent);
        } else {
            console.error("Could not read file as text.");
        }
      };
      reader.onerror = (error) => {
          console.error("Error reading file:", error);
      };
      reader.readAsText(file);
    }
    // Clear the input value to allow re-uploading the same file
    if(e.target) {
        e.target.value = '';
    }
  };


  return (
    <div className="w-full max-w-2xl mx-auto p-8 text-center bg-white rounded-lg shadow-lg">
      <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Focus Flow</h1>
      <p className="text-xl text-dark-text mt-4 mb-12">What are you learning today?</p>
      
      {error && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg text-left" 
            role="alert"
        >
          <p className="font-bold">Oh no!</p>
          <p>{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="relative">
         <button
            type="button"
            onClick={handleAttachFileClick}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-200 transition-colors duration-200 z-10"
            aria-label="Attach file to import text"
        >
            <PlusIcon className="w-6 h-6 text-gray-500" />
        </button>
        <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".txt,.md,.text"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your notes, an article, or any text here to begin..."
          className="w-full h-64 p-4 pl-14 pr-20 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-400 transition duration-200 resize-none text-lg bg-white text-gray-800 placeholder:text-gray-400"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!text.trim()}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold rounded-full shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:from-blue-500 hover:to-purple-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 flex items-center justify-center"
          aria-label="Start Learning"
        >
            <ArrowRightIcon className="w-6 h-6" />
        </motion.button>
      </form>
      <div className="mt-8 flex justify-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="py-3 px-6 bg-gradient-to-r from-purple-400 to-purple-800 text-white font-semibold rounded-xl shadow-md hover:from-purple-500 hover:to-purple-900 transition-all duration-300"
        >
          Existing lesson
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="py-3 px-6 bg-gradient-to-r from-blue-400 to-blue-800 text-white font-semibold rounded-xl shadow-md hover:from-blue-500 hover:to-blue-900 transition-all duration-300"
        >
          Do an assignment
        </motion.button>
      </div>
    </div>
  );
};

export default UploadStep;
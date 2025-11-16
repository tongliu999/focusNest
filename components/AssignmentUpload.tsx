import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, ArrowRightIcon, LoaderIcon } from './icons';
import { getTextFromImage, getTextFromPdf } from '../services/geminiService';

interface AssignmentUploadProps {
  onStart: (text: string) => void;
  error: string | null;
  onViewJourneys: () => void;
  onCreateJourney: () => void;
  onResumeJourney: () => void;
  isJourneyActive: boolean;
}

const defaultContent = ``;

const AssignmentUpload: React.FC<AssignmentUploadProps> = ({ onStart, error, onViewJourneys, onCreateJourney, onResumeJourney, isJourneyActive }) => {
  const [text, setText] = useState(defaultContent);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && text !== defaultContent) {
      onStart(text);
    }
  };

  const handleAttachFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProcessing(true);
      if (file.type.startsWith('image/')) {
        const extractedText = await getTextFromImage(file);
        setText(extractedText);
      } else if (file.type === 'application/pdf') {
        const extractedText = await getTextFromPdf(file);
        setText(extractedText);
      } else {
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
      setProcessing(false);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 text-center">
      <h1 className="text-7xl font-normal text-black font-figtree">Assignment Helper</h1>
      <p className="text-xl text-black mt-4 mb-12">Upload your assignment to get started.</p>
      
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

      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative w-full">
            <button
                type="button"
                onClick={handleAttachFileClick}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-200 transition-colors duration-200 z-10"
                aria-label="Attach file to import text"
                title="Add files"
            >
                {processing ? <LoaderIcon className="w-6 h-6 text-gray-500" /> : <PlusIcon className="w-6 h-6 text-gray-500" />}
            </button>
            <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".txt,.md,.text,image/*,application/pdf"
            />
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your assignment here to begin..."
              className="w-full max-h-[60vh] p-4 pl-14 pr-14 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-400 transition-all duration-200 resize-none text-lg bg-white text-gray-800 placeholder:text-gray-400 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]"
              rows={1}
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!text.trim() || text === defaultContent}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-r from-green-400 to-green-800 text-white font-semibold rounded-full shadow-lg disabled:bg-gray-300 disabled:bg-none disabled:shadow-none disabled:cursor-not-allowed hover:from-green-500 hover:to-green-900 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 flex items-center justify-center"
              aria-label="Start Assignment"
            >
                <ArrowRightIcon className="w-5 h-5" />
            </motion.button>
        </div>
      </form>
      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="flex justify-center gap-4">
            {isJourneyActive && (
                <motion.button
                  onClick={onResumeJourney}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="py-3 px-6 bg-gradient-to-r from-purple-500 to-purple-800 text-white font-semibold rounded-xl shadow-md hover:from-purple-600 hover:to-purple-900 transition-all duration-300"
                >
                  Resume Journey
                </motion.button>
            )}
            <motion.button
              onClick={onCreateJourney}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="py-3 px-6 bg-gradient-to-r from-blue-400 to-blue-800 text-white font-semibold rounded-xl shadow-md hover:from-blue-500 hover:to-blue-900 transition-all duration-300"
            >
              Learning Something New?
            </motion.button>
        </div>
        <button
          onClick={onViewJourneys}
          className="text-black underline"
        >
          View All Lessons
        </button>
      </div>
    </div>
  );
};

export default AssignmentUpload;

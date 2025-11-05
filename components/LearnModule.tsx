import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Module } from '../types';
import { CheckIcon } from './icons';
import { generateImage } from '../services/geminiService';

interface LearnModuleProps {
  module: Module;
  onComplete: () => void;
}

const LearnModule: React.FC<LearnModuleProps> = ({ module, onComplete }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    if (module.imagePrompt) {
        setIsLoading(true);
        setError(null);
        setImageUrl(null);

        const generate = async () => {
            const url = await generateImage(module.imagePrompt!);
            if (!isCancelled) {
                if (url) {
                    setImageUrl(url);
                } else {
                    setError("Could not generate the visual aid for this module.");
                }
                setIsLoading(false);
            }
        };

        generate();
    } else {
        setIsLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [module.imagePrompt]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-bold text-dark-text mb-4">{module.title}</h2>
        
        <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
                <p className="text-light-text mb-6">{module.summary || "No summary available."}</p>
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-dark-text">Key Takeaways:</h3>
                    <ul className="list-none space-y-2">
                    {(module.keyPoints || []).map((point, index) => (
                        <motion.li 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start"
                        >
                        <CheckIcon className="w-6 h-6 text-secondary flex-shrink-0 mr-3 mt-1" />
                        <span className="text-dark-text">{point}</span>
                        </motion.li>
                    ))}
                    </ul>
                </div>
            </div>
             <div className="bg-gray-100 rounded-xl h-full min-h-64 flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 relative overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-8 h-8 border-4 border-t-primary border-gray-200 rounded-full animate-spin"></div>
                        <p className="mt-4 text-sm text-gray-500">Generating visual aid...</p>
                    </div>
                ) : imageUrl ? (
                    <motion.img
                        src={imageUrl}
                        alt={module.imagePrompt || 'Generated visual aid'}
                        className="w-full h-full object-contain"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    />
                ) : (
                    <>
                        <p className="text-sm font-semibold text-gray-500 mb-2">VISUAL AID CONCEPT</p>
                        <p className="text-gray-700 text-center italic">
                            {error || module.imagePrompt || 'No visual concept provided.'}
                        </p>
                    </>
                )}
            </div>
        </div>

        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onComplete}
            className="w-full mt-8 py-3 px-6 bg-primary text-white font-semibold rounded-xl shadow-md hover:bg-primary-light transition-colors duration-300"
        >
            I've learned this. Next!
        </motion.button>
      </div>
    </div>
  );
};

export default LearnModule;
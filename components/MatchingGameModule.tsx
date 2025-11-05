import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Module, MatchingPair } from '../types';
import { shuffle } from 'lodash';

interface MatchingGameModuleProps {
    module: Module;
    onComplete: () => void;
}

const MatchingGameModule: React.FC<MatchingGameModuleProps> = ({ module, onComplete }) => {
    const [terms, setTerms] = useState<MatchingPair[]>([]);
    const [definitions, setDefinitions] = useState<MatchingPair[]>([]);
    const [selectedTerm, setSelectedTerm] = useState<MatchingPair | null>(null);
    const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
    const [incorrectMatch, setIncorrectMatch] = useState<[string, string] | null>(null);

    useEffect(() => {
        if (module.pairs) {
            setTerms(shuffle(module.pairs));
            setDefinitions(shuffle(module.pairs));
        }
        setMatchedPairs([]);
        setSelectedTerm(null);
    }, [module.pairs]);

    const handleTermSelect = (term: MatchingPair) => {
        if (matchedPairs.includes(term.term)) return;
        setSelectedTerm(term);
        setIncorrectMatch(null);
    };

    const handleDefinitionSelect = (definition: MatchingPair) => {
        if (!selectedTerm || matchedPairs.includes(definition.term)) return;

        if (selectedTerm.term === definition.term) {
            setMatchedPairs(prev => [...prev, selectedTerm.term]);
            setSelectedTerm(null);
        } else {
            setIncorrectMatch([selectedTerm.term, definition.term]);
            setSelectedTerm(null);
            setTimeout(() => setIncorrectMatch(null), 1000);
        }
    };
    
    const allMatched = module.pairs && matchedPairs.length === module.pairs.length;
    
    useEffect(() => {
        if (allMatched) {
            const timeout = setTimeout(() => {
                onComplete();
            }, 1500);
            return () => clearTimeout(timeout);
        }
    }, [allMatched, onComplete]);

    if (!module.pairs || module.pairs.length === 0) {
        return (
            <div className="w-full max-w-2xl mx-auto p-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg text-center border border-white/30">
                <h2 className="text-xl font-bold text-dark-text mb-1">{module.title}</h2>
                <p className="text-light-text my-4">Apologies, there was an issue loading this matching game.</p>
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
    
    const getButtonClass = (
        item: MatchingPair, 
        type: 'term' | 'definition'
    ) => {
        const isMatched = matchedPairs.includes(item.term);
        if (isMatched) return 'bg-green-200/80 border-secondary text-green-800 opacity-60 cursor-default';
        
        const isSelected = selectedTerm?.term === item.term && type === 'term';
        if (isSelected) return 'bg-primary/80 border-primary-light text-white ring-2 ring-primary-light';

        const isIncorrect = incorrectMatch && (incorrectMatch[0] === item.term || incorrectMatch[1] === item.term);
        if (isIncorrect) return 'bg-red-200/80 border-red-500 animate-shake';

        return 'bg-white/50 hover:bg-violet-100/70 border-white/50';
    };


    return (
        <div className="w-full max-w-4xl mx-auto p-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/30">
            <h2 className="text-2xl font-bold text-dark-text text-center">{module.title}</h2>
            <p className="text-light-text text-center mb-6">{module.instructions}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                {/* Terms Column */}
                <div className="flex flex-col space-y-3">
                    {terms.map((pair) => (
                         <motion.button
                            key={'term-' + pair.term}
                            onClick={() => handleTermSelect(pair)}
                            className={`w-full text-left p-4 border rounded-xl transition-all duration-200 text-dark-text ${getButtonClass(pair, 'term')}`}
                        >
                            {pair.term}
                        </motion.button>
                    ))}
                </div>
                {/* Definitions Column */}
                 <div className="flex flex-col space-y-3">
                    {definitions.map((pair) => (
                         <motion.button
                            key={'def-' + pair.term}
                            onClick={() => handleDefinitionSelect(pair)}
                            disabled={!selectedTerm}
                            className={`w-full text-left p-4 border rounded-xl transition-all duration-200 text-dark-text ${getButtonClass(pair, 'definition')}`}
                        >
                            {pair.definition}
                        </motion.button>
                    ))}
                </div>
            </div>
             <AnimatePresence>
                {allMatched && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-6 text-center"
                    >
                        <h3 className="text-2xl font-bold text-secondary">All Matched! Great job!</h3>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MatchingGameModule;

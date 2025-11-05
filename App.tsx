
import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Module, ModuleType } from './types';
import { generateLearningJourney, generateRefresher } from './services/geminiService';

import UploadStep from './components/UploadStep';
import LoadingGame from './components/Loader';
import WelcomeModal from './components/WelcomeModal';
import JourneyMap from './components/JourneyMap';
import CompletionScreen from './components/CompletionScreen';
import PomodoroTimer from './components/PomodoroTimer';

import LearnModule from './components/LearnModule';
import QuizModule from './components/QuizModule';
import MatchingGameModule from './components/MatchingGameModule';
import GameModule from './components/GameModule';

import { MenuIcon } from './components/icons';


type AppState = 'upload' | 'loading' | 'welcome' | 'journey' | 'break' | 'finished';

export interface DuckStats {
  speed: number;
  jumpHeight: number;
  coins: number;
  duckLives: number;
}

export const FOCUS_DURATION = 25 * 60;
export const BREAK_DURATION = 5 * 60;
const JOURNEY_REWARD_COINS = 250;
const FOCUS_SESSION_REWARD_COINS = 100;


const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('upload');
    const [modules, setModules] = useState<Module[]>([]);
    const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [welcomeStep, setWelcomeStep] = useState(1);
    const [isJourneyMapOpen, setJourneyMapOpen] = useState(false);
    
    const [refresher, setRefresher] = useState<{ content: string, questionIndex: number } | null>(null);
    const [timerKey, setTimerKey] = useState(Date.now());
    const [duckStats, setDuckStats] = useState<DuckStats>({
        speed: 1,
        jumpHeight: 1,
        coins: 100,
        duckLives: 1,
    });
    const [journeyReward, setJourneyReward] = useState(0);
    const [notification, setNotification] = useState<string | null>(null);

    const handleGenerateJourney = useCallback(async (text: string) => {
        setError(null);
        try {
            // The loading state is skipped as the journey is now hardcoded and loads instantly.
            const journey = await generateLearningJourney(text);
            if (!journey || journey.length === 0) {
              throw new Error("Hardcoded journey is empty, which should not happen.");
            }
            setModules(journey);
            setCurrentModuleIndex(0);
            setAppState('welcome');
            setWelcomeStep(1);
        } catch (err) {
            console.error(err);
            setError('An unexpected error occurred while loading the journey. Please refresh the page.');
            setAppState('upload');
        }
    }, []);

    const handleStartJourney = useCallback(() => {
        setAppState('journey');
        setTimerKey(Date.now()); // Reset timer when journey starts
    }, []);

    const handleNextModule = useCallback(() => {
        setRefresher(null);
        if (currentModuleIndex < modules.length - 1) {
            setCurrentModuleIndex(prev => prev + 1);
        } else {
            // Journey complete! Award coins.
            setDuckStats(prev => ({ ...prev, coins: prev.coins + JOURNEY_REWARD_COINS }));
            setJourneyReward(JOURNEY_REWARD_COINS);
            setAppState('finished');
        }
    }, [currentModuleIndex, modules.length]);
    
    const handleIncorrectAnswer = useCallback(async (module: Module, questionIndex: number) => {
        const question = module.questions?.[questionIndex];
        if(question) {
            const hint = await generateRefresher(module.title, question.question);
            setRefresher({ content: hint, questionIndex });
        }
    }, []);

    const handleTimerComplete = useCallback(() => {
        if (appState === 'journey') {
            setDuckStats(prev => ({ ...prev, coins: prev.coins + FOCUS_SESSION_REWARD_COINS }));
            setNotification(`+${FOCUS_SESSION_REWARD_COINS} coins for your focus!`);
            setTimeout(() => {
                setNotification(null);
            }, 3000);
            setAppState('break');
        } else if (appState === 'break') {
            setAppState('journey');
        }
    }, [appState]);

    const handleUpdateDuckStats = useCallback((newStats: Partial<DuckStats>) => {
        setDuckStats(prev => ({ ...prev, ...newStats }));
    }, []);

    const handleReset = useCallback(() => {
        setAppState('upload');
        setModules([]);
        setCurrentModuleIndex(0);
        setError(null);
        // Duck stats like coins and upgrades are NOT reset to allow for persistent progression.
    }, []);

    const renderModule = () => {
        const module = modules[currentModuleIndex];
        if (!module) return null;

        switch (module.type) {
            case ModuleType.Learn:
                return <LearnModule module={module} onComplete={handleNextModule} />;
            case ModuleType.Quiz:
                return <QuizModule 
                            module={module} 
                            onComplete={handleNextModule} 
                            onIncorrect={handleIncorrectAnswer}
                            refresher={refresher}
                            onClearRefresher={() => setRefresher(null)}
                        />;
            case ModuleType.MatchingGame:
                return <MatchingGameModule module={module} onComplete={handleNextModule} />;
            default:
                return <div className="text-center">Unsupported module type. <button onClick={handleNextModule} className="underline">Skip</button></div>;
        }
    };

    const renderContent = () => {
        switch (appState) {
            case 'upload':
                return <UploadStep key="upload" onStart={handleGenerateJourney} error={error} />;
            case 'loading':
                return <LoadingGame key="loading" message="AI is building your personalized journey..." />;
            case 'welcome':
                return <WelcomeModal key="welcome" step={welcomeStep} onNext={() => setWelcomeStep(2)} onStart={handleStartJourney} />;
            case 'journey':
            case 'break':
                return (
                    <motion.div key="journey" className="w-full h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <header className="w-full p-4 flex justify-between items-center fixed top-0 left-0 z-10">
                            <button onClick={() => setJourneyMapOpen(true)} className="p-2 rounded-full hover:bg-gray-200/50 transition" aria-label="Open Journey Map">
                                <MenuIcon className="w-6 h-6 text-dark-text" />
                            </button>
                            <PomodoroTimer 
                                key={timerKey}
                                mode={appState === 'journey' ? 'focus' : 'break'}
                                onComplete={handleTimerComplete}
                            />
                        </header>
                        <main className="flex-1 flex items-center justify-center pt-20 pb-4 px-4">
                            {appState === 'journey' ? renderModule() : <GameModule onGameEnd={handleTimerComplete} stats={duckStats} onUpdateStats={handleUpdateDuckStats} />}
                        </main>
                        <AnimatePresence>
                           {isJourneyMapOpen && <JourneyMap modules={modules} currentIndex={currentModuleIndex} currentStatus={appState === 'journey' ? 'journey' : 'game'} onClose={() => setJourneyMapOpen(false)} />}
                        </AnimatePresence>
                    </motion.div>
                );
            case 'finished':
                return <CompletionScreen key="finished" onRestart={handleReset} reward={journeyReward} />;
            default:
                return null;
        }
    };
    
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 text-dark-text relative">
            <AnimatePresence mode="wait">
                {renderContent()}
            </AnimatePresence>
            <AnimatePresence>
               {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.5 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.5 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="fixed bottom-10 right-10 bg-accent text-white font-bold py-3 px-6 rounded-full shadow-xl z-50 flex items-center gap-2"
                        role="status"
                        aria-live="polite"
                    >
                        <span role="img" aria-label="coin">🪙</span>
                        {notification}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default App;

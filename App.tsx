
import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Module, ModuleType } from './types';
import { generateLearningJourney, generateRefresher, generateAssignmentJourney, generatePdf, checkAnswer } from './services/geminiService';
import { db } from './services/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from "firebase/firestore";

import UploadStep from './components/UploadStep';
import LoadingGame from './components/Loader';
import WelcomeModal from './components/WelcomeModal';
import JourneyMap from './components/JourneyMap';
import CompletionScreen from './components/CompletionScreen';
import PomodoroTimer from './components/PomodoroTimer';
import Dashboard from './components/Dashboard';
import LearnModule from './components/LearnModule';
import QuizModule from './components/QuizModule';
import MatchingGameModule from './components/MatchingGameModule';
import GameModule from './components/GameModule';
import AssignmentUpload from './components/AssignmentUpload';
import AssignmentModule from './components/AssignmentModule';

type AppState = 'dashboard' | 'upload' | 'loading' | 'welcome' | 'journey' | 'break' | 'finished' | 'assignmentUpload';

export interface Journey {
    id: string;
    title: string;
    modules: Module[];
    currentModuleIndex: number;
    createdAt: any;
}

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
    const [journeyTitle, setJourneyTitle] = useState('');
    const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [welcomeStep, setWelcomeStep] = useState(1);
    
    const [journeys, setJourneys] = useState<Journey[]>([]);
    const [journeysLoading, setJourneysLoading] = useState(true);

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
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [feedback, setFeedback] = useState<string | null>(null);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        const fetchJourneys = async () => {
            setJourneysLoading(true);
            const q = query(collection(db, "journeys"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const fetchedJourneys = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Journey));
            setJourneys(fetchedJourneys);
            setJourneysLoading(false);
        };

        fetchJourneys();
    }, []);


    const handleGenerateJourney = useCallback(async (text: string) => {
        setError(null);
        setAppState('loading');
        try {
            const journey = await generateLearningJourney(text);

            if (!journey || !journey.title || !journey.modules || journey.modules.length === 0) {
                throw new Error("Generated journey is incomplete or empty.");
            }
            setModules(journey.modules);
            setJourneyTitle(journey.title);
            setCurrentModuleIndex(0);
            setAppState('welcome');
            setWelcomeStep(1);
        } catch (err) {
            console.error("Error during journey generation:", err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
            setAppState('upload');
        }
    }, []);

    const handleGenerateAssignmentJourney = useCallback(async (text: string) => {
        setError(null);
        setAppState('loading');
        try {
            const journey = await generateAssignmentJourney(text);

            if (!journey || !journey.title || !journey.modules || journey.modules.length === 0) {
                throw new Error("Generated journey is incomplete or empty.");
            }
            setModules(journey.modules);
            setJourneyTitle(journey.title);
            setCurrentModuleIndex(0);
            setAppState('journey');
        } catch (err) {
            console.error("Error during journey generation:", err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
            setAppState('assignmentUpload');
        }
    }, []);

    const handleStartJourney = useCallback(() => {
        setAppState('journey');
        setTimerKey(Date.now());
    }, []);

    const handleNextModule = useCallback(() => {
        setRefresher(null);
        setFeedback(null);
        if (currentModuleIndex < modules.length - 1) {
            setCurrentModuleIndex(prev => prev + 1);
        } else {
            setDuckStats(prev => ({ ...prev, coins: prev.coins + JOURNEY_REWARD_COINS }));
            setJourneyReward(JOURNEY_REWARD_COINS);
            setAppState('finished');
        }
    }, [currentModuleIndex, modules.length]);

    const handleAnswerSubmit = async (answer: string) => {
        const question = modules[currentModuleIndex].questions?.[0]?.question;
        if (question) {
            setChecking(true);
            const { correct, feedback } = await checkAnswer(question, answer);
            setChecking(false);
            if (correct) {
                setAnswers(prev => ({ ...prev, [question]: answer }));
                handleNextModule();
            } else {
                setFeedback(feedback);
            }
        }
    };
    
    const handleIncorrectAnswer = useCallback(async (module: Module, questionIndex: number) => {
        const question = module.questions?.[questionIndex];
        if (question) {
            const hint = await generateRefresher(module.title, question.question);
            setRefresher({ content: hint, questionIndex });
        }
    }, []);

    const handleTimerComplete = useCallback(() => {
        if (appState === 'journey') {
            setDuckStats(prev => ({ ...prev, coins: prev.coins + FOCUS_SESSION_REWARD_COINS }));
            setNotification(`+${FOCUS_SESSION_REWARD_COINS} coins for your focus!`);
            setTimeout(() => setNotification(null), 3000);
            setAppState('break');
        } else if (appState === 'break') {
            setAppState('journey');
        }
    }, [appState]);

    const handleUpdateDuckStats = useCallback((newStats: Partial<DuckStats>) => {
        setDuckStats(prev => ({ ...prev, ...newStats }));
    }, []);

    const handleReset = useCallback(() => {
        setAppState('dashboard');
        setModules([]);
        setCurrentModuleIndex(0);
        setError(null);
        setAnswers({});
        setFeedback(null);
    }, []);

    const handleSaveJourney = async () => {
        setNotification("Attempting to save journey...");
        console.log("handleSaveJourney triggered.");

        try {
            // Check if there is content to save
            if (!journeyTitle || modules.length === 0) {
                console.error("Cannot save journey: title or modules are empty.");
                setNotification("Cannot save empty journey.");
                return;
            }

            const journeyCollection = collection(db, "journeys");
            console.log("Firestore collection reference created:", journeyCollection);
            
            const newJourneyData = {
                title: journeyTitle,
                modules,
                currentModuleIndex,
                createdAt: serverTimestamp()
            };
            console.log("Data to be saved:", newJourneyData);

            const docRef = await addDoc(journeyCollection, newJourneyData);
            console.log("SUCCESS! Document written with ID: ", docRef.id);
            
            const newJourneyForState = {
                ...newJourneyData,
                id: docRef.id,
                createdAt: { toDate: () => new Date() } // Simulate server timestamp for immediate UI update
            };
            
            setJourneys(prev => [newJourneyForState, ...prev]);
            setNotification("Journey saved successfully!");
            
            setTimeout(() => {
                setAppState('dashboard');
                setNotification(null);
            }, 1500);

        } catch (error) {
            console.error("FIRESTORE SAVE ERROR:", error);
            setNotification(`Failed to save journey. See console for details. Error: ${error.message || 'Unknown error'}`);
            setTimeout(() => setNotification(null), 5000);
        }
    };

    const handleLoadJourney = (modules: Module[], currentIndex: number, title: string) => {
        setModules(modules);
        setCurrentModuleIndex(currentIndex);
        setJourneyTitle(title);
        setAppState('journey');
    };

    const handleStartAssignment = () => {
        setAppState('assignmentUpload');
    };

    const renderModule = () => {
        const module = modules[currentModuleIndex];
        if (!module) return null;

        switch (module.type) {
            case ModuleType.Learn:
                return <LearnModule module={module} onComplete={handleNextModule} />;
            case ModuleType.Quiz:
            case ModuleType.Test:
                return <QuizModule 
                            module={module} 
                            onComplete={handleNextModule} 
                            onIncorrect={handleIncorrectAnswer}
                            refresher={refresher}
                            onClearRefresher={() => setRefresher(null)}
                        />;
            case ModuleType.MatchingGame:
                return <MatchingGameModule module={module} onComplete={handleNextModule} />;
            case ModuleType.Assignment:
                return <AssignmentModule module={module} onComplete={handleAnswerSubmit} feedback={feedback} checking={checking} />;
            default:
                return <div className="text-center">Unsupported module type. <button onClick={handleNextModule} className="underline">Skip</button></div>;
        }
    };

    if (appState === 'journey' || appState === 'break') {
        return (
            <div className="min-h-screen w-full flex text-dark-text relative">
                <JourneyMap modules={modules} currentIndex={currentModuleIndex} currentStatus={appState === 'journey' ? 'journey' : 'game'} onSave={handleSaveJourney} />
                <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
                    <header className="w-full p-4 flex justify-end items-center absolute top-0 left-0 z-10">
                         <PomodoroTimer 
                            key={timerKey}
                            mode={appState === 'journey' ? 'focus' : 'break'}
                            onComplete={handleTimerComplete}
                        />
                         <button onClick={() => setAppState('dashboard')} className="ml-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">Dashboard</button>
                    </header>
                    <main className="flex-1 flex items-center justify-center pt-20 pb-4 px-4 w-full">
                        {appState === 'journey' ? renderModule() : <GameModule onGameEnd={handleTimerComplete} stats={duckStats} onUpdateStats={handleUpdateDuckStats} />}
                    </main>
                </div>
                 <AnimatePresence>
                   {notification && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.5 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.5 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="fixed bottom-10 right-10 bg-accent text-white font-bold py-3 px-6 rounded-full shadow-xl z-50"
                        >
                            {notification}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }
    
    const renderContent = () => {
         switch (appState) {
            case 'dashboard':
                return <Dashboard 
                            journeys={journeys} 
                            loading={journeysLoading}
                            onLoadJourney={handleLoadJourney} 
                            onStartNewJourney={() => setAppState('upload')}
                            onStartAssignment={handleStartAssignment}
                        />;
            case 'upload':
                return <UploadStep 
                            key="upload" 
                            onStart={handleGenerateJourney} 
                            error={error} 
                            onViewJourneys={() => setAppState('dashboard')}
                            onStartAssignment={handleStartAssignment} 
                        />;
            case 'assignmentUpload':
                return <AssignmentUpload
                            key="assignmentUpload"
                            onStart={handleGenerateAssignmentJourney}
                            error={error}
                            onViewJourneys={() => setAppState('dashboard')}
                            onCreateJourney={() => setAppState('upload')}
                        />;
            case 'loading':
                return <LoadingGame key="loading" message="AI is building your personalized journey..." />;
            case 'welcome':
                return <WelcomeModal key="welcome" step={welcomeStep} onNext={() => setWelcomeStep(2)} onStart={handleStartJourney} />;
            case 'finished':
                return <CompletionScreen 
                            key="finished" 
                            onRestart={handleReset} 
                            reward={journeyReward} 
                            onDownloadPdf={() => generatePdf(answers)} 
                        />;
            default:
                return null;
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 text-dark-text relative">
            <AnimatePresence mode="wait">
                {renderContent()}
            </AnimatePresence>
        </div>
    );
};

export default App;

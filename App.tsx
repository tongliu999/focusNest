
import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Module, ModuleType } from './types';
import { generateLearningJourney, generateRefresher, generateAssignmentJourney, checkAnswer } from './services/geminiService';
import { db } from './firebaseConfig.ts';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from "firebase/firestore";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
import AssignmentUpload from './components/AssignmentUpload';
import AssignmentModule from './components/AssignmentModule';
import BreakScreen from './components/BreakScreen';
import { ChevronRightIcon } from './components/icons';

type AppState = 'dashboard' | 'upload' | 'loading' | 'welcome' | 'journey' | 'break' | 'finished' | 'assignmentUpload';

export interface Journey {
    id: string;
    title: string;
    modules: Module[];
    currentModuleIndex: number;
    highestModuleIndex?: number;
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
    const [highestModuleIndex, setHighestModuleIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [welcomeStep, setWelcomeStep] = useState(1);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [isJourneyActive, setIsJourneyActive] = useState(false);
    
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
            setHighestModuleIndex(0);
            setIsJourneyActive(true);
            setAppState('welcome');
            setWelcomeStep(1);
        } catch (err) {
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
            setHighestModuleIndex(0);
            setIsJourneyActive(true);
            setAppState('journey');
        } catch (err) {
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
            const newIndex = currentModuleIndex + 1;
            setCurrentModuleIndex(newIndex);
            if (newIndex > highestModuleIndex) {
                setHighestModuleIndex(newIndex);
            }
        } else {
            setDuckStats(prev => ({ ...prev, coins: prev.coins + JOURNEY_REWARD_COINS }));
            setJourneyReward(JOURNEY_REWARD_COINS);
            setIsJourneyActive(false);
            setAppState('finished');
        }
    }, [currentModuleIndex, modules.length, highestModuleIndex]);

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
        setHighestModuleIndex(0);
        setError(null);
        setAnswers({});
        setFeedback(null);
        setIsJourneyActive(false);
    }, []);

    const handleSaveJourney = async () => {
        setNotification("Attempting to save journey...");

        try {
            if (!journeyTitle || modules.length === 0) {
                setNotification("Cannot save empty journey.");
                return;
            }

            const journeyCollection = collection(db, "journeys");
            
            const newJourneyData = {
                title: journeyTitle,
                modules,
                currentModuleIndex,
                highestModuleIndex,
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(journeyCollection, newJourneyData);
            
            const newJourneyForState = {
                ...newJourneyData,
                id: docRef.id,
                createdAt: { toDate: () => new Date() }
            };
            
            setJourneys(prev => [newJourneyForState, ...prev]);
            setNotification("Journey saved successfully!");
            
            setTimeout(() => {
                setAppState('dashboard');
                setNotification(null);
            }, 1500);

        } catch (error) {
            setNotification(`Failed to save journey. See console for details. Error: ${error.message || 'Unknown error'}`);
            setTimeout(() => setNotification(null), 5000);
        }
    };

    const handleLoadJourney = (modules: Module[], currentIndex: number, title: string, highestIndex?: number) => {
        setModules(modules);
        setCurrentModuleIndex(currentIndex);
        setHighestModuleIndex(highestIndex || currentIndex);
        setJourneyTitle(title);
        setIsJourneyActive(true);
        setAppState('journey');
    };

    const handleStartAssignment = () => {
        setAppState('assignmentUpload');
    };

    const handleModuleSelect = (index: number) => {
        if (index <= highestModuleIndex) {
            setCurrentModuleIndex(index);
        }
    };
    
    const handleResumeJourney = () => {
        setAppState('journey');
    };
    
    const generatePdf = async (answers: { [key: string]: string }) => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const content = document.createElement('div');
        content.style.width = '210mm';
        content.style.padding = '20mm';
        content.style.backgroundColor = 'white';
        content.style.color = '#1F2937';
        content.style.fontFamily = 'Inter, sans-serif';

        let html = '<h1 style="font-size: 28px; font-weight: 700; color: #6D28D9; margin-bottom: 24px;">Assignment Answers</h1>';

        for (const question in answers) {
            html += `
                <div style="margin-bottom: 20px; page-break-inside: avoid;">
                    <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">${question}</h2>
                    <p style="font-size: 14px; color: #6B7280; white-space: pre-wrap; line-height: 1.6;">${answers[question]}</p>
                </div>
            `;
        }
        
        content.innerHTML = html;
        document.body.appendChild(content);

        const canvas = await html2canvas(content, { scale: 2 });
        document.body.removeChild(content);

        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        let heightLeft = pdfHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();

        while (heightLeft > 0) {
            position = heightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
        }
        
        pdf.save('assignment-answers.pdf');
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
    
    if (appState === 'break') {
        return <BreakScreen onComplete={() => setAppState('journey')} />;
    }

    if (appState === 'journey') {
        return (
            <div className="min-h-screen w-full flex text-dark-text relative">
                <JourneyMap 
                    modules={modules} 
                    currentIndex={currentModuleIndex} 
                    highestIndex={highestModuleIndex}
                    currentStatus='journey'
                    onSave={handleSaveJourney}
                    onModuleSelect={handleModuleSelect}
                    isVisible={isSidebarVisible}
                    onToggleVisibility={() => setIsSidebarVisible(prev => !prev)}
                />
                <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
                    <header className="w-full p-4 flex justify-between items-center absolute top-0 left-0 z-10">
                         {!isSidebarVisible && (
                            <button 
                                onClick={() => setIsSidebarVisible(true)}
                                className="p-2 rounded-md hover:bg-gray-200"
                            >
                                <ChevronRightIcon className="w-6 h-6" />
                            </button>
                         )}
                         <div className="flex-grow" />
                         <PomodoroTimer 
                            key={timerKey}
                            mode='focus'
                            onComplete={handleTimerComplete}
                        />
                         <button onClick={() => setAppState('dashboard')} className="ml-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">Dashboard</button>
                    </header>
                    <main className="flex-1 flex items-center justify-center pt-20 pb-4 px-4 w-full">
                        {renderModule()}
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
                const enrichedJourneys = journeys.map(j => ({ ...j, highestModuleIndex: j.highestModuleIndex || j.currentModuleIndex }));
                return <Dashboard 
                            journeys={enrichedJourneys} 
                            loading={journeysLoading}
                            onLoadJourney={(modules, index, title, highestIndex) => handleLoadJourney(modules, index, title, highestIndex)} 
                            onStartNewJourney={() => setAppState('upload')}
                            onStartAssignment={handleStartAssignment}
                            onResumeJourney={handleResumeJourney}
                            isJourneyActive={isJourneyActive}
                        />;
            case 'upload':
                return <UploadStep 
                            key="upload" 
                            onStart={handleGenerateJourney} 
                            error={error} 
                            onViewJourneys={() => setAppState('dashboard')}
                            onStartAssignment={handleStartAssignment} 
                            onResumeJourney={handleResumeJourney}
                            isJourneyActive={isJourneyActive}
                        />;
            case 'assignmentUpload':
                return <AssignmentUpload
                            key="assignmentUpload"
                            onStart={handleGenerateAssignmentJourney}
                            error={error}
                            onViewJourneys={() => setAppState('dashboard')}
                            onCreateJourney={() => setAppState('upload')}
                            onResumeJourney={handleResumeJourney}
                            isJourneyActive={isJourneyActive}
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

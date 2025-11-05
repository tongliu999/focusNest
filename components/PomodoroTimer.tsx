import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlayIcon, PauseIcon, ResetIcon, ArrowRightIcon } from './icons';
import { FOCUS_DURATION, BREAK_DURATION } from '../App';

interface PomodoroTimerProps {
  mode: 'focus' | 'break';
  onComplete: () => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ mode, onComplete }) => {
    const duration = useMemo(() => (mode === 'focus' ? FOCUS_DURATION : BREAK_DURATION), [mode]);
    
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isRunning, setIsRunning] = useState(true);

    useEffect(() => {
        setTimeLeft(duration);
        setIsRunning(true);
    }, [duration]);

    useEffect(() => {
        if (!isRunning) return;

        if (timeLeft <= 0) {
            onComplete();
            return;
        }

        const intervalId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timeLeft, isRunning, onComplete]);

    const toggleTimer = () => {
        setIsRunning(prev => !prev);
    };

    const resetTimer = () => {
        setTimeLeft(duration);
        setIsRunning(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const progress = (duration - timeLeft) / duration;
    const strokeDashoffset = 283 * (1 - progress); // 2 * PI * 45 (radius)

    const ringColor = mode === 'focus' ? 'stroke-primary' : 'stroke-secondary';

    return (
        <div className="flex items-center gap-4 bg-white/70 backdrop-blur-lg p-2 pr-4 rounded-full shadow-md border border-white/50">
            <div className="relative w-12 h-12">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle className="stroke-current text-gray-200" strokeWidth="10" cx="50" cy="50" r="45" fill="transparent" />
                    {/* Progress circle */}
                    <motion.circle
                        className={`transform -rotate-90 origin-center ${ringColor}`}
                        strokeWidth="10"
                        strokeDasharray="283"
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        cx="50" cy="50" r="45"
                        fill="transparent"
                        transition={{ duration: 1, ease: "linear" }}
                    />
                </svg>
                 <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-dark-text">
                    {formatTime(timeLeft)}
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button onClick={toggleTimer} className="p-2 text-dark-text hover:text-primary transition-colors rounded-full" aria-label={isRunning ? 'Pause timer' : 'Play timer'}>
                    {isRunning ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                </button>
                <button onClick={resetTimer} className="p-2 text-dark-text hover:text-accent transition-colors rounded-full" aria-label="Reset timer">
                    <ResetIcon className="w-5 h-5" />
                </button>
                {mode === 'focus' && (
                    <button onClick={onComplete} className="p-2 text-dark-text hover:text-secondary transition-colors rounded-full" aria-label="Skip to break">
                        <ArrowRightIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default PomodoroTimer;
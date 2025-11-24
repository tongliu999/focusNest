import React, { useState, useEffect } from 'react';
import { BREAK_DURATION } from '../App';

interface BreakScreenProps {
    onComplete: () => void;
}

const BreakScreen: React.FC<BreakScreenProps> = ({ onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(BREAK_DURATION);

    useEffect(() => {
        if (timeLeft <= 0) {
            onComplete();
            return;
        }

        const intervalId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timeLeft, onComplete]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="text-center">
                <h1 className="text-5xl font-bold text-white mb-4">Time for a break!</h1>
                <p className="text-2xl text-gray-300">Stretch, grab some water, or just rest your eyes.</p>
                <p className="text-4xl text-white font-mono mt-8">{formatTime(timeLeft)}</p>
                <button
                    onClick={onComplete}
                    className="mt-8 px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-colors"
                >
                    Skip Break
                </button>
            </div>
        </div>
    );
};

export default BreakScreen;

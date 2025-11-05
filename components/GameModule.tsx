

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DuckStats } from '../App';
import { RunningIcon, ArrowUpIcon, HeartIcon } from './icons';

// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const DUCK_WIDTH = 40;
const DUCK_HEIGHT = 30;
const DUCK_X_POSITION = GAME_WIDTH * 0.1;
const GRAVITY = 0.7;
const COIN_SIZE = 20;

const BASE_SPEED = 3;
const BASE_JUMP_FORCE = 13;
const SPEED_UPGRADE_COST_BASE = 10;
const JUMP_UPGRADE_COST_BASE = 15;
const LIVES_UPGRADE_COST_BASE = 50;
const REVIVE_COST = 25;

interface GameModuleProps {
    onGameEnd: () => void;
    stats: DuckStats;
    onUpdateStats: (newStats: Partial<DuckStats>) => void;
}

type GameState = 'idle' | 'preGame' | 'playing' | 'gameOver';
type Coin = { id: number; x: number; y: number };

const GameModule: React.FC<GameModuleProps> = ({ onGameEnd, stats, onUpdateStats }) => {
    const [gameState, setGameState] = useState<GameState>('idle');
    const [duck, setDuck] = useState({ y: GAME_HEIGHT / 2, vy: 0 });
    const [coins, setCoins] = useState<Coin[]>([]);
    const [score, setScore] = useState(0);
    const [runCoins, setRunCoins] = useState(0);
    const [countdown, setCountdown] = useState(3);
    const [currentLives, setCurrentLives] = useState(1);
    const [isRecovering, setIsRecovering] = useState(false);
    const [hasRevivedThisRun, setHasRevivedThisRun] = useState(false);
    
    const gameLoopRef = useRef<number | null>(null);
    const framesRef = useRef(0);

    const playerSpeed = BASE_SPEED + stats.speed * 0.3;
    const playerJumpForce = BASE_JUMP_FORCE + stats.jumpHeight * 0.7;
    const spawnRate = Math.max(70 - stats.speed * 2, 40);

    const resetGame = useCallback(() => {
        setDuck({ y: GAME_HEIGHT / 2, vy: 0 });
        setCoins([]);
        setScore(0);
        setRunCoins(0);
        framesRef.current = 0;
        setCurrentLives(stats.duckLives);
        setHasRevivedThisRun(false);
    }, [stats.duckLives]);

    const startGame = () => {
        resetGame();
        setCountdown(3);
        setGameState('preGame');
    };
    
    // Countdown effect
    useEffect(() => {
        if (gameState !== 'preGame') return;

        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev > 1) {
                    return prev - 1;
                } else {
                    clearInterval(countdownInterval);
                    setGameState('playing');
                    return 0;
                }
            });
        }, 1000);

        return () => clearInterval(countdownInterval);
    }, [gameState]);
    
    const gameTick = useCallback(() => {
        framesRef.current += 1;

        // Duck physics
        setDuck(d => {
            let newVy = d.vy - GRAVITY;
            let newY = d.y + newVy;

            // Boundary collision
            if ((newY <= 0 || newY >= GAME_HEIGHT - DUCK_HEIGHT) && !isRecovering) {
                if (currentLives > 1) {
                    setCurrentLives(l => l - 1);
                    setIsRecovering(true);
                    setTimeout(() => setIsRecovering(false), 1500); // 1.5s of invincibility
                    
                    // Reset position and velocity to recover
                    newY = GAME_HEIGHT / 2;
                    newVy = 0;
                } else {
                    setGameState('gameOver');
                    return d; // Return current state to avoid rendering the duck out of bounds for a frame
                }
            }
            return { y: newY, vy: newVy };
        });

        // Coin logic
        setCoins(cns => cns.map(c => ({ ...c, x: c.x - playerSpeed })).filter(c => c.x > -COIN_SIZE));

        // Spawning new coins
        if (framesRef.current % Math.floor(spawnRate) === 0) {
            const coinY = Math.random() * (GAME_HEIGHT - COIN_SIZE - 40) + 20; // Spawn away from edges
            setCoins(cns => [...cns, { id: Date.now(), x: GAME_WIDTH, y: coinY }]);
        }

        // Collision detection for coins
        const duckRect = { x: DUCK_X_POSITION, y: duck.y, width: DUCK_WIDTH, height: DUCK_HEIGHT };
        setCoins(prevCoins => prevCoins.filter(c => {
             const coinRect = { x: c.x, y: c.y, width: COIN_SIZE, height: COIN_SIZE };
             if (duckRect.x < coinRect.x + coinRect.width && duckRect.x + duckRect.width > coinRect.x &&
                duckRect.y < coinRect.y + coinRect.height && duckRect.y + duckRect.height > coinRect.y) {
                 setRunCoins(rc => rc + 1);
                 return false; // remove coin
             }
             return true;
        }));

        setScore(s => s + 1);
        gameLoopRef.current = requestAnimationFrame(gameTick);
    }, [duck.y, playerSpeed, spawnRate, currentLives, isRecovering]);

    useEffect(() => {
        if (gameState === 'playing') {
            gameLoopRef.current = requestAnimationFrame(gameTick);
        }
        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, [gameState, gameTick]);

    useEffect(() => {
        const handleJump = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault(); // Prevent page from scrolling
                if (gameState === 'playing') {
                  setDuck(d => ({ ...d, vy: playerJumpForce }));
                }
            }
        };
        window.addEventListener('keydown', handleJump);
        return () => window.removeEventListener('keydown', handleJump);
    }, [gameState, playerJumpForce]);
    
    const handleUpgrade = (stat: 'speed' | 'jumpHeight' | 'duckLives') => {
        const cost = stat === 'speed' 
            ? SPEED_UPGRADE_COST_BASE * stats.speed 
            : stat === 'jumpHeight' 
            ? JUMP_UPGRADE_COST_BASE * stats.jumpHeight
            : LIVES_UPGRADE_COST_BASE * stats.duckLives;

        if (stats.coins >= cost) {
            onUpdateStats({
                coins: stats.coins - cost,
                [stat]: stats[stat] + 1
            });
        }
    };
    
    const handleContinue = () => {
        onUpdateStats({ coins: stats.coins + runCoins });
        setGameState('idle');
        onGameEnd();
    };
    
    const handleRevive = () => {
        if (stats.coins >= REVIVE_COST && !hasRevivedThisRun) {
            onUpdateStats({ coins: stats.coins - REVIVE_COST });
            setHasRevivedThisRun(true);
            
            // Reset game state but keep score and runCoins
            setDuck({ y: GAME_HEIGHT / 2, vy: 0 });
            setCoins([]);
            framesRef.current = 0;
            setCurrentLives(1); // Give one life back
            
            setCountdown(3);
            setGameState('preGame');
        }
    };

    const renderUpgradeButton = (stat: 'speed' | 'jumpHeight' | 'duckLives', cost: number, level: number, title: string, icon: React.ReactNode) => {
        return (
            <div className="bg-white/50 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 font-bold text-dark-text">
                    {icon} {title} (Lvl {level})
                </div>
                <p className="text-sm text-light-text my-1">Next upgrade cost: {cost} coins</p>
                <button
                    onClick={() => handleUpgrade(stat)}
                    disabled={stats.coins < cost}
                    className="w-full text-sm py-1 px-3 bg-primary text-white font-semibold rounded-md shadow-sm hover:bg-primary-light transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Upgrade
                </button>
            </div>
        );
    };

    const isGameActive = gameState === 'playing' || gameState === 'preGame';

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-center p-4">
             <AnimatePresence mode="wait">
            {!isGameActive && (
                 <motion.div
                    key={gameState}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full"
                >
                    {gameState === 'idle' && (
                        <div className="bg-white p-8 rounded-2xl shadow-lg">
                            <h2 className="text-3xl font-bold">Duck Dash!</h2>
                            <p className="mt-2 mb-6 text-lg text-light-text">Time for a brain break. Help your duck fly!</p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="py-3 px-8 bg-secondary text-white font-semibold rounded-xl shadow-md hover:bg-secondary-light transition-colors duration-300 animate-pulse-strong"
                            >
                                Play Game
                            </motion.button>
                            <div className="mt-8 pt-4 border-t border-gray-200">
                                <h3 className="text-xl font-bold mb-4">Upgrades</h3>
                                <p className="text-sm text-light-text mb-4">You have <span className="font-bold text-dark-text">{stats.coins} 🪙</span></p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {renderUpgradeButton('speed', SPEED_UPGRADE_COST_BASE * stats.speed, stats.speed, 'Speed', <RunningIcon className="w-5 h-5" />)}
                                    {renderUpgradeButton('jumpHeight', JUMP_UPGRADE_COST_BASE * stats.jumpHeight, stats.jumpHeight, 'Jump', <ArrowUpIcon className="w-5 h-5" />)}
                                    {renderUpgradeButton('duckLives', LIVES_UPGRADE_COST_BASE * stats.duckLives, stats.duckLives, 'Max Lives', <HeartIcon className="w-5 h-5 text-red-500" />)}
                                </div>
                            </div>
                        </div>
                    )}
                    {gameState === 'gameOver' && (
                         <div className="bg-white p-8 rounded-2xl shadow-lg">
                            <h2 className="text-3xl font-bold">Game Over!</h2>
                            <p className="mt-2 text-lg text-light-text">Great run!</p>
                            <div className="my-6">
                                <p className="text-xl font-bold text-dark-text bg-gray-100 py-2 px-4 rounded-full inline-block">
                                    Final Score: {score}
                                </p>
                                <p className="text-xl font-bold text-amber-500 bg-amber-100/50 py-2 px-4 rounded-full inline-block ml-4">
                                    + {runCoins} Coins!
                                </p>
                            </div>
                             <div className="flex items-center justify-center gap-4 mt-6">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleContinue}
                                    className="py-3 px-8 bg-primary text-white font-semibold rounded-xl shadow-md hover:bg-primary-light transition-colors duration-300"
                                >
                                    Continue
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleRevive}
                                    disabled={stats.coins < REVIVE_COST || hasRevivedThisRun}
                                    className="py-3 px-8 bg-accent text-white font-semibold rounded-xl shadow-md hover:bg-amber-500 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Revive ({REVIVE_COST} 🪙)
                                </motion.button>
                            </div>
                            {(stats.coins < REVIVE_COST || hasRevivedThisRun) && (
                                <p className="text-xs text-light-text mt-3">
                                    {hasRevivedThisRun ? "You can only revive once per run." : "Not enough coins to revive."}
                                </p>
                            )}
                         </div>
                    )}
                </motion.div>
            )}
            </AnimatePresence>

            {isGameActive && (
                <div 
                    className="bg-sky-200 rounded-2xl overflow-hidden relative shadow-lg border-4 border-white"
                    style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
                    onClick={() => {
                        if (gameState === 'playing') {
                            setDuck(d => ({ ...d, vy: playerJumpForce }));
                        }
                    }}
                >
                    <div 
                        className="absolute top-4 left-4 flex items-center gap-2 bg-white/70 backdrop-blur-sm p-2 pr-3 rounded-full shadow-md"
                    >
                         <HeartIcon className="w-6 h-6 text-red-500" />
                         <span className="font-bold text-lg text-dark-text">{currentLives}</span>
                    </div>

                    <div className="absolute top-4 right-4 bg-white/70 backdrop-blur-sm p-2 px-4 rounded-full shadow-md font-bold text-lg text-dark-text">
                        Score: {score}
                    </div>

                    {/* Duck */}
                    <motion.div 
                        className="absolute bg-yellow-400 rounded-md"
                        style={{
                            width: DUCK_WIDTH, height: DUCK_HEIGHT,
                            left: DUCK_X_POSITION,
                        }}
                        animate={{ 
                            y: GAME_HEIGHT - duck.y - DUCK_HEIGHT,
                            opacity: isRecovering ? [1, 0.3, 1, 0.3, 1] : 1,
                        }}
                        transition={{ 
                            y: { type: 'spring', damping: 100, stiffness: 1000, mass: 0.5},
                            opacity: { duration: 1.5, ease: "linear" }
                        }}
                    >
                        <div className="absolute w-2 h-2 bg-black rounded-full" style={{ top: '8px', right: '5px' }}></div>
                        <div className="absolute bg-orange-500 w-4 h-2" style={{ top: '12px', right: '-10px', clipPath: 'polygon(0 0, 100% 50%, 0 100%)'}}></div>
                    </motion.div>
                    
                    {/* Coins */}
                    {coins.map(c => (
                        <div 
                            key={c.id}
                            className="absolute bg-amber-400 rounded-full border-2 border-amber-600 flex items-center justify-center font-bold text-amber-800 text-xs"
                            style={{ width: COIN_SIZE, height: COIN_SIZE, left: c.x, top: c.y }}
                        >
                            $
                        </div>
                    ))}
                    
                    {gameState === 'preGame' && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <motion.div
                                key={countdown}
                                initial={{ scale: 2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                className="text-8xl font-bold text-white"
                            >
                                {countdown}
                            </motion.div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GameModule;
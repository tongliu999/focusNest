
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

// Game constants
const GAME_WIDTH = 320;
const GAME_HEIGHT = 150;
const PLAYER_WIDTH = 20;
const PLAYER_HEIGHT = 40;
const PLAYER_GROUND_Y = 10;
const PLAYER_X_POSITION = GAME_WIDTH * 0.15;
const GRAVITY = 0.6;
const JUMP_FORCE = 12;
const OBSTACLE_SPEED = 3;
const OBSTACLE_MIN_HEIGHT = 20;
const OBSTACLE_MAX_HEIGHT = 50;
const OBSTACLE_MIN_WIDTH = 20;
const OBSTACLE_MAX_WIDTH = 35;
const OBSTACLE_SPAWN_RATE = 90; // frames

interface LoadingGameProps {
  message: string;
}

const LoadingGame: React.FC<LoadingGameProps> = ({ message }) => {
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [player, setPlayer] = useState({ y: PLAYER_GROUND_Y, vy: 0 });
  const [obstacles, setObstacles] = useState<{ id: number; x: number; width: number; height: number }[]>([]);
  // FIX: useRef<number>() requires an initial value. Initialize with null.
  const gameLoopRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);

  const resetGame = useCallback(() => {
    setPlayer({ y: PLAYER_GROUND_Y, vy: 0 });
    setObstacles([{ 
        id: Date.now(), 
        x: GAME_WIDTH, 
        width: 20, 
        height: 20 
    }]);
    frameCountRef.current = 0;
    setGameState('playing');
  }, []);

  // Initialize game on mount
  useEffect(() => {
    resetGame();
  }, [resetGame]);
  
  const gameTick = useCallback(() => {
    // --- Player physics ---
    setPlayer(p => {
        let newVy = p.vy - GRAVITY;
        let newY = p.y + newVy;
        if (newY <= PLAYER_GROUND_Y) {
            newY = PLAYER_GROUND_Y;
            newVy = 0;
        }
        return { y: newY, vy: newVy };
    });

    // --- Obstacle logic ---
    frameCountRef.current += 1;
    setObstacles(currentObstacles => {
        let newObstacles = currentObstacles
            .map(o => ({ ...o, x: o.x - OBSTACLE_SPEED }))
            .filter(o => o.x > -o.width);

        if (frameCountRef.current % OBSTACLE_SPAWN_RATE === 0) {
            const id = Date.now();
            const height = Math.random() * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT) + OBSTACLE_MIN_HEIGHT;
            const width = Math.random() * (OBSTACLE_MAX_WIDTH - OBSTACLE_MIN_WIDTH) + OBSTACLE_MIN_WIDTH;
            newObstacles.push({ id, x: GAME_WIDTH + width, width, height });
        }
        return newObstacles;
    });

    gameLoopRef.current = requestAnimationFrame(gameTick);
  }, []);
  
  // Start/stop game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameTick);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameTick]);
  
  // Collision detection
  useEffect(() => {
    if (gameState !== 'playing') return;
    const playerRect = { x: PLAYER_X_POSITION, y: player.y, width: PLAYER_WIDTH, height: PLAYER_HEIGHT };
    for (const obstacle of obstacles) {
      const obstacleRect = { x: obstacle.x, y: PLAYER_GROUND_Y, width: obstacle.width, height: obstacle.height };
      if (
        playerRect.x < obstacleRect.x + obstacleRect.width &&
        playerRect.x + PLAYER_WIDTH * 0.5 > obstacleRect.x &&
        playerRect.y < obstacleRect.y + obstacleRect.height &&
        playerRect.y + PLAYER_HEIGHT > obstacleRect.y
      ) {
        setGameState('gameOver');
        return;
      }
    }
  }, [player.y, obstacles, gameState]);
  
  // Keyboard input for jumping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameState === 'playing' && player.y === PLAYER_GROUND_Y) {
        setPlayer(p => ({ ...p, vy: JUMP_FORCE }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, player.y]);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/30 w-full max-w-sm">
      <h2 className="text-xl font-bold text-primary mb-2">Loading...</h2>
      
      <div 
        className="relative bg-violet-50 rounded-lg overflow-hidden border-2 border-gray-300"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* Player Stick Figure */}
        <div 
          className="absolute"
          style={{
            width: PLAYER_WIDTH,
            height: PLAYER_HEIGHT,
            left: `${PLAYER_X_POSITION}px`,
            bottom: `${player.y}px`,
            transform: gameState === 'gameOver' ? `rotate(-90deg)` : 'none',
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease-out',
          }}
        >
          <div className="w-full h-full relative">
            <div className="absolute w-4 h-4 bg-dark-text rounded-full" style={{ top: '-10px', left: '2px' }}></div>
            <div className="absolute w-0.5 h-full bg-dark-text" style={{ left: '9px' }}></div>
            <div className="absolute w-full h-0.5 bg-dark-text" style={{ top: '8px' }}></div>
          </div>
        </div>

        {/* Obstacles */}
        {obstacles.map(o => (
          <div
            key={o.id}
            className="absolute bg-gray-500 rounded-sm"
            style={{
              width: o.width,
              height: o.height,
              left: `${o.x}px`,
              bottom: `${PLAYER_GROUND_Y}px`,
            }}
          />
        ))}
        
        {/* Ground */}
        <div 
          className="absolute bottom-0 left-0 w-full bg-gray-400"
          style={{ height: PLAYER_GROUND_Y }}
        ></div>

        {/* Game Over Overlay */}
        {gameState === 'gameOver' && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center animate-fade-in">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={resetGame}
              className="py-2 px-8 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-light transition-colors duration-300"
            >
              Restart
            </motion.button>
          </div>
        )}
      </div>

      <div className="h-9 mt-4 flex items-center justify-center">
        {gameState === 'playing' && (
          <p className="text-sm text-light-text">Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Space</kbd> to jump</p>
        )}
      </div>

      <p className="mt-2 text-lg font-semibold text-dark-text">{message}</p>
    </div>
  );
};

export default LoadingGame;

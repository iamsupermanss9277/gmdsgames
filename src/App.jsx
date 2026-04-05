import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Info, Home, Search, ExternalLink, ArrowLeft, Github, Twitter, User, Globe, AlertCircle, Play, RotateCcw } from 'lucide-react';
import gamesData from './data/games.json';

// --- Custom Game Component: Square Jump ---
const SquareJump = () => {
  const [gameState, setGameState] = useState('start'); // start, playing, gameover
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState([]);
  const gameRef = useRef(null);
  const playerY = useRef(0);
  const velocity = useRef(0);
  const frameRef = useRef();

  const jump = () => {
    if (gameState === 'playing' && !isJumping) {
      setIsJumping(true);
      velocity.current = -12;
    } else if (gameState !== 'playing') {
      startGame();
    }
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setObstacles([]);
    playerY.current = 0;
    velocity.current = 0;
    setIsJumping(false);
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const update = () => {
      // Gravity
      velocity.current += 0.6;
      playerY.current += velocity.current;

      // Ground collision
      if (playerY.current >= 0) {
        playerY.current = 0;
        velocity.current = 0;
        setIsJumping(false);
      }

      // Update obstacles
      setObstacles(prev => {
        const next = prev
          .map(obs => ({ ...obs, x: obs.x - 5 }))
          .filter(obs => obs.x > -50);
        
        // Spawn new obstacle
        if (prev.length === 0 || prev[prev.length - 1].x < 400) {
          if (Math.random() < 0.02) {
            next.push({ id: Date.now(), x: 800 });
          }
        }
        return next;
      });

      // Collision detection
      setObstacles(prev => {
        const playerRect = { x: 50, y: 170 + playerY.current, w: 30, h: 30 };
        for (const obs of prev) {
          const obsRect = { x: obs.x, y: 170, w: 30, h: 30 };
          if (
            playerRect.x < obsRect.x + obsRect.w &&
            playerRect.x + playerRect.w > obsRect.x &&
            playerRect.y < obsRect.y + obsRect.h &&
            playerRect.y + playerRect.h > obsRect.y
          ) {
            setGameState('gameover');
            return prev;
          }
        }
        return prev;
      });

      setScore(s => s + 1);
      frameRef.current = requestAnimationFrame(update);
    };

    frameRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameRef.current);
  }, [gameState]);

  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score]);

  return (
    <div 
      className="w-full h-[400px] bg-slate-900 rounded-xl relative overflow-hidden cursor-pointer select-none border-4 border-slate-800"
      onClick={jump}
      tabIndex={0}
      onKeyDown={(e) => e.code === 'Space' && jump()}
    >
      {/* Background elements */}
      <div className="absolute bottom-0 w-full h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" style={{ transform: `translateY(${-200}px)` }} />
      
      {/* Ground */}
      <div className="absolute bottom-0 w-full h-[200px] bg-slate-800 border-t-4 border-slate-700" />

      {/* Player */}
      <motion.div 
        className="absolute left-[50px] w-[30px] h-[30px] bg-blue-400 rounded-sm shadow-[0_0_15px_rgba(96,165,250,0.8)]"
        animate={{ 
          y: 170 + playerY.current,
          rotate: isJumping ? 90 : 0
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />

      {/* Obstacles */}
      {obstacles.map(obs => (
        <div 
          key={obs.id}
          className="absolute w-[30px] h-[30px] bg-red-500 rounded-sm shadow-[0_0_15px_rgba(239,68,68,0.8)]"
          style={{ left: obs.x, top: 170 }}
        />
      ))}

      {/* UI */}
      <div className="absolute top-4 right-4 text-right">
        <div className="text-white font-bold text-2xl">Score: {Math.floor(score / 10)}</div>
        <div className="text-slate-400 text-sm">Best: {Math.floor(highScore / 10)}</div>
      </div>

      <AnimatePresence>
        {gameState === 'start' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-4"
          >
            <h2 className="text-3xl font-black mb-2">SQUARE JUMP</h2>
            <p className="text-slate-300 mb-6">Click or Space to Jump</p>
            <button className="roblox-button flex items-center gap-2">
              <Play className="w-5 h-5" /> Start Game
            </button>
          </motion.div>
        )}

        {gameState === 'gameover' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-900/60 flex flex-col items-center justify-center text-center p-4 backdrop-blur-sm"
          >
            <h2 className="text-4xl font-black mb-2 text-white">GAME OVER</h2>
            <p className="text-white/80 mb-6 text-xl">Final Score: {Math.floor(score / 10)}</p>
            <button className="roblox-button flex items-center gap-2 bg-white text-red-600 hover:bg-slate-100">
              <RotateCcw className="w-5 h-5" /> Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedGame, setSelectedGame] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGames, setFilteredGames] = useState(gamesData);

  useEffect(() => {
    const filtered = gamesData.filter(game => 
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredGames(filtered);
  }, [searchQuery]);

  const navigateToGame = (game) => {
    setSelectedGame(game);
    setCurrentPage('game');
    window.scrollTo(0, 0);
  };

  const Navbar = () => (
    <nav className="sticky top-0 z-50 roblox-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setCurrentPage('home')}
          >
            <div className="bg-white p-1 rounded-sm">
              <Gamepad2 className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-lg tracking-tight uppercase">GMDD Games</span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setCurrentPage('home')}
              className={`text-sm font-bold uppercase transition-colors ${currentPage === 'home' ? 'text-white border-b-2 border-white' : 'text-slate-400 hover:text-white'}`}
            >
              Home
            </button>
            <button 
              onClick={() => setCurrentPage('iready')}
              className={`text-sm font-bold uppercase transition-colors ${currentPage === 'iready' ? 'text-white border-b-2 border-white' : 'text-slate-400 hover:text-white'}`}
            >
              i-Ready Hub
            </button>
            <button 
              onClick={() => setCurrentPage('credits')}
              className={`text-sm font-bold uppercase transition-colors ${currentPage === 'credits' ? 'text-white border-b-2 border-white' : 'text-slate-400 hover:text-white'}`}
            >
              Credits
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#111214] border border-[#393b3d] rounded py-1 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-white/20 w-48 lg:w-64 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );

  const AlphaBanner = () => (
    <div className="bg-blue-600 text-white py-1 px-4 text-center text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
      <AlertCircle className="w-3 h-3" />
      website is in alpha so expect more games coming!
    </div>
  );

  const HomePage = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8"
    >
      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Recommended for You</h1>
        <div className="h-1 w-12 bg-white rounded-full" />
      </header>

      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredGames.map((game) => (
            <motion.div
              key={game.id}
              onClick={() => navigateToGame(game)}
              className="roblox-card group cursor-pointer overflow-hidden"
            >
              <div className="aspect-square relative overflow-hidden">
                <img 
                  src={game.thumbnail} 
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                {game.isCustom && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                    Custom
                  </div>
                )}
              </div>
              <div className="p-2">
                <h3 className="font-bold text-sm truncate mb-1">
                  {game.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-slate-500">No results found.</p>
        </div>
      )}
    </motion.div>
  );

  const GamePage = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#111214]"
    >
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <button 
          onClick={() => setCurrentPage('home')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="bg-[#191b1d] rounded-lg overflow-hidden border border-[#393b3d]">
          <div className="aspect-video w-full bg-black relative">
            {selectedGame?.isCustom ? (
              <div className="w-full h-full p-4 flex items-center justify-center">
                <SquareJump />
              </div>
            ) : (
              <iframe 
                src={selectedGame?.iframeUrl}
                className="w-full h-full border-none"
                allowFullScreen
                title={selectedGame?.title}
              />
            )}
          </div>
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">{selectedGame?.title}</h1>
                <p className="text-slate-400 text-sm">{selectedGame?.description}</p>
              </div>
              {!selectedGame?.isCustom && (
                <button 
                  onClick={() => window.open(selectedGame?.iframeUrl, '_blank')}
                  className="roblox-button flex items-center justify-center gap-2"
                >
                  Play Fullscreen <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const CreditsPage = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="bg-[#191b1d] rounded-lg p-8 border border-[#393b3d]">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded bg-blue-600 flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">GMDDSuper</h1>
            <p className="text-blue-400 text-sm font-bold uppercase">Developer</p>
          </div>
        </div>

        <div className="space-y-6 text-slate-300">
          <p>
            Hey! I'm <span className="text-white font-bold">GMDDSuper</span>. I'm a Geometry Dash player who wants to make games.
          </p>
          <p>
            This website is currently in <span className="text-blue-400 font-bold">Alpha</span>. I'm building this to learn web development and provide a clean place for unblocked games.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-slate-400 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const IReadyPage = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="bg-[#191b1d] rounded-lg p-12 border border-[#393b3d] text-center">
        <Globe className="w-12 h-12 text-blue-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">External Hub</h1>
        <p className="text-slate-400 mb-8 max-w-xl mx-auto">
          Access our secondary unblocked games portal.
        </p>
        <div className="bg-[#111214] p-4 rounded border border-[#393b3d] inline-block mb-8 font-mono text-blue-400">
          login.i-ready.com.de
        </div>
        <div>
          <button 
            onClick={() => window.open('https://login.i-ready.com.de', '_blank')}
            className="roblox-button inline-flex items-center gap-2"
          >
            Launch Hub <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#111214]">
      <AlphaBanner />
      <Navbar />
      
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && <HomePage key="home" />}
          {currentPage === 'game' && <GamePage key="game" />}
          {currentPage === 'iready' && <IReadyPage key="iready" />}
          {currentPage === 'credits' && <CreditsPage key="credits" />}
        </AnimatePresence>
      </main>

      <footer className="bg-[#191b1d] border-t border-[#393b3d] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <p className="text-slate-500 text-xs uppercase font-bold">
            © 2026 GMDD Games
          </p>
          <div className="flex gap-4">
            <button onClick={() => setCurrentPage('home')} className="text-slate-500 hover:text-white text-xs font-bold uppercase transition-colors">Home</button>
            <button onClick={() => setCurrentPage('credits')} className="text-slate-500 hover:text-white text-xs font-bold uppercase transition-colors">Credits</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

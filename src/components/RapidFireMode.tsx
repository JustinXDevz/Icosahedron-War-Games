import React, { useState, useEffect, useRef } from 'react';
import {
  IcosahedronFace,
  IcosahedronVertex,
  GameQuestion,
  GameDifficulty,
  MemoryClockDuration,
} from '../types/game';
import { generateIcosahedronFaces, generateIcosahedronVertices } from '../utils/icosahedronGeometry';
import { generateQuestion } from '../utils/questionGenerator';
import { ThreeIcosahedron } from './ThreeIcosahedron';
import { sounds } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  Flame,
  Timer,
  Trophy,
  RotateCcw,
  Zap,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Keyboard,
} from 'lucide-react';

const CLOCK_OPTIONS: { duration: MemoryClockDuration; label: string }[] = [
  { duration: 5, label: '5s Blitz' },
  { duration: 10, label: '10s Sprint' },
  { duration: 15, label: '15s Fast' },
  { duration: 20, label: '20s Classic' },
  { duration: 30, label: '30s Practice' },
  { duration: 0, label: '♾️ Untimed / Daily' },
];

export const RapidFireMode: React.FC = () => {
  const [faces, setFaces] = useState<IcosahedronFace[]>(() => generateIcosahedronFaces());
  const [vertices, setVertices] = useState<IcosahedronVertex[]>(() => generateIcosahedronVertices(faces));

  const [gameState, setGameState] = useState<'idle' | 'memorize' | 'playing' | 'gameover'>('idle');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('hard');
  const [clockSetting, setClockSetting] = useState<MemoryClockDuration>(15);
  const [memoTime, setMemoTime] = useState<number>(15);
  const [gameTime, setGameTime] = useState<number>(60);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [highScore, setHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('coc_rapid_highscore') || 0);
  });

  const typeInputRef = useRef<HTMLInputElement | null>(null);

  // Start Rapid Fire Challenge
  const startGame = () => {
    sounds.playClick();
    const newFaces = generateIcosahedronFaces();
    setFaces(newFaces);
    setVertices(generateIcosahedronVertices(newFaces));
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setMemoTime(clockSetting === 0 ? 0 : clockSetting);
    setGameTime(60);
    setGameState('memorize');
  };

  // Memorize timer
  useEffect(() => {
    if (gameState !== 'memorize') return;
    if (clockSetting === 0) return; // Untimed practice mode

    if (memoTime <= 0) {
      sounds.playCorrect();
      setGameState('playing');
      nextQuestion();
      setTimeout(() => {
        typeInputRef.current?.focus();
      }, 100);
      return;
    }

    const timer = setInterval(() => {
      setMemoTime((t) => {
        if (t <= 4) sounds.playTick(true);
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, memoTime, clockSetting]);

  // Main game timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    if (gameTime <= 0) {
      sounds.playVictory();
      setGameState('gameover');
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('coc_rapid_highscore', String(score));
        confetti({ particleCount: 120, spread: 80 });
      }
      return;
    }

    const timer = setInterval(() => {
      setGameTime((t) => {
        if (t <= 5) sounds.playTick(true);
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, gameTime, score, highScore]);

  // Generate next question
  const nextQuestion = () => {
    const q = generateQuestion(faces, vertices, difficulty);
    setCurrentQuestion(q);
    setTypedAnswer('');
    setTimeout(() => {
      typeInputRef.current?.focus();
    }, 50);
  };

  // Handle Answer
  const handleAnswer = (option: string | number) => {
    if (gameState !== 'playing' || !currentQuestion) return;

    const isCorrect = String(option).trim().toLowerCase() === String(currentQuestion.correctAnswer).trim().toLowerCase();

    if (isCorrect) {
      sounds.playCorrect();
      const comboMult = Math.min(4, 1 + Math.floor(streak / 3));
      const points = 10 * comboMult;
      setScore((s) => s + points);
      setStreak((st) => {
        const next = st + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
    } else {
      sounds.playWrong();
      setStreak(0);
    }

    nextQuestion();
  };

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedAnswer.trim()) return;
    handleAnswer(typedAnswer.trim());
  };

  return (
    <div id="rapid-fire-container" className="w-full max-w-4xl mx-auto space-y-6">
      {/* LOBBY / IDLE STATE */}
      {gameState === 'idle' && (
        <div className="bg-slate-900/90 rounded-3xl p-8 border border-slate-800 shadow-2xl text-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-2xl shadow-orange-500/20">
            <Flame className="w-10 h-10 text-slate-950 fill-slate-950" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20">
              60s High Speed Sprint
            </span>
            <h2 className="text-3xl font-black text-white">Rapid Fire 60s Speed Sprint</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Test your 3D spatial memory under high pressure! Memorize 20 faces, then solve as many sum questions as possible in 60 seconds with no 3D assistance.
            </p>
          </div>

          {/* Difficulty Selection */}
          <div className="flex justify-center gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                setDifficulty('normal');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                difficulty === 'normal'
                  ? 'bg-cyan-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setDifficulty('hard');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                difficulty === 'hard'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              Hard
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setDifficulty('extreme_coc');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                difficulty === 'extreme_coc'
                  ? 'bg-rose-600 text-white font-black'
                  : 'bg-slate-800 text-rose-400'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Extreme COC (3-5 Letters)
            </button>
          </div>

          {/* Memorization Clock Setting */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 max-w-lg mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Inspection Time:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {CLOCK_OPTIONS.map((opt) => (
                <button
                  key={`rapid-clock-${opt.duration}`}
                  onClick={() => {
                    sounds.playClick();
                    setClockSetting(opt.duration);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                    clockSetting === opt.duration
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center items-center gap-6 text-xs text-slate-400 pt-2">
            <div>
              High Score: <strong className="text-white text-base">{highScore} pts</strong>
            </div>
          </div>

          <button
            id="btn-start-rapid-fire"
            onClick={startGame}
            className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-400 hover:to-rose-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-orange-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-slate-950" /> Start Rapid Sprint
          </button>
        </div>
      )}

      {/* MEMORIZATION SPRINT (3D MODEL SHOWN) */}
      {gameState === 'memorize' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4 text-center">
          <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-amber-400 uppercase">
              Alphabet Inspection Phase
            </span>
            <div className="flex items-center gap-3">
              {clockSetting > 0 ? (
                <div className="px-4 py-1.5 bg-rose-500/20 border border-rose-500/40 rounded-full text-rose-400 font-black text-xl animate-pulse inline-flex items-center gap-1.5">
                  <Timer className="w-5 h-5" /> {memoTime}s
                </div>
              ) : (
                <div className="px-4 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400 font-bold text-xs">
                  ♾️ Untimed
                </div>
              )}
              <button
                id="btn-skip-rapid-memo"
                onClick={() => {
                  sounds.playClick();
                  setGameState('playing');
                  nextQuestion();
                }}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-rose-600 text-xs font-black text-slate-950 rounded-xl"
              >
                Start 60s Sprint (Hide 3D) →
              </button>
            </div>
          </div>

          {/* Quick 20 Letter Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 text-center bg-slate-950 p-3 rounded-2xl border border-slate-800">
            {faces.map((f) => (
              <div key={`rapid-memo-${f.id}`} className="bg-slate-900 p-1 rounded-lg border border-slate-800">
                <div className="text-[11px] font-black text-cyan-400">{f.label}</div>
                <div className="text-xs font-extrabold text-white">{f.value}</div>
              </div>
            ))}
          </div>

          <ThreeIcosahedron faces={faces} autoRotate={true} showLabels={true} hideNumbers={false} height={340} />
        </div>
      )}

      {/* PLAYING QUESTION PHASE (3D MODEL IS COMPLETELY HIDDEN - Pure Memory Calculation) */}
      {gameState === 'playing' && currentQuestion && (
        <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-6">
          {/* Top Real-time HUD */}
          <div className="grid grid-cols-3 items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="text-left space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-slate-400">Score</span>
              <div className="text-3xl font-black text-cyan-400">{score} pts</div>
            </div>

            <div className="text-center space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-slate-400">Time Left</span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 border border-rose-500/40 rounded-full text-rose-400 font-black text-xl">
                <Timer className="w-5 h-5" /> {gameTime}s
              </div>
            </div>

            <div className="text-right space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-slate-400">Streak Combo</span>
              <div className="text-2xl font-black text-amber-400 flex items-center justify-end gap-1">
                <Flame className="w-5 h-5 text-amber-400" /> x{Math.min(4, 1 + Math.floor(streak / 3))} ({streak})
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-orange-500/40 shadow-xl space-y-4 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 px-2 py-0.5 bg-orange-500/10 rounded-md border border-orange-500/20">
              {currentQuestion.type.replace(/_/g, ' ')}
            </span>

            {currentQuestion.terms && currentQuestion.terms.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-3 py-2">
                {currentQuestion.terms.map((t, idx) => (
                  <React.Fragment key={`rapid-term-${idx}`}>
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-orange-400/80 flex items-center justify-center text-orange-300 font-black text-2xl shadow-lg">
                      {t.label}
                    </div>
                    {idx < currentQuestion.terms!.length - 1 && (
                      <span className="text-slate-400 font-bold text-2xl">+</span>
                    )}
                  </React.Fragment>
                ))}
                <span className="text-slate-400 font-bold text-2xl">=</span>
                <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border-2 border-dashed border-orange-400 flex items-center justify-center text-orange-300 font-black text-2xl animate-pulse">
                  ?
                </div>
              </div>
            ) : (
              <h3 className="text-xl font-black text-white">{currentQuestion.prompt}</h3>
            )}
          </div>

          {/* Quick Typing Input Form */}
          <form onSubmit={handleTypeSubmit} className="flex items-center gap-3">
            <input
              ref={typeInputRef}
              id="input-rapid-type-answer"
              type="text"
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              placeholder="Type number and press Enter..."
              className="flex-1 bg-slate-950 border-2 border-slate-800 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20 text-white font-mono text-xl font-black px-5 py-3 rounded-2xl outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-600 text-slate-950 font-black rounded-2xl text-sm"
            >
              Submit (↵)
            </button>
          </form>

          {/* Multiple Choice Keypad */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {currentQuestion.options.map((opt, i) => (
              <button
                key={`rapid-opt-${i}`}
                onClick={() => handleAnswer(opt)}
                className="p-4 rounded-2xl text-xl font-black bg-slate-800 hover:bg-slate-700 text-white border-2 border-slate-700 hover:border-orange-400 transition-all transform active:scale-95"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GAMEOVER SPRINT RESULTS */}
      {gameState === 'gameover' && (
        <div className="bg-slate-900/90 rounded-3xl p-8 border border-slate-800 shadow-2xl text-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 text-3xl shadow-xl shadow-amber-500/20">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white">Sprint Completed!</h2>
            <p className="text-xs text-slate-400">Great 3D memory recall speed under pressure.</p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Score</span>
              <div className="text-2xl font-black text-cyan-400">{score}</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Max Streak</span>
              <div className="text-2xl font-black text-amber-400">{maxStreak}</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Best Score</span>
              <div className="text-2xl font-black text-emerald-400">{highScore}</div>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              id="btn-play-again-rapid"
              onClick={startGame}
              className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-400 hover:to-rose-500 text-slate-950 font-black rounded-2xl shadow-xl text-sm transition-all transform hover:scale-[1.02]"
            >
              Play Another Sprint →
            </button>
            <button
              onClick={() => setGameState('idle')}
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-sm"
            >
              Sprint Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  IcosahedronFace,
  IcosahedronVertex,
  TargetSumChallenge,
  GameDifficulty,
  MemoryClockDuration,
} from '../types/game';
import { generateIcosahedronFaces, generateIcosahedronVertices } from '../utils/icosahedronGeometry';
import {
  generateTargetSumChallenge,
  isFacesConnected,
} from '../utils/pathSumGenerator';
import { ThreeIcosahedron } from './ThreeIcosahedron';
import { UnfoldedNetView } from './UnfoldedNetView';
import { sounds } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  Target,
  Link2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Trophy,
  ArrowRight,
  Eye,
  EyeOff,
  Flame,
  Undo2,
  Trash2,
  Check,
  Zap,
  Timer,
  Clock,
  Keyboard,
  Play,
} from 'lucide-react';

const CLOCK_OPTIONS: { duration: MemoryClockDuration; label: string }[] = [
  { duration: 5, label: '5s Blitz' },
  { duration: 10, label: '10s Sprint' },
  { duration: 15, label: '15s Fast' },
  { duration: 20, label: '20s Classic' },
  { duration: 30, label: '30s Practice' },
  { duration: 60, label: '60s Deep' },
  { duration: 0, label: '♾️ Untimed / Daily' },
];

export const TargetSumQuestMode: React.FC = () => {
  // 3D Icosahedron state
  const [faces, setFaces] = useState<IcosahedronFace[]>(() => generateIcosahedronFaces());
  const [vertices, setVertices] = useState<IcosahedronVertex[]>(() => generateIcosahedronVertices(faces));

  // Game Phase: 'memorize' (3D model visible) | 'solving' (3D model hidden, pure typing)
  const [phase, setPhase] = useState<'memorize' | 'solving'>('memorize');

  // Clock & Settings
  const [clockSetting, setClockSetting] = useState<MemoryClockDuration>(() => {
    const saved = localStorage.getItem('coc_target_clock_setting');
    return saved !== null ? (Number(saved) as MemoryClockDuration) : 15;
  });
  const [countdown, setCountdown] = useState<number>(15);
  const [difficulty, setDifficulty] = useState<GameDifficulty>('hard');

  // Active Target Sum Challenge
  const [challenge, setChallenge] = useState<TargetSumChallenge>(() =>
    generateTargetSumChallenge(faces, 'hard')
  );

  // Player's typed input (string of letters) and parsed face IDs
  const [typedInput, setTypedInput] = useState<string>('');
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [hintShown, setHintShown] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);

  // Stats
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [solvedCount, setSolvedCount] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Parse typed letters into Face IDs
  const parsedFaceIds: number[] = React.useMemo(() => {
    const letters = typedInput
      .toUpperCase()
      .replace(/[^A-T]/g, '')
      .split('');
    const ids: number[] = [];
    for (const l of letters) {
      const found = faces.find((f) => f.label === l);
      if (found && !ids.includes(found.id)) {
        ids.push(found.id);
      }
    }
    return ids;
  }, [typedInput, faces]);

  const isConnected = isFacesConnected(parsedFaceIds, faces);

  // Memorization countdown timer
  useEffect(() => {
    if (phase !== 'memorize') return;
    if (clockSetting === 0) return; // Untimed mode

    if (countdown <= 0) {
      sounds.playCorrect();
      startSolvingPhase();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 4 && prev > 1) sounds.playTick(true);
        else if (prev > 4) sounds.playTick(false);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, countdown, clockSetting]);

  // Save clock preference
  const handleClockChange = (dur: MemoryClockDuration) => {
    sounds.playClick();
    setClockSetting(dur);
    localStorage.setItem('coc_target_clock_setting', String(dur));
    setCountdown(dur);
  };

  // Start Solving Phase
  const startSolvingPhase = () => {
    sounds.playWhoosh();
    setPhase('solving');
    setTypedInput('');
    setFeedbackMessage(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Re-memorize with same values
  const handleRememorize = () => {
    sounds.playClick();
    setCountdown(clockSetting === 0 ? 0 : clockSetting);
    setPhase('memorize');
  };

  // Generate a brand new challenge with new numbers
  const handleNewChallenge = (diff: GameDifficulty = difficulty) => {
    sounds.playClick();
    const newFaces = generateIcosahedronFaces();
    const newVertices = generateIcosahedronVertices(newFaces);
    setFaces(newFaces);
    setVertices(newVertices);
    const newChallenge = generateTargetSumChallenge(newFaces, diff);
    setChallenge(newChallenge);
    setTypedInput('');
    setIsSolved(false);
    setHintShown(false);
    setFeedbackMessage(null);
    setCountdown(clockSetting === 0 ? 0 : clockSetting);
    setPhase('memorize');
  };

  // Handle typing letter from on-screen keypad or physical keyboard
  const handleAppendLetter = (letter: string) => {
    if (isSolved) return;
    const l = letter.toUpperCase();
    if (!/^[A-T]$/.test(l)) return;

    sounds.playClick();

    // Check if letter already added
    if (parsedFaceIds.some((id) => faces[id]?.label === l)) {
      setFeedbackMessage({
        type: 'warning',
        text: `Letter ${l} is already in your chain!`,
      });
      return;
    }

    const nextStr = typedInput ? `${typedInput} ${l}` : l;
    setTypedInput(nextStr);
    inputRef.current?.focus();
  };

  // Handle backspace / delete last letter
  const handleBackspace = () => {
    if (isSolved) return;
    sounds.playClick();
    const tokens = typedInput.trim().split(/\s+/).filter(Boolean);
    tokens.pop();
    setTypedInput(tokens.join(' '));
    setFeedbackMessage(null);
    inputRef.current?.focus();
  };

  // Handle clear input
  const handleClear = () => {
    if (isSolved) return;
    sounds.playClick();
    setTypedInput('');
    setFeedbackMessage(null);
    inputRef.current?.focus();
  };

  // Submit and validate the typed combination
  const handleSubmit = () => {
    if (isSolved) return;

    if (parsedFaceIds.length < 2) {
      sounds.playWrong();
      setFeedbackMessage({
        type: 'error',
        text: 'A connected chain requires at least 2 adjacent letters!',
      });
      return;
    }

    const calculatedSum = parsedFaceIds.reduce((acc, id) => acc + (faces[id]?.value || 0), 0);
    const connected = isFacesConnected(parsedFaceIds, faces);
    const letterChainNames = parsedFaceIds.map((id) => faces[id].label).join(' ➔ ');

    if (!connected) {
      sounds.playWrong();
      setFeedbackMessage({
        type: 'error',
        text: `❌ Not Connected: The letters [${parsedFaceIds
          .map((id) => faces[id].label)
          .join(', ')}] do not form a continuous connected chain on the 3D icosahedron!`,
      });
      return;
    }

    if (calculatedSum === challenge.targetSum) {
      // SUCCESS!
      sounds.playVictory();
      setIsSolved(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
      const fullEquation = parsedFaceIds
        .map((id) => `${faces[id].label}(${faces[id].value})`)
        .join(' + ');
      setFeedbackMessage({
        type: 'success',
        text: `🎉 EXACT MATCH! Connected chain: ${fullEquation} = ${challenge.targetSum}!`,
      });
      setScore((s) => s + 30 + parsedFaceIds.length * 5);
      setStreak((st) => st + 1);
      setSolvedCount((c) => c + 1);
    } else {
      sounds.playWrong();
      setFeedbackMessage({
        type: 'error',
        text: `⚠️ Incorrect Sum: The letters [${letterChainNames}] do not sum to ${challenge.targetSum}. Recall your alphabet values and recalculate!`,
      });
    }
  };

  // Keyboard shortcut listener for Enter & Backspace
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Hint
  const handleHint = () => {
    if (hintShown || isSolved) return;
    sounds.playClick();
    setHintShown(true);
    const sol = challenge.solutionPaths[0];
    if (sol && sol.length > 0) {
      const firstFace = faces[sol[0]];
      setFeedbackMessage({
        type: 'info',
        text: `💡 Hint: One valid connected chain starts with letter "${firstFace.label}".`,
      });
      if (!typedInput) {
        setTypedInput(firstFace.label);
      }
    }
  };

  return (
    <div id="target-sum-quest-container" className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Banner Header with Memory Clock Settings */}
      <div className="bg-slate-900/90 rounded-3xl p-6 border border-cyan-500/40 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center text-slate-950 shadow-xl shadow-cyan-500/20">
              <Target className="w-8 h-8 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-md border border-cyan-500/30">
                  Memory Recall • Typing Arena
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  Clash of Champions S3
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Search the Connected Alphabet Sum
              </h2>
            </div>
          </div>

          {/* Real-time stats */}
          <div className="flex items-center gap-4 bg-slate-950 p-2.5 px-4 rounded-2xl border border-slate-800">
            <div className="text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400">Score</span>
              <div className="text-lg font-black text-cyan-400">{score}</div>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div className="text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400">Streak</span>
              <div className="text-lg font-black text-amber-400 flex items-center gap-0.5">
                <Flame className="w-4 h-4 text-amber-400" /> {streak}
              </div>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div className="text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400">Solved</span>
              <div className="text-lg font-black text-emerald-400">{solvedCount}</div>
            </div>
          </div>
        </div>

        {/* Practice Clock Settings Bar */}
        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Memorization Clock Practice Setting:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {CLOCK_OPTIONS.map((opt) => (
              <button
                key={`clock-opt-${opt.duration}`}
                id={`btn-clock-${opt.duration}`}
                onClick={() => handleClockChange(opt.duration)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  clockSetting === opt.duration
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PHASE 1: MEMORIZATION SESSION (3D Icosahedron & Net are SHOWN) */}
      {phase === 'memorize' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-5 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/90 p-4 rounded-2xl border border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-400 uppercase font-bold">
                  Phase 1: Memorization Session
                </span>
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] rounded-full font-bold">
                  20 Alphabet Values (A–T)
                </span>
              </div>
              <h3 className="text-lg font-black text-white">
                Memorize Letter Values & 3D Connections
              </h3>
              <p className="text-xs text-slate-400">
                The 3D icosahedron will vanish when the question starts!
              </p>
            </div>

            <div className="flex items-center gap-3">
              {clockSetting > 0 ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-400 font-black text-2xl animate-pulse">
                  <Timer className="w-6 h-6" />
                  <span>{countdown}s</span>
                </div>
              ) : (
                <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400 font-bold text-xs">
                  ♾️ Untimed Daily Practice
                </div>
              )}

              <button
                id="btn-start-quest-solving"
                onClick={startSolvingPhase}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-cyan-500/20 text-sm flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-slate-950" /> Start Solving (Hide 3D) →
              </button>
            </div>
          </div>

          {/* Quick Alphabet Reference Grid */}
          <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
              <span>All 20 Alphabet Face Values:</span>
              <span className="text-cyan-400 text-[11px]">
                Remember values & adjacent edge neighbors
              </span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 text-center">
              {faces.map((f) => (
                <div
                  key={`memo-card-${f.id}`}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-2 hover:border-cyan-500/60 transition-all"
                >
                  <div className="text-sm font-black text-cyan-400">{f.label}</div>
                  <div className="text-base font-extrabold text-white">{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 3D Polyhedron View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <ThreeIcosahedron
                faces={faces}
                autoRotate={true}
                showLabels={true}
                hideNumbers={false}
                height={360}
              />
            </div>
            <div className="lg:col-span-4 bg-slate-950/70 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-amber-400 font-bold uppercase">
                  <Sparkles className="w-4 h-4" /> Dihya's Spatial Strategy
                </div>
                <p className="leading-relaxed">
                  Remember: Faces only connect if they share an edge!
                </p>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                  <div className="font-bold text-white">Adjacency Examples:</div>
                  <div className="text-slate-400">
                    • <span className="text-cyan-400 font-bold">Face A</span> connects to{' '}
                    <span className="text-white font-bold">
                      {faces[0].adjacentFaceIds.map((id) => faces[id].label).join(', ')}
                    </span>
                  </div>
                  <div className="text-slate-400">
                    • <span className="text-cyan-400 font-bold">Face B</span> connects to{' '}
                    <span className="text-white font-bold">
                      {faces[1].adjacentFaceIds.map((id) => faces[id].label).join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={startSolvingPhase}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg"
              >
                I've Memorized It! Proceed to Question →
              </button>
            </div>
          </div>

          <UnfoldedNetView faces={faces} showDihyaPoles={true} hideNumbers={false} />
        </div>
      )}

      {/* PHASE 2: SOLVING SESSION (3D Icosahedron is COMPLETELY HIDDEN - Pure Typing Mode) */}
      {phase === 'solving' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-cyan-500/40 shadow-2xl space-y-6 animate-fadeIn">
          {/* Big Glowing Target Question Card */}
          <div className="bg-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-cyan-500/60 shadow-inner flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center justify-center md:justify-start gap-1.5">
                <Link2 className="w-4 h-4 text-cyan-400" /> QUESTION • CONNECTED ALPHABET SUM
              </div>
              <div className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-300">
                TARGET = {challenge.targetSum}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Type the letters of a <strong className="text-cyan-300">connected chain of faces</strong> (e.g.{' '}
                <span className="font-mono text-amber-300 font-bold">A B F</span>) whose memorized values add up exactly to{' '}
                <strong className="text-white">{challenge.targetSum}</strong>!
              </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-2">
              <button
                id="btn-target-hint"
                onClick={handleHint}
                disabled={hintShown || isSolved}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                {hintShown ? `Starts with "${challenge.hintStartingLetter}"` : 'Need a Hint?'}
              </button>

              <button
                id="btn-rememorize-toggle"
                onClick={handleRememorize}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-cyan-400" /> Re-inspect 3D Model
              </button>

              <button
                id="btn-new-target-challenge"
                onClick={() => handleNewChallenge(difficulty)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl shadow-lg transition-all"
              >
                New Challenge (Next) →
              </button>
            </div>
          </div>

          {/* Typing Input Section */}
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-cyan-400" />
                <span>Type Alphabet Letters (Keyboard or Virtual Buttons):</span>
              </label>

              {/* Physical Input Box */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    id="input-typed-alphabet-chain"
                    type="text"
                    value={typedInput}
                    onChange={(e) => {
                      if (!isSolved) {
                        setTypedInput(e.target.value.toUpperCase());
                        setFeedbackMessage(null);
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={isSolved}
                    placeholder="Type letters (e.g. A B F or ABF)..."
                    className="w-full bg-slate-900 border-2 border-cyan-500/50 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 text-white font-mono text-xl sm:text-2xl font-black px-5 py-3.5 rounded-2xl outline-none placeholder:text-slate-600 uppercase tracking-wider"
                  />
                  {typedInput && (
                    <button
                      onClick={handleClear}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <button
                  id="btn-submit-typed-chain"
                  onClick={handleSubmit}
                  disabled={isSolved || parsedFaceIds.length === 0}
                  className="px-7 py-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 disabled:opacity-40 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-cyan-500/25 flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Check className="w-5 h-5 stroke-[3]" /> Submit
                </button>
              </div>
            </div>

            {/* Real-time Typed Chain HUD (SHOWS ONLY LETTERS, NO REVEALED VALUES) */}
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between text-xs font-bold text-slate-400">
                <span>Typed Letters Chain:</span>
                <span>
                  {parsedFaceIds.length} letters entered •{' '}
                  {isConnected ? (
                    <span className="text-emerald-400 font-bold">✓ Connected in 3D</span>
                  ) : parsedFaceIds.length > 1 ? (
                    <span className="text-rose-400 font-bold">❌ Disconnected in 3D</span>
                  ) : (
                    'Enter connected letters'
                  )}
                </span>
              </div>

              {/* Equation Visualizer (Letters Only - No numeric values leaked) */}
              <div className="flex flex-wrap items-center gap-2 min-h-[44px]">
                {parsedFaceIds.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">
                    Type on your keyboard or tap the letter buttons below...
                  </span>
                ) : (
                  parsedFaceIds.map((fId, idx) => {
                    const face = faces[fId];
                    return (
                      <React.Fragment key={`typed-chip-${fId}`}>
                        <div className="w-11 h-11 rounded-xl bg-slate-950 border-2 border-cyan-500/70 text-cyan-300 font-black text-lg flex items-center justify-center shadow-md">
                          {face.label}
                        </div>
                        {idx < parsedFaceIds.length - 1 && (
                          <span className="text-slate-400 font-bold text-sm">+</span>
                        )}
                      </React.Fragment>
                    );
                  })
                )}

                {parsedFaceIds.length > 0 && (
                  <>
                    <span className="text-slate-400 font-bold text-sm">=</span>
                    <div className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 font-black text-sm flex items-center gap-1.5">
                      <span>?</span>
                      <span className="text-xs text-slate-400 font-normal">
                        (Target: {challenge.targetSum})
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Virtual 20-Letter On-Screen Keypad (A to T) */}
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                Virtual Alphabet Keypad (A through T):
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {faces.map((f) => {
                  const isSelected = parsedFaceIds.includes(f.id);
                  return (
                    <button
                      key={`keypad-${f.label}`}
                      id={`btn-keypad-${f.label}`}
                      onClick={() => handleAppendLetter(f.label)}
                      disabled={isSolved}
                      className={`p-3 rounded-xl font-black text-base border-2 transition-all duration-150 transform active:scale-95 flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800 hover:border-cyan-500/50'
                      }`}
                    >
                      <span>{f.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Utility keys */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  id="btn-keypad-backspace"
                  onClick={handleBackspace}
                  disabled={isSolved || parsedFaceIds.length === 0}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Undo2 className="w-4 h-4 text-cyan-400" /> Backspace (⌫)
                </button>
                <button
                  id="btn-keypad-clear"
                  onClick={handleClear}
                  disabled={isSolved || parsedFaceIds.length === 0}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-rose-400 rounded-xl border border-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" /> Clear All
                </button>
              </div>
            </div>

            {/* Live Feedback Message Banner */}
            {feedbackMessage && (
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-fadeIn ${
                  feedbackMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                    : feedbackMessage.type === 'error'
                    ? 'bg-rose-500/10 border-rose-500/50 text-rose-300'
                    : feedbackMessage.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                    : 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                }`}
              >
                {feedbackMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                )}
                <span>{feedbackMessage.text}</span>
              </div>
            )}

            {/* Solved Solutions Showcase */}
            {isSolved && (
              <div className="bg-slate-900/90 p-5 rounded-2xl border border-emerald-500/40 space-y-3 animate-fadeIn">
                <h4 className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> All Valid Connected Solutions for Target ={' '}
                  {challenge.targetSum}:
                </h4>
                <div className="space-y-1.5">
                  {challenge.solutionLetterStrings.map((solStr, idx) => (
                    <div
                      key={`sol-string-${idx}`}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300"
                    >
                      ✓ Solution {idx + 1}: {solStr}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleNewChallenge(difficulty)}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg"
                >
                  Play Next Target Question →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

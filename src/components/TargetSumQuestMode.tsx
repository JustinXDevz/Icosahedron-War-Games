import React, { useState, useEffect, useRef } from 'react';
import {
  IcosahedronFace,
  IcosahedronVertex,
  TargetSumChallenge,
  GameDifficulty,
  MemoryClockDuration,
  ChallengeRecord,
  SessionSummaryStats,
} from '../types/game';
import { generateIcosahedronFaces, generateIcosahedronVertices } from '../utils/icosahedronGeometry';
import {
  generateTargetSumChallenge,
  isFacesConnected,
} from '../utils/pathSumGenerator';
import { ThreeIcosahedron } from './ThreeIcosahedron';
import { UnfoldedNetView } from './UnfoldedNetView';
import { SessionSummaryView } from './SessionSummaryView';
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
  BarChart3,
  SkipForward,
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

  // Game Phase: 'memorize' (3D model visible) | 'solving' (3D model hidden, pure typing) | 'summary' (end of session)
  const [phase, setPhase] = useState<'memorize' | 'solving' | 'summary'>('memorize');

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

  // Session stats & Performance tracking
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [solvedCount, setSolvedCount] = useState<number>(0);

  // Timing and challenge history
  const [challengeStartTime, setChallengeStartTime] = useState<number | null>(null);
  const [currentAttempts, setCurrentAttempts] = useState<number>(0);
  const [lastSolveTimeMs, setLastSolveTimeMs] = useState<number | null>(null);
  const [sessionRecords, setSessionRecords] = useState<ChallengeRecord[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Computed summary metrics
  const totalChallenges = sessionRecords.length;
  const correctChallenges = sessionRecords.filter((r) => r.isCorrect).length;
  const totalSubmissions = sessionRecords.reduce((sum, r) => sum + r.attemptsCount, 0) + (phase === 'solving' && !isSolved ? currentAttempts : 0);
  const accuracyPercentage =
    totalSubmissions > 0
      ? (correctChallenges / totalSubmissions) * 100
      : totalChallenges > 0
      ? (correctChallenges / totalChallenges) * 100
      : 100;
  const totalResponseTimeMs = sessionRecords.reduce((sum, r) => sum + r.responseTimeMs, 0);
  const averageResponseTimeSec =
    totalChallenges > 0 ? totalResponseTimeMs / totalChallenges / 1000 : 0;
  const fastestResponseTimeSec =
    sessionRecords.filter((r) => r.isCorrect).length > 0
      ? Math.min(...sessionRecords.filter((r) => r.isCorrect).map((r) => r.responseTimeMs)) / 1000
      : 0;

  const sessionSummaryStats: SessionSummaryStats = {
    modeName: 'Target Sum Quest',
    totalChallenges,
    correctChallenges,
    totalAttempts: totalSubmissions,
    accuracyPercentage,
    averageResponseTimeSec,
    fastestResponseTimeSec,
    totalScore: score,
    maxStreak,
    records: sessionRecords,
    completedAt: new Date(),
  };

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
    setChallengeStartTime(Date.now());
    setCurrentAttempts(0);
    setLastSolveTimeMs(null);
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
    setCurrentAttempts(0);
    setLastSolveTimeMs(null);
    setPhase('memorize');
  };

  // Restart whole session
  const handleRestartSession = () => {
    sounds.playClick();
    setSessionRecords([]);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setSolvedCount(0);
    handleNewChallenge(difficulty);
  };

  // Skip / Give Up on challenge
  const handleSkipChallenge = () => {
    sounds.playWrong();
    const elapsedMs = challengeStartTime ? Date.now() - challengeStartTime : 0;
    const rec: ChallengeRecord = {
      id: `${challenge.id}-${sessionRecords.length + 1}`,
      challengeIndex: sessionRecords.length + 1,
      title: `Target Sum = ${challenge.targetSum}`,
      details: challenge.solutionLetterStrings[0] || 'Unsolved challenge',
      targetOrAnswer: challenge.targetSum,
      userSubmission: typedInput ? typedInput : 'Skipped',
      isCorrect: false,
      responseTimeMs: elapsedMs,
      attemptsCount: currentAttempts + 1,
    };
    setSessionRecords((prev) => [...prev, rec]);
    setStreak(0);
    setFeedbackMessage({
      type: 'warning',
      text: `Challenge skipped. Correct solution: ${challenge.solutionLetterStrings[0]}`,
    });
    setIsSolved(true);
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

    setCurrentAttempts((att) => att + 1);

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
      const elapsedMs = challengeStartTime ? Date.now() - challengeStartTime : 0;
      setLastSolveTimeMs(elapsedMs);

      // Record challenge in session
      const rec: ChallengeRecord = {
        id: `${challenge.id}-${sessionRecords.length + 1}`,
        challengeIndex: sessionRecords.length + 1,
        title: `Target Sum = ${challenge.targetSum}`,
        details: `Chain: ${parsedFaceIds.map((id) => faces[id].label).join(' + ')}`,
        targetOrAnswer: challenge.targetSum,
        userSubmission: parsedFaceIds.map((id) => faces[id].label).join(' + '),
        isCorrect: true,
        responseTimeMs: elapsedMs,
        attemptsCount: currentAttempts + 1,
      };
      setSessionRecords((prev) => [...prev, rec]);

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
        text: `🎉 EXACT MATCH in ${(elapsedMs / 1000).toFixed(2)}s! Connected chain: ${fullEquation} = ${challenge.targetSum}!`,
      });
      setScore((s) => s + 30 + parsedFaceIds.length * 5);
      setStreak((st) => {
        const nextStreak = st + 1;
        if (nextStreak > maxStreak) setMaxStreak(nextStreak);
        return nextStreak;
      });
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

  // If viewing end of session summary
  if (phase === 'summary') {
    return (
      <SessionSummaryView
        stats={sessionSummaryStats}
        onRestart={handleRestartSession}
        onContinue={() => handleNewChallenge(difficulty)}
      />
    );
  }

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

          {/* Real-time Performance HUD */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-2.5 px-4 rounded-2xl border border-slate-800">
            <div className="text-center px-2">
              <div className="text-[10px] font-bold uppercase text-slate-400">Score</div>
              <div className="text-base font-black text-amber-400 font-mono">{score}</div>
            </div>
            <div className="h-7 w-[1px] bg-slate-800" />
            <div className="text-center px-2">
              <div className="text-[10px] font-bold uppercase text-slate-400">Streak</div>
              <div className="text-base font-black text-emerald-400 font-mono flex items-center gap-0.5 justify-center">
                <Flame className="w-3.5 h-3.5" />
                {streak}
              </div>
            </div>
            <div className="h-7 w-[1px] bg-slate-800" />
            <div className="text-center px-2">
              <div className="text-[10px] font-bold uppercase text-slate-400">Accuracy</div>
              <div className="text-base font-black text-cyan-300 font-mono">
                {accuracyPercentage.toFixed(0)}%
              </div>
            </div>
            <div className="h-7 w-[1px] bg-slate-800" />
            <div className="text-center px-2">
              <div className="text-[10px] font-bold uppercase text-slate-400">Avg Time</div>
              <div className="text-base font-black text-indigo-300 font-mono">
                {averageResponseTimeSec > 0 ? `${averageResponseTimeSec.toFixed(1)}s` : '—'}
              </div>
            </div>

            {sessionRecords.length > 0 && (
              <button
                id="btn-view-session-summary"
                onClick={() => {
                  sounds.playClick();
                  setPhase('summary');
                }}
                className="ml-2 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Session Summary ({sessionRecords.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Practice Clock Settings Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" /> Memorize Timer:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {CLOCK_OPTIONS.map((opt) => (
                <button
                  key={`clock-opt-${opt.duration}`}
                  id={`btn-clock-${opt.duration}`}
                  onClick={() => handleClockChange(opt.duration)}
                  className={`px-3 py-1 rounded-xl font-bold transition-all text-xs ${
                    clockSetting === opt.duration
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNewChallenge(difficulty)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" /> New Challenge
            </button>
          </div>
        </div>
      </div>

      {/* PHASE 1: MEMORIZATION PHASE (3D Icosahedron & Net Visible) */}
      {phase === 'memorize' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-cyan-500/40 shadow-2xl space-y-6 animate-fadeIn">
          {/* Phase 1 Banner & Countdown */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-black">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-cyan-400">Phase 1 of 2</div>
                <h3 className="text-lg font-black text-white">Memorize 20 Alphabet Values</h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {clockSetting !== 0 ? (
                <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-cyan-500/40 font-mono">
                  <Timer className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-xs text-slate-400 font-bold">Auto-hide in:</span>
                  <span
                    className={`text-lg font-black ${
                      countdown <= 3 ? 'text-rose-400 animate-ping' : 'text-cyan-300'
                    }`}
                  >
                    {countdown}s
                  </span>
                </div>
              ) : (
                <div className="px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 font-bold">
                  ♾️ Daily Untimed Practice
                </div>
              )}

              <button
                id="btn-start-solving-now"
                onClick={startSolvingPhase}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all transform hover:scale-105"
              >
                <Play className="w-4 h-4 fill-slate-950" /> Start Solving Now →
              </button>
            </div>
          </div>

          {/* 3D Model & 2D Net Display */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800/80 p-4 min-h-[380px] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
                <span className="font-bold text-cyan-300">3D Interactive Polyhedron</span>
                <span>Drag to rotate • Orbit all 20 faces</span>
              </div>
              <div className="w-full h-80 flex items-center justify-center">
                <ThreeIcosahedron
                  faces={faces}
                  vertices={vertices}
                  showLabels={true}
                  showValues={true}
                  autoRotate={true}
                  autoRotateSpeed={1.0}
                  className="w-full h-full"
                />
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-950 rounded-2xl border border-slate-800/80 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
                <span className="font-bold text-cyan-300">2D Unfolded Net</span>
                <span>All 20 Faces (A–T)</span>
              </div>
              <div className="py-2">
                <UnfoldedNetView faces={faces} showValues={true} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 2: SOLVING PHASE (3D Model Hidden, Pure Typing & Recall) */}
      {phase === 'solving' && (
        <div className="bg-slate-900/95 rounded-3xl p-6 sm:p-8 border border-cyan-500/50 shadow-2xl space-y-6 animate-fadeIn">
          {/* Phase Header & Target Prompt */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950 border border-cyan-500/40">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-black">
                <EyeOff className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                  Phase 2 • Pure Spatial Memory
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  3D Model is Hidden — Type the Solution
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRememorize}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-4 h-4 text-cyan-400" /> Peek 3D Model
              </button>

              <button
                onClick={handleSkipChallenge}
                disabled={isSolved}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <SkipForward className="w-4 h-4" /> Skip Challenge
              </button>
            </div>
          </div>

          {/* Target Question Highlight Box */}
          <div className="bg-slate-950 p-6 rounded-3xl border-2 border-cyan-500/50 shadow-xl text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                Connected Face Sum Goal
              </span>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="text-5xl sm:text-7xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-300">
                TARGET = {challenge.targetSum}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-lg">
                Type 2 to 5 alphabet letters that are <strong className="text-cyan-300">connected to each other</strong> in 3D geometry and sum to <strong className="text-amber-300">{challenge.targetSum}</strong>.
              </p>
            </div>

            {/* Keyboard Input Field */}
            <div className="max-w-xl mx-auto space-y-3 pt-2">
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  id="input-target-sum-letters"
                  type="text"
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  disabled={isSolved}
                  placeholder="Type letters on keyboard (e.g. A B F or ABF)..."
                  className="w-full bg-slate-900 border-2 border-cyan-500/60 rounded-2xl py-4 pl-12 pr-28 text-white font-mono font-black text-lg placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 uppercase tracking-widest"
                  autoFocus
                />
                <Keyboard className="w-6 h-6 text-cyan-400 absolute left-4 pointer-events-none" />

                <button
                  id="btn-submit-target-answer"
                  onClick={handleSubmit}
                  disabled={isSolved || parsedFaceIds.length < 2}
                  className="absolute right-2 px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all"
                >
                  Submit ↵
                </button>
              </div>

              {/* Real-time Equation & Adjacency HUD */}
              <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">Your Chain:</span>
                  <div className="flex items-center gap-1 font-mono font-black text-cyan-300">
                    {parsedFaceIds.length === 0 ? (
                      <span className="text-slate-600 italic">No letters typed yet</span>
                    ) : (
                      parsedFaceIds.map((id, idx) => (
                        <React.Fragment key={`token-${id}`}>
                          <span className="px-2 py-0.5 bg-slate-950 rounded-lg border border-cyan-500/40 text-cyan-300 font-bold">
                            {faces[id].label}
                          </span>
                          {idx < parsedFaceIds.length - 1 && (
                            <span className="text-slate-500 font-bold">+</span>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </div>
                </div>

                {parsedFaceIds.length >= 2 && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">3D Connectivity:</span>
                    {isConnected ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/30">
                        <AlertTriangle className="w-3.5 h-3.5" /> Disconnected
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Virtual 20-Letter Keypad */}
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
                <button
                  id="btn-keypad-hint"
                  onClick={handleHint}
                  disabled={isSolved || hintShown}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl border border-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" /> Hint
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

            {/* Solved Solutions Showcase & Next Actions */}
            {isSolved && (
              <div className="bg-slate-900/90 p-5 rounded-2xl border border-emerald-500/40 space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> All Valid Connected Solutions for Target ={' '}
                    {challenge.targetSum}:
                  </h4>
                  {lastSolveTimeMs !== null && (
                    <span className="text-xs font-mono text-cyan-300 font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                      ⚡ Time: {(lastSolveTimeMs / 1000).toFixed(2)}s
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-left">
                  {challenge.solutionLetterStrings.map((solStr, idx) => (
                    <div
                      key={`sol-string-${idx}`}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300"
                    >
                      ✓ Solution {idx + 1}: {solStr}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    id="btn-play-next-target"
                    onClick={() => handleNewChallenge(difficulty)}
                    className="w-full sm:flex-1 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    Play Next Target Question <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    id="btn-finish-and-summary"
                    onClick={() => {
                      sounds.playClick();
                      setPhase('summary');
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 bg-slate-950 hover:bg-slate-800 border border-cyan-500/50 text-cyan-300 font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" /> View Session Summary
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

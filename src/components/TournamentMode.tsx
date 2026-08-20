import React, { useState, useEffect, useRef } from 'react';
import {
  IcosahedronFace,
  IcosahedronVertex,
  Champion,
  GameQuestion,
  GameDifficulty,
  MemoryClockDuration,
} from '../types/game';
import { COC_CHAMPIONS } from '../data/champions';
import { generateIcosahedronFaces, generateIcosahedronVertices } from '../utils/icosahedronGeometry';
import { generateQuestion } from '../utils/questionGenerator';
import { ThreeIcosahedron } from './ThreeIcosahedron';
import { UnfoldedNetView } from './UnfoldedNetView';
import { sounds } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Zap,
  Timer,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  ChevronRight,
  ShieldAlert,
  Eye,
  EyeOff,
  Flame,
  Clock,
  Keyboard,
  BrainCircuit,
  Calculator,
} from 'lucide-react';

const CLOCK_OPTIONS: { duration: MemoryClockDuration; label: string }[] = [
  { duration: 5, label: '5s Blitz' },
  { duration: 10, label: '10s Sprint' },
  { duration: 15, label: '15s Fast' },
  { duration: 20, label: '20s Classic' },
  { duration: 30, label: '30s Practice' },
  { duration: 0, label: '♾️ Untimed / Daily' },
];

interface TournamentModeProps {
  onBackToMenu?: () => void;
}

export const TournamentMode: React.FC<TournamentModeProps> = () => {
  // Tournament progression state
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [champion, setChampion] = useState<Champion>(COC_CHAMPIONS[0]);
  const [tournamentPhase, setTournamentPhase] = useState<
    'lobby' | 'intro' | 'memorize' | 'battle' | 'round_result' | 'champion_crowned'
  >('lobby');

  // Difficulty & Hardcore memory settings
  const [difficulty, setDifficulty] = useState<GameDifficulty>('hard');
  const [clockSetting, setClockSetting] = useState<MemoryClockDuration>(20);

  // Icosahedron state
  const [faces, setFaces] = useState<IcosahedronFace[]>(() => generateIcosahedronFaces());
  const [vertices, setVertices] = useState<IcosahedronVertex[]>(() => generateIcosahedronVertices(faces));

  // Scores
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const targetScore = 60; // First to 60 points wins the match

  // Memorization Phase Timer
  const [memoTimer, setMemoTimer] = useState<number>(20);

  // Active Question
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [questionTimer, setQuestionTimer] = useState<number>(16);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [customInputAnswer, setCustomInputAnswer] = useState<string>('');
  const [isAnswerLocked, setIsAnswerLocked] = useState<boolean>(false);
  const [answerStatus, setAnswerStatus] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [aiAnswered, setAiAnswered] = useState<boolean>(false);
  const [aiMessage, setAiMessage] = useState<string>('');

  // AI reaction timeout ref
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typeInputRef = useRef<HTMLInputElement | null>(null);

  // Change champion when stage changes
  useEffect(() => {
    setChampion(COC_CHAMPIONS[currentStage % COC_CHAMPIONS.length]);
  }, [currentStage]);

  // Start new match
  const startMatch = (champIndex: number = 0) => {
    sounds.playClick();
    setCurrentStage(champIndex);
    setChampion(COC_CHAMPIONS[champIndex]);
    setPlayerScore(0);
    setOpponentScore(0);
    setRoundNumber(1);
    const newFaces = generateIcosahedronFaces();
    setFaces(newFaces);
    setVertices(generateIcosahedronVertices(newFaces));
    setTournamentPhase('intro');
  };

  // Proceed from intro to memorization
  const startMemorizationPhase = () => {
    sounds.playWhoosh();
    setMemoTimer(clockSetting === 0 ? 0 : clockSetting);
    setTournamentPhase('memorize');
  };

  // Memorization countdown effect
  useEffect(() => {
    if (tournamentPhase !== 'memorize') return;
    if (clockSetting === 0) return; // Untimed practice mode

    if (memoTimer <= 0) {
      sounds.playCorrect();
      startBattleRound();
      return;
    }

    const timer = setInterval(() => {
      setMemoTimer((prev) => {
        if (prev <= 5 && prev > 1) {
          sounds.playTick(true);
        } else if (prev > 5) {
          sounds.playTick(false);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [tournamentPhase, memoTimer, clockSetting]);

  // Start a battle question round
  const startBattleRound = () => {
    const q = generateQuestion(faces, vertices, difficulty);
    setCurrentQuestion(q);
    setQuestionTimer(q.timeLimit);
    setSelectedAnswer(null);
    setCustomInputAnswer('');
    setIsAnswerLocked(false);
    setAnswerStatus(null);
    setAiAnswered(false);
    setAiMessage('');
    setTournamentPhase('battle');

    setTimeout(() => {
      typeInputRef.current?.focus();
    }, 100);

    // Simulate AI buzzer response
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);

    const isAiCorrect = Math.random() < champion.accuracy;
    const aiSpeed = champion.speedMs + (Math.random() * 1600 - 600);

    aiTimeoutRef.current = setTimeout(() => {
      setIsAnswerLocked((locked) => {
        if (!locked) {
          setAiAnswered(true);
          if (isAiCorrect) {
            sounds.playWrong(); // AI stole it
            setOpponentScore((s) => s + 15);
            setAiMessage(`${champion.name} locked in the sum first! (+15 pts)`);
            setAnswerStatus('wrong');
          } else {
            setAiMessage(`${champion.name} miscalculated! Opportunity to steal!`);
          }
          return true;
        }
        return locked;
      });
    }, aiSpeed);
  };

  // Question countdown effect during battle
  useEffect(() => {
    if (tournamentPhase !== 'battle' || isAnswerLocked || !currentQuestion) return;

    if (questionTimer <= 0) {
      setIsAnswerLocked(true);
      setAnswerStatus('timeout');
      sounds.playWrong();
      return;
    }

    const timer = setInterval(() => {
      setQuestionTimer((t) => {
        if (t <= 4) sounds.playTick(true);
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [tournamentPhase, questionTimer, isAnswerLocked, currentQuestion]);

  // Handle player submitting answer
  const handleSubmitAnswer = (answer: string | number) => {
    if (isAnswerLocked || !currentQuestion) return;

    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);

    setSelectedAnswer(answer);
    setIsAnswerLocked(true);

    const isCorrect = String(answer).trim().toLowerCase() === String(currentQuestion.correctAnswer).trim().toLowerCase();

    if (isCorrect) {
      sounds.playCorrect();
      setAnswerStatus('correct');
      const earned = Math.max(10, Math.round(15 * (questionTimer / currentQuestion.timeLimit)));
      setPlayerScore((s) => s + earned);
    } else {
      sounds.playWrong();
      setAnswerStatus('wrong');
      setOpponentScore((s) => s + 10);
    }
  };

  // Handle typed answer submission
  const handleCustomTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInputAnswer.trim() || isAnswerLocked) return;
    handleSubmitAnswer(customInputAnswer.trim());
  };

  // Move to next question or end stage
  const nextRound = () => {
    sounds.playClick();
    if (playerScore >= targetScore || opponentScore >= targetScore) {
      if (playerScore >= targetScore) {
        sounds.playVictory();
        confetti({ particleCount: 150, spread: 90 });
        if (currentStage === COC_CHAMPIONS.length - 1) {
          setTournamentPhase('champion_crowned');
          return;
        }
      }
      setTournamentPhase('round_result');
    } else {
      setRoundNumber((r) => r + 1);
      startBattleRound();
    }
  };

  // Advance to next stage
  const advanceToNextStage = () => {
    sounds.playClick();
    startMatch(currentStage + 1);
  };

  return (
    <div id="tournament-mode-container" className="w-full max-w-5xl mx-auto space-y-6">
      {/* TOURNAMENT LOBBY */}
      {tournamentPhase === 'lobby' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/20">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-md border border-amber-500/30">
                  Arena Gauntlet
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Clash of Champions Tournament
                </h2>
                <p className="text-xs text-slate-400">
                  Duel COC All-Stars (Dihya, Sandy, Axel, Maxwell, Shakira) in buzzer speed rounds.
                </p>
              </div>
            </div>

            {/* Difficulty Toggle */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                id="btn-diff-normal"
                onClick={() => {
                  sounds.playClick();
                  setDifficulty('normal');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  difficulty === 'normal'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                Normal
              </button>
              <button
                id="btn-diff-hard"
                onClick={() => {
                  sounds.playClick();
                  setDifficulty('hard');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  difficulty === 'hard'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                Hard
              </button>
              <button
                id="btn-diff-extreme"
                onClick={() => {
                  sounds.playClick();
                  setDifficulty('extreme_coc');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  difficulty === 'extreme_coc'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 font-black'
                    : 'bg-slate-800 text-rose-400 hover:text-rose-300'
                }`}
              >
                <Flame className="w-3.5 h-3.5" /> Extreme COC (3-5 Letters)
              </button>
            </div>
          </div>

          {/* Memorization Practice Clock Selector */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Inspection / Memorization Clock Setting:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {CLOCK_OPTIONS.map((opt) => (
                <button
                  key={`tourney-clock-${opt.duration}`}
                  onClick={() => {
                    sounds.playClick();
                    setClockSetting(opt.duration);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    clockSetting === opt.duration
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Champion Roster Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {COC_CHAMPIONS.map((champ, idx) => (
              <div
                key={champ.id}
                id={`champion-card-${champ.id}`}
                onClick={() => startMatch(idx)}
                className="group relative bg-slate-950/70 hover:bg-slate-800/80 rounded-2xl p-5 border border-slate-800 hover:border-cyan-500/60 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-cyan-500/10 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md border border-white/10"
                        style={{ backgroundColor: champ.avatarColor }}
                      >
                        {champ.avatarIcon}
                      </div>
                      <div>
                        <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {champ.name}
                        </h3>
                        <p className="text-xs text-slate-400">{champ.university}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Specialty:</span>
                      <span className="font-medium text-slate-200 text-right truncate max-w-[170px]">
                        {champ.specialty}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Reaction Time:</span>
                      <span className="font-bold text-cyan-400">{(champ.speedMs / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Difficulty:</span>
                      <span
                        className={`font-bold ${
                          champ.difficulty === 'Legend'
                            ? 'text-rose-400'
                            : champ.difficulty === 'Grandmaster'
                            ? 'text-purple-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {champ.difficulty}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] italic text-slate-500 line-clamp-2">
                    "{champ.quote}"
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                  <span>Enter Arena Duel</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MATCH INTRO */}
      {tournamentPhase === 'intro' && (
        <div className="bg-slate-900/90 rounded-3xl p-8 border border-slate-800 shadow-2xl text-center space-y-6 animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            Stage {currentStage + 1} Duel • {difficulty.replace('_', ' ').toUpperCase()} MODE
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
            {/* Player */}
            <div className="space-y-2 text-center">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/20">
                🎓
              </div>
              <h4 className="font-bold text-white">Challenger (You)</h4>
              <span className="text-xs text-cyan-400">Memory & Math Contender</span>
            </div>

            {/* VS Emblem */}
            <div className="w-14 h-14 rounded-full bg-slate-950 border-2 border-rose-500/60 flex items-center justify-center font-black text-rose-500 text-xl shadow-lg">
              VS
            </div>

            {/* Champion */}
            <div className="space-y-2 text-center">
              <div
                className="w-20 h-20 mx-auto rounded-2xl border-2 border-white/20 flex items-center justify-center text-3xl shadow-lg"
                style={{ backgroundColor: champion.avatarColor }}
              >
                {champion.avatarIcon}
              </div>
              <h4 className="font-bold text-white">{champion.name}</h4>
              <span className="text-xs text-amber-400">{champion.title}</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-5 rounded-2xl max-w-xl mx-auto border border-slate-800 text-xs text-slate-300 space-y-2 text-left">
            <p className="font-bold text-cyan-400 uppercase tracking-wider">Hardcore Match Rules:</p>
            <p>1. <strong className="text-white">Memorization Phase:</strong> You have {clockSetting === 0 ? 'Unlimited Practice Time' : `${clockSetting}s`} to inspect the 20 Alphabet values.</p>
            <p>2. <strong className="text-white">Hidden 3D Model Duel:</strong> Once the duel begins, the 3D icosahedron disappears completely! Questions must be answered from pure memory.</p>
            <p>3. <strong className="text-white">Buzzer Speed:</strong> Calculate before {champion.name} hits the buzzer!</p>
          </div>

          <button
            id="btn-start-memorize"
            onClick={startMemorizationPhase}
            className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-cyan-500/20 text-sm tracking-wide transition-all transform hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-slate-950" /> Start 20-Letter Memorization ({clockSetting === 0 ? 'Untimed' : `${clockSetting}s`})
          </button>
        </div>
      )}

      {/* MEMORIZATION PHASE (3D Icosahedron & Net are SHOWN) */}
      {tournamentPhase === 'memorize' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-400 uppercase font-bold">Phase 1: Memorization</span>
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] rounded-full font-bold">
                  20 Alphabet Values
                </span>
              </div>
              <h3 className="text-lg font-black text-white">Memorize Alphabet-to-Number Mapping</h3>
              <p className="text-xs text-slate-400">The 3D model will vanish when the arena duel begins!</p>
            </div>

            <div className="flex items-center gap-3">
              {clockSetting > 0 ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400 font-black text-2xl animate-pulse">
                  <Timer className="w-6 h-6" />
                  <span>{memoTimer}s</span>
                </div>
              ) : (
                <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 font-bold text-xs">
                  ♾️ Untimed Practice
                </div>
              )}

              <button
                id="btn-skip-memo"
                onClick={() => {
                  sounds.playClick();
                  startBattleRound();
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-black rounded-xl transition-all shadow-lg"
              >
                Start Duel (Hide 3D) →
              </button>
            </div>
          </div>

          {/* Quick Alphabet Reference Grid */}
          <div className="bg-slate-950/90 p-3 rounded-2xl border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center justify-between">
              <span>All 20 Alphabet Face Values:</span>
              <span className="text-amber-400">Remember both the letter and its value!</span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 text-center">
              {faces.map((f) => (
                <div
                  key={`memo-chip-${f.id}`}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 hover:border-cyan-500 transition-colors"
                >
                  <div className="text-xs font-black text-cyan-400">{f.label}</div>
                  <div className="text-sm font-extrabold text-white">{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
              <ThreeIcosahedron
                faces={faces}
                autoRotate={true}
                showLabels={true}
                hideNumbers={false}
                height={360}
              />
            </div>
            <div className="lg:col-span-4 flex flex-col justify-between bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase">
                  <Sparkles className="w-4 h-4" /> Dihya's Antipodal Grouping
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Notice the 10 opposite pairs! For example, Face <strong className="text-white">A ({faces[0]?.value})</strong> is directly opposite Face <strong className="text-white">{faces[faces[0]?.oppositeFaceId]?.label} ({faces[faces[0]?.oppositeFaceId]?.value})</strong>.
                </p>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200">10 Antipodal Pairs:</div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {faces.slice(0, 5).map((f) => {
                    const opp = faces[f.oppositeFaceId];
                    return (
                      <div key={f.id} className="text-slate-300">
                        <span className="font-bold text-cyan-400">{f.label}</span> ({f.value}) ↔ <span className="font-bold text-amber-400">{opp?.label}</span> ({opp?.value})
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <UnfoldedNetView faces={faces} showDihyaPoles={true} hideNumbers={false} />
        </div>
      )}

      {/* ARENA BATTLE DUEL (3D ICOSAHEDRON IS COMPLETELY HIDDEN - Pure Memory Calculation) */}
      {tournamentPhase === 'battle' && currentQuestion && (
        <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 animate-fadeIn">
          {/* Top Scoreboard Podium */}
          <div className="grid grid-cols-3 items-center bg-slate-950/90 p-4 rounded-2xl border border-slate-800">
            {/* Player Score */}
            <div className="text-left space-y-0.5">
              <div className="text-xs font-black text-cyan-400 uppercase tracking-wider">You</div>
              <div className="text-2xl sm:text-3xl font-black text-white">{playerScore} pts</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden max-w-[140px]">
                <div
                  className="bg-cyan-400 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (playerScore / targetScore) * 100)}%` }}
                />
              </div>
            </div>

            {/* Round & Timer */}
            <div className="text-center space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                Round {roundNumber} • First to {targetScore}
              </span>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 font-black text-lg">
                <Timer className="w-4 h-4" /> {questionTimer}s
              </div>
            </div>

            {/* Opponent Score */}
            <div className="text-right space-y-0.5">
              <div className="text-xs font-black text-rose-400 uppercase tracking-wider">
                {champion.name}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">{opponentScore} pts</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden max-w-[140px] ml-auto">
                <div
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (opponentScore / targetScore) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Question Display Card */}
          <div className="bg-slate-950 p-6 rounded-3xl border border-cyan-500/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 px-2.5 py-1 bg-cyan-500/10 rounded-md border border-cyan-500/20">
                {currentQuestion.type.replace(/_/g, ' ')}
              </span>
              {currentQuestion.terms && (
                <span className="text-xs text-slate-400 font-semibold">
                  {currentQuestion.terms.length} Alphabet Values to Recall from Memory
                </span>
              )}
            </div>

            {/* Big Visual Letters Equation Chips */}
            {currentQuestion.terms && currentQuestion.terms.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-3 py-3">
                {currentQuestion.terms.map((t, idx) => (
                  <React.Fragment key={`term-${idx}`}>
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-cyan-400/70 flex flex-col items-center justify-center text-cyan-300 font-black shadow-lg shadow-cyan-500/10">
                      <span className="text-2xl">{t.label}</span>
                    </div>
                    {idx < currentQuestion.terms!.length - 1 && (
                      <span className="text-slate-400 font-bold text-2xl">+</span>
                    )}
                  </React.Fragment>
                ))}
                <span className="text-slate-400 font-bold text-2xl">=</span>
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border-2 border-dashed border-cyan-400 flex items-center justify-center text-cyan-300 font-black text-2xl animate-pulse">
                  ?
                </div>
              </div>
            ) : (
              <h3 className="text-xl font-bold text-white text-center py-2">
                {currentQuestion.prompt}
              </h3>
            )}

            <p className="text-xs text-slate-400 text-center italic">
              {currentQuestion.promptIndonesian}
            </p>
          </div>

          {/* Quick Typing Input Bar */}
          <form onSubmit={handleCustomTypeSubmit} className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                ref={typeInputRef}
                id="input-tourney-type-answer"
                type="text"
                value={customInputAnswer}
                onChange={(e) => setCustomInputAnswer(e.target.value)}
                disabled={isAnswerLocked}
                placeholder="Type numerical answer directly (e.g. 54) or click below..."
                className="w-full bg-slate-950 border-2 border-slate-800 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 text-white font-mono text-lg font-black px-5 py-3 rounded-2xl outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isAnswerLocked || !customInputAnswer.trim()}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-black text-sm rounded-2xl transition-all shadow-lg"
            >
              Submit Answer
            </button>
          </form>

          {/* Multiple Choice Options Keypad */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {currentQuestion.options.map((opt, i) => {
              const isSelected = selectedAnswer === opt;
              const isCorrect = String(opt) === String(currentQuestion.correctAnswer);

              let btnStyle = 'bg-slate-800/90 hover:bg-slate-700 text-white border-slate-700';

              if (isAnswerLocked) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-600 text-white border-emerald-400 font-black shadow-lg shadow-emerald-600/30';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-600 text-white border-rose-400 font-black';
                } else {
                  btnStyle = 'bg-slate-900/60 text-slate-500 border-slate-800 opacity-60';
                }
              }

              return (
                <button
                  key={`opt-${i}`}
                  id={`btn-option-${i}`}
                  onClick={() => handleSubmitAnswer(opt)}
                  disabled={isAnswerLocked}
                  className={`p-4 rounded-2xl text-center text-xl font-black border-2 transition-all duration-150 transform hover:scale-[1.01] active:scale-[0.99] ${btnStyle}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Feedback and Sum Breakdown */}
          {isAnswerLocked && (
            <div className="space-y-3 animate-fadeIn">
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm font-bold ${
                  answerStatus === 'correct'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {answerStatus === 'correct' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <span>
                    {answerStatus === 'correct'
                      ? 'CORRECT! Flawless 3D mental recall and summation.'
                      : aiMessage || 'INCORRECT! Miscalculated the alphabet sum.'}
                  </span>
                </div>
              </div>

              {/* Formula Breakdown Card */}
              <div className="text-xs text-slate-300 bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-amber-400 text-[11px] uppercase">
                  Alphabet Value Breakdown:
                </div>
                <p className="font-mono text-cyan-300 text-sm">{currentQuestion.explanation}</p>
              </div>

              <button
                id="btn-next-round"
                onClick={nextRound}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-2xl shadow-lg transition-all text-sm"
              >
                Next Question →
              </button>
            </div>
          )}
        </div>
      )}

      {/* STAGE RESULT */}
      {tournamentPhase === 'round_result' && (
        <div className="bg-slate-900/90 rounded-3xl p-8 border border-slate-800 shadow-2xl text-center space-y-6 animate-fadeIn">
          {playerScore >= targetScore ? (
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 text-4xl shadow-xl shadow-emerald-500/20">
                <Trophy className="w-10 h-10" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                STAGE {currentStage + 1} DEFEATED: {champion.name}
              </h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                You outperformed {champion.name} with a final score of {playerScore} to {opponentScore}!
              </p>
              <div className="flex justify-center gap-4 pt-2">
                <button
                  id="btn-advance-stage"
                  onClick={advanceToNextStage}
                  className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-2xl shadow-lg transition-all text-sm"
                >
                  Face Next Champion →
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 text-4xl shadow-xl">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                ELIMINATED BY {champion.name}
              </h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                {champion.name} reached {opponentScore} points first ({playerScore} pts). Re-anchor your alphabet values and try again!
              </p>
              <div className="flex justify-center gap-4 pt-2">
                <button
                  id="btn-retry-match"
                  onClick={() => startMatch(currentStage)}
                  className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all text-sm"
                >
                  Rematch {champion.name}
                </button>
                <button
                  id="btn-return-lobby"
                  onClick={() => setTournamentPhase('lobby')}
                  className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-2xl transition-all text-sm"
                >
                  Return to Gauntlet
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GRAND CHAMPION CROWNED */}
      {tournamentPhase === 'champion_crowned' && (
        <div className="bg-slate-900/90 rounded-3xl p-8 border border-amber-500/40 shadow-2xl text-center space-y-6 animate-fadeIn">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-2xl shadow-amber-500/30">
            <Award className="w-12 h-12" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
            CLASH OF CHAMPIONS WINNER
          </h2>
          <p className="text-sm text-slate-300 max-w-lg mx-auto">
            You conquered all Clash of Champions Season 3 contestants across the 20-face Icosahedron Alphabet War! Your multi-alphabet 3D memory and calculation speed is unmatched.
          </p>
          <button
            id="btn-celebrate-finish"
            onClick={() => setTournamentPhase('lobby')}
            className="px-8 py-3.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black rounded-2xl shadow-xl transition-all text-sm"
          >
            Play Again / Gauntlet Select
          </button>
        </div>
      )}
    </div>
  );
};

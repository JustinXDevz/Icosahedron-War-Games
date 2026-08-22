import React, { useState } from 'react';
import { SessionSummaryStats } from '../types/game';
import { sounds } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Timer,
  Target,
  Flame,
  CheckCircle2,
  XCircle,
  Zap,
  RotateCcw,
  ArrowRight,
  Share2,
  Check,
  Award,
  Sparkles,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SessionSummaryViewProps {
  stats: SessionSummaryStats;
  onRestart: () => void;
  onContinue?: () => void;
  onBackToMenu?: () => void;
}

export const SessionSummaryView: React.FC<SessionSummaryViewProps> = ({
  stats,
  onRestart,
  onContinue,
  onBackToMenu,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(true);

  // Trigger celebration on high accuracy
  React.useEffect(() => {
    if (stats.accuracyPercentage >= 75) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [stats.accuracyPercentage]);

  // Performance Rating Badge
  const getPerformanceTier = () => {
    if (stats.accuracyPercentage >= 90 && stats.averageResponseTimeSec <= 4.0) {
      return {
        label: 'S-TIER GRANDMASTER',
        color: 'text-amber-300 border-amber-400 bg-amber-500/20',
        desc: 'Prodigy-level 3D spatial recall and lightning arithmetic calculation!',
      };
    }
    if (stats.accuracyPercentage >= 80 && stats.averageResponseTimeSec <= 7.0) {
      return {
        label: 'A-TIER CHAMPION',
        color: 'text-cyan-300 border-cyan-400 bg-cyan-500/20',
        desc: 'Exceptional memory endurance and high accuracy under pressure.',
      };
    }
    if (stats.accuracyPercentage >= 60) {
      return {
        label: 'B-TIER CONTENDER',
        color: 'text-blue-300 border-blue-400 bg-blue-500/20',
        desc: 'Solid grasp of icosahedron face values and connectivity.',
      };
    }
    return {
      label: 'TRAINING RECRUIT',
      color: 'text-slate-300 border-slate-500 bg-slate-800',
      desc: 'Keep training with Dihya’s 3D Method Lab and practice clock presets.',
    };
  };

  const tier = getPerformanceTier();

  const handleCopyStats = () => {
    sounds.playClick();
    const text = `🏆 Clash of Champions: Icosahedron War Session
📊 Mode: ${stats.modeName}
🎯 Accuracy: ${stats.accuracyPercentage.toFixed(1)}% (${stats.correctChallenges}/${stats.totalChallenges} challenges)
⚡ Avg Response Time: ${stats.averageResponseTimeSec.toFixed(2)}s (Fastest: ${stats.fastestResponseTimeSec.toFixed(2)}s)
🔥 Max Streak: ${stats.maxStreak} | Score: ${stats.totalScore}
🏅 Rank: ${tier.label}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div id="session-summary-view" className="w-full max-w-4xl mx-auto space-y-6 animate-fadeIn pb-8">
      {/* Main Header Container */}
      <div className="bg-slate-900/95 rounded-3xl p-6 sm:p-8 border border-cyan-500/50 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Title & Rank Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-cyan-500/25 shrink-0">
              <Trophy className="w-9 h-9 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-md border border-cyan-500/30">
                  Session Completed
                </span>
                <span className="text-xs text-slate-400 font-semibold">{stats.modeName}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Session Performance Summary
              </h1>
            </div>
          </div>

          {/* Performance Tier Pill */}
          <div className={`px-4 py-2 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg ${tier.color}`}>
            <Award className="w-5 h-5" />
            <div className="flex flex-col text-left">
              <span>{tier.label}</span>
              <span className="text-[10px] font-medium opacity-80">{stats.records.length} Challenges Played</span>
            </div>
          </div>
        </div>

        {/* Core Highlight Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {/* Metric 1: Average Response Time */}
          <div className="bg-slate-950/90 rounded-2xl p-5 border border-cyan-500/40 shadow-lg space-y-2 relative overflow-hidden group hover:border-cyan-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-cyan-400" /> Avg Response Time
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded">
                Speed
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                {stats.averageResponseTimeSec.toFixed(2)}
              </span>
              <span className="text-sm font-bold text-cyan-400">sec</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span>Fastest Solve:</span>
              <span className="font-mono text-cyan-300 font-bold">
                {stats.fastestResponseTimeSec > 0 ? `${stats.fastestResponseTimeSec.toFixed(2)}s` : '—'}
              </span>
            </div>
          </div>

          {/* Metric 2: Total Accuracy Percentage */}
          <div className="bg-slate-950/90 rounded-2xl p-5 border border-emerald-500/40 shadow-lg space-y-2 relative overflow-hidden group hover:border-emerald-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-400" /> Total Accuracy
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
                Precision
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                {stats.accuracyPercentage.toFixed(1)}
              </span>
              <span className="text-sm font-bold text-emerald-400">%</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span>Solved Correctly:</span>
              <span className="font-mono text-emerald-300 font-bold">
                {stats.correctChallenges} / {stats.totalChallenges}
              </span>
            </div>
          </div>

          {/* Metric 3: Max Streak & Total Score */}
          <div className="bg-slate-950/90 rounded-2xl p-5 border border-amber-500/40 shadow-lg space-y-2 relative overflow-hidden group hover:border-amber-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" /> Max Streak
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded">
                Momentum
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                {stats.maxStreak}
              </span>
              <span className="text-sm font-bold text-amber-400">in a row</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span>Total Points:</span>
              <span className="font-mono text-amber-300 font-bold">{stats.totalScore} pts</span>
            </div>
          </div>

          {/* Metric 4: Total Attempts / Challenges */}
          <div className="bg-slate-950/90 rounded-2xl p-5 border border-indigo-500/40 shadow-lg space-y-2 relative overflow-hidden group hover:border-indigo-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" /> Challenges
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded">
                Volume
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                {stats.totalChallenges}
              </span>
              <span className="text-sm font-bold text-indigo-400">played</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span>Total Submissions:</span>
              <span className="font-mono text-indigo-300 font-bold">{stats.totalAttempts} tries</span>
            </div>
          </div>
        </div>

        {/* Evaluation Summary Note */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-start gap-3 relative z-10">
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold text-white">Performance Insight:</div>
            <p className="text-slate-400 leading-relaxed">{tier.desc}</p>
          </div>
        </div>
      </div>

      {/* Challenge-by-Challenge Breakdown List */}
      {stats.records.length > 0 && (
        <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-black text-white">
                Challenge Breakdown ({stats.records.length} items)
              </h3>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                setShowHistory(!showHistory);
              }}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              {showHistory ? (
                <>
                  Hide Details <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Show Details <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {showHistory && (
            <div className="space-y-2.5 animate-fadeIn">
              <div className="grid grid-cols-12 text-[11px] font-bold uppercase text-slate-500 px-3 py-1">
                <span className="col-span-1">#</span>
                <span className="col-span-4 sm:col-span-5">Challenge Target / Prompt</span>
                <span className="col-span-3 sm:col-span-3">Your Answer</span>
                <span className="col-span-2 sm:col-span-2 text-right">Response Time</span>
                <span className="col-span-2 sm:col-span-1 text-right">Status</span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {stats.records.map((rec, i) => (
                  <div
                    key={`rec-${rec.id || i}`}
                    className={`grid grid-cols-12 items-center p-3 rounded-xl border text-xs transition-all ${
                      rec.isCorrect
                        ? 'bg-slate-950/90 border-slate-800 hover:border-emerald-500/40'
                        : 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60'
                    }`}
                  >
                    {/* Index */}
                    <div className="col-span-1 font-mono font-bold text-slate-400">
                      {i + 1}
                    </div>

                    {/* Challenge Title */}
                    <div className="col-span-4 sm:col-span-5 space-y-0.5">
                      <div className="font-bold text-white truncate">{rec.title}</div>
                      {rec.details && (
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {rec.details}
                        </div>
                      )}
                    </div>

                    {/* User Submission */}
                    <div className="col-span-3 sm:col-span-3 font-mono font-bold text-cyan-300 truncate">
                      {String(rec.userSubmission || '—')}
                    </div>

                    {/* Response Time */}
                    <div className="col-span-2 sm:col-span-2 text-right font-mono font-bold text-slate-300">
                      {(rec.responseTimeMs / 1000).toFixed(2)}s
                    </div>

                    {/* Status Badge */}
                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                      {rec.isCorrect ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Pass</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-400 font-bold text-[11px] bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/30">
                          <XCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Miss</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Footer Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            id="btn-copy-session-stats"
            onClick={handleCopyStats}
            className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-2xl flex items-center gap-2 transition-all shadow-md"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Copied to Clipboard!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-cyan-400" /> Copy & Share Stats
              </>
            )}
          </button>

          {onBackToMenu && (
            <button
              onClick={() => {
                sounds.playClick();
                onBackToMenu();
              }}
              className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 font-bold text-xs rounded-2xl transition-all"
            >
              All Modes
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-session-play-again"
            onClick={() => {
              sounds.playClick();
              onRestart();
            }}
            className="px-6 py-3 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-cyan-500/25 flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" /> Start New Session
          </button>

          {onContinue && (
            <button
              id="btn-session-continue"
              onClick={() => {
                sounds.playClick();
                onContinue();
              }}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Next Challenge <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

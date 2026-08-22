import React, { useState } from 'react';
import { GameMode, IcosahedronFace } from '../types/game';
import { generateIcosahedronFaces } from '../utils/icosahedronGeometry';
import { isFacesConnected } from '../utils/pathSumGenerator';
import { sounds } from '../utils/soundEffects';
import {
  BookOpen,
  Target,
  Trophy,
  Swords,
  Flame,
  Compass,
  Link2,
  Clock,
  Keyboard,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Layers,
  HelpCircle,
  Zap,
  Play,
  RotateCcw,
  Check,
  X,
  Volume2,
} from 'lucide-react';

interface HowToPlayGuideProps {
  onSelectMode: (mode: GameMode) => void;
}

export const HowToPlayGuide: React.FC<HowToPlayGuideProps> = ({ onSelectMode }) => {
  const [activeTab, setActiveTab] = useState<
    'quickstart' | 'target_sum' | 'modes' | 'geometry' | 'dihya' | 'practice'
  >('quickstart');

  // Mini Interactive Sandbox state inside the guide
  const [sampleFaces] = useState<IcosahedronFace[]>(() => generateIcosahedronFaces());
  const [testedLetters, setTestedLetters] = useState<string[]>(['A', 'B', 'F']);

  const parsedSampleFaceIds = React.useMemo(() => {
    return testedLetters
      .map((l) => sampleFaces.find((f) => f.label === l)?.id)
      .filter((id): id is number => id !== undefined);
  }, [testedLetters, sampleFaces]);

  const isConnectedSample = isFacesConnected(parsedSampleFaceIds, sampleFaces);
  const sampleSum = parsedSampleFaceIds.reduce((sum, id) => sum + sampleFaces[id].value, 0);

  const toggleLetter = (label: string) => {
    sounds.playClick();
    if (testedLetters.includes(label)) {
      setTestedLetters(testedLetters.filter((l) => l !== label));
    } else {
      if (testedLetters.length < 5) {
        setTestedLetters([...testedLetters, label]);
      }
    }
  };

  return (
    <div id="how-to-play-guide-page" className="w-full max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Hero Header */}
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-cyan-500/40 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center text-slate-950 shadow-xl shadow-cyan-500/20 shrink-0">
              <BookOpen className="w-8 h-8 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-md border border-cyan-500/30">
                  Official Game Guide
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  Ruangguru Clash of Champions S3
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                How to Play Icosahedron War
              </h1>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onSelectMode('target_sum');
            }}
            className="px-6 py-3 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-cyan-500/25 flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-slate-950" /> Start Playing Now →
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          Master the ultimate 3D mental arithmetic battle inspired by the famous 20-face Icosahedron War in{' '}
          <strong className="text-cyan-300">Clash of Champions Season 3</strong>. Learn how to memorize 20 alphabet values (A–T), visualize 3D face connectivity in your head, and type solutions under pressure.
        </p>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
          {[
            { id: 'quickstart', label: '🚀 Quick Start (3 Steps)', icon: Zap },
            { id: 'target_sum', label: '🎯 Target Sum (Target = 54)', icon: Target },
            { id: 'modes', label: '🏆 All Game Modes', icon: Trophy },
            { id: 'geometry', label: '📐 3D Connectivity Rules', icon: Link2 },
            { id: 'dihya', label: "🧭 Dihya's Master Strategy", icon: Compass },
            { id: 'practice', label: '🧪 Interactive Sandbox', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={`guide-tab-${tab.id}`}
                id={`btn-guide-tab-${tab.id}`}
                onClick={() => {
                  sounds.playClick();
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: QUICK START (3 STEPS) */}
      {activeTab === 'quickstart' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 relative overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-lg flex items-center justify-center">
                1
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase text-amber-400">Phase 1</div>
                <h3 className="text-lg font-black text-white">Memorize 20 Values</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Before the question begins, inspect the 3D Icosahedron and 2D Net. Memorize the numerical value on each of the 20 alphabet faces (<strong className="text-white">A through T</strong>) and note which faces touch.
              </p>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Practice Clock Presets:
                </div>
                <div>5s Blitz, 10s Sprint, 15s Fast, 20s Classic, 30s Practice, or ♾️ Untimed Daily Practice.</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 relative overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-black text-lg flex items-center justify-center">
                2
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase text-cyan-400">Phase 2</div>
                <h3 className="text-lg font-black text-white">3D Model Disappears</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                When the timer expires or you click <em>"Start Solving"</em>, the 3D icosahedron and 2D net <strong className="text-rose-300">completely vanish</strong>. A target question is revealed, such as <strong className="text-cyan-300">TARGET = 54</strong>.
              </p>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <div className="font-bold text-cyan-300 flex items-center gap-1">
                  <EyeOff className="w-3.5 h-3.5" /> True Spatial Memory:
                </div>
                <div>You must rely 100% on mental recall and spatial 3D visualization.</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 relative overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-lg flex items-center justify-center">
                3
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase text-emerald-400">Phase 3</div>
                <h3 className="text-lg font-black text-white">Type & Submit</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Type the letters on your keyboard (e.g. <span className="font-mono text-cyan-300 font-bold">A B F</span> or <span className="font-mono text-cyan-300 font-bold">ABF</span>) or use the on-screen keypad. Mental calculate the sum and press <strong className="text-white">Enter (↵)</strong> to submit!
              </p>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <div className="font-bold text-emerald-300 flex items-center gap-1">
                  <Keyboard className="w-3.5 h-3.5" /> Pure Mental Recall:
                </div>
                <div>Alphabet numbers are hidden while typing so you must compute the sum in your head.</div>
              </div>
            </div>
          </div>

          {/* Quick CTA to jump in */}
          <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 p-6 rounded-3xl border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-white">Ready to test your memory?</h3>
              <p className="text-xs text-slate-400">
                Start with Target Sum Quest or try Untimed Daily Practice to master the 20 alphabet values.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSelectMode('target_sum')}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all"
              >
                Play Target Sum Quest →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TARGET SUM QUEST (TARGET = 54) */}
      {activeTab === 'target_sum' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-md">
                  Flagship COC S3 Mechanic
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Target Sum Quest Explained
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              In this mode, the system gives you a target number, for example: <strong className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-amber-300 font-mono">TARGET = 54</strong>.
            </p>

            {/* Example Walkthrough Box */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-cyan-500/40 space-y-4">
              <div className="text-xs font-black uppercase text-cyan-400 tracking-wider">
                💡 Concrete Example Walkthrough:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400">1. Memorized Faces:</div>
                  <div className="font-mono text-xs text-white">
                    • Face <strong className="text-cyan-400">A</strong> = 14<br />
                    • Face <strong className="text-cyan-400">B</strong> = 22<br />
                    • Face <strong className="text-cyan-400">F</strong> = 18
                  </div>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400">2. 3D Adjacency Check:</div>
                  <div className="text-xs text-emerald-400 font-bold">
                    ✓ A connects to B (shares edge)<br />
                    ✓ B connects to F (shares edge)<br />
                    <span className="text-[10px] text-slate-400 font-normal">Forms valid path A ➔ B ➔ F</span>
                  </div>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400">3. Mental Sum Check:</div>
                  <div className="font-mono text-xs text-amber-300 font-bold">
                    14 + 22 + 18 = 54<br />
                    <span className="text-emerald-400">EXACT MATCH with TARGET 54!</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4 text-cyan-400" /> How to Input Your Answer:
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
                  <li>Simply type on your physical keyboard: <span className="font-mono text-cyan-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">A B F</span> or <span className="font-mono text-cyan-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">ABF</span>.</li>
                  <li>Or tap the 20 on-screen letter buttons from <strong className="text-white">A</strong> through <strong className="text-white">T</strong>.</li>
                  <li>Press <strong className="text-white">Enter</strong> or click <em>"Submit"</em>.</li>
                  <li>Use <strong className="text-white">Backspace</strong> (⌫) or <em>"Clear All"</em> to edit your chain.</li>
                </ul>
              </div>
            </div>

            {/* Adjacency Rule Highlight */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs text-amber-200">
              <div className="font-bold text-amber-400 flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" /> Important: Faces MUST Be Connected in 3D
              </div>
              <p className="leading-relaxed">
                Even if letters sum up to the target number mathematically, they will be <strong className="text-rose-400">rejected</strong> if they are not directly connected along shared edges in 3D geometry!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ALL GAME MODES */}
      {activeTab === 'modes' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Target Sum Quest */}
            <div className="bg-slate-900/90 rounded-3xl p-6 border border-cyan-500/40 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Target className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-md">
                    Flagship Mode
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">Target Sum Quest</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Given a target sum (e.g. 54), type a continuous connected chain of 2 to 5 letters whose memorized values add up exactly to the target. Pure typing with countdown clock presets.
                </p>
              </div>

              <button
                onClick={() => onSelectMode('target_sum')}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                Play Target Sum Quest <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tournament Gauntlet */}
            <div className="bg-slate-900/90 rounded-3xl p-6 border border-amber-500/40 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-md">
                    1v1 Champion Duels
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">COC Tournament Gauntlet</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Duel COC Season 3 prodigies (Dihya, Sandy, Axel, Maxwell, Shakira). Buzzer speed questions testing Vertex 5-face sums, Ring sums, Antipodal quad sums, and connected sums with the 3D model hidden!
                </p>
              </div>

              <button
                onClick={() => onSelectMode('tournament')}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                Play Tournament Gauntlet <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Icosahedron War */}
            <div className="bg-slate-900/90 rounded-3xl p-6 border border-rose-500/40 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Swords className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-md">
                    Tactical Conquest
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">Icosahedron War (Conquest)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Turn-based territorial strategy. Solve math on adjacent faces to conquer sectors, claim 12 strategic vertices, activate shields, and execute antipodal counter-strikes across the polyhedron.
                </p>
              </div>

              <button
                onClick={() => onSelectMode('war')}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                Play Icosahedron War <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rapid Fire 60s */}
            <div className="bg-slate-900/90 rounded-3xl p-6 border border-orange-500/40 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <Flame className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded-md">
                    Speed Arithmetic
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">Rapid Fire 60s</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  A high-octane 60-second arithmetic speed trial. Answer as many 3D memorization equations as possible to build frenzy combos and score multipliers.
                </p>
              </div>

              <button
                onClick={() => onSelectMode('rapid')}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                Play Rapid Fire 60s <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: 3D CONNECTIVITY RULES */}
      {activeTab === 'geometry' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                Geometry & Spatial Graph
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                How Faces Connect in an Icosahedron
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                A regular icosahedron is a 3D convex polyhedron with <strong className="text-cyan-300">20 equilateral triangular faces</strong>, <strong className="text-amber-300">12 vertices</strong>, and <strong className="text-rose-300">30 edges</strong>.
              </p>
            </div>

            {/* Connection Visual Rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 space-y-2">
                <div className="font-bold text-emerald-400 flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" /> VALID CONNECTION (Shared Edge)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Two faces are <strong className="text-emerald-300">connected</strong> if and only if they share a full edge (2 common vertices).
                </p>
                <div className="p-2.5 bg-slate-950 rounded-xl text-[11px] font-mono text-emerald-300 border border-slate-800">
                  Every face has EXACTLY 3 adjacent neighbors.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 space-y-2">
                <div className="font-bold text-rose-400 flex items-center gap-2 text-sm">
                  <X className="w-5 h-5 shrink-0" /> INVALID / DISCONNECTED
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Faces that only touch at a single vertex point or are situated across the polyhedron are <strong className="text-rose-400">NOT connected</strong>!
                </p>
                <div className="p-2.5 bg-slate-950 rounded-xl text-[11px] font-mono text-rose-300 border border-slate-800">
                  Example: Face A and Face T are antipodal opposites (separated by 4 edges).
                </div>
              </div>
            </div>

            {/* Adjacency Table Quick Guide */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" /> Face Adjacency Reference Table:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 text-xs">
                {sampleFaces.map((f) => (
                  <div
                    key={`ref-face-${f.id}`}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between font-black">
                      <span className="text-cyan-400 font-bold">Face {f.label}</span>
                      <span className="text-slate-500 text-[10px]">({f.value})</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Adjacent to:{' '}
                      <span className="text-white font-bold">
                        {f.adjacentFaceIds.map((id) => sampleFaces[id].label).join(', ')}
                      </span>
                    </div>
                    <div className="text-[9px] text-amber-400/80">
                      Opposite: Face {sampleFaces[f.oppositeFaceId].label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DIHYA'S MASTER STRATEGY */}
      {activeTab === 'dihya' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md">
                  Championship Secret
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Dihya's 2-Pole 3D Reference Method
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              How did <strong className="text-white">Dihya</strong> dominate the Clash of Champions memorization challenge? Instead of memorizing 20 random disconnected numbers, he decomposed the icosahedron into a 4-tier spatial hierarchy:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-2">
                <div className="font-bold text-indigo-300 text-sm flex items-center gap-2">
                  1. The 2 Reference Poles
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Designate <strong className="text-white">Face A</strong> as the North Pole and its antipodal opposite <strong className="text-white">Face T</strong> as the South Pole. These serve as mental origin points.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-2">
                <div className="font-bold text-cyan-300 text-sm flex items-center gap-2">
                  2. Two 5-Triangle Polar Caps
                </div>
                <p className="text-slate-400 leading-relaxed">
                  The North Pole is surrounded by 5 triangles forming the top cap (<strong className="text-cyan-300">B, C, D, E, F</strong>). The South Pole is surrounded by 5 triangles (<strong className="text-cyan-300">O, P, Q, R, S</strong>).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-2">
                <div className="font-bold text-amber-300 text-sm flex items-center gap-2">
                  3. The 10-Triangle Equator Belt
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Between the two caps sits a continuous zigzag ring of 10 alternating triangles (<strong className="text-amber-300">G through P</strong>) wrapping around the waist.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-2">
                <div className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                  4. Antipodal Symmetry
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Every face has a unique opposite face on the exact other side of the 3D center: (A ↔ T, B ↔ S, C ↔ R, etc.). Memorizing in pairs halves your mental load!
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-300">
                Explore this method interactively in <strong>Dihya's 3D Method Lab</strong> with full exploded views and symmetry planes.
              </div>
              <button
                onClick={() => onSelectMode('lab')}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs rounded-xl shrink-0 transition-all shadow-md"
              >
                Open 3D Lab →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: INTERACTIVE SANDBOX */}
      {activeTab === 'practice' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-cyan-500/40 shadow-xl space-y-6">
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                Interactive Practice Sandbox
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Test Letter Connections & Sums Live
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Click any letters below to build a chain. Watch how the 3D connectivity validator and sum calculator work in real time!
              </p>
            </div>

            {/* Current Selection HUD */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between text-xs font-bold text-slate-400">
                <span>Selected Letter Chain ({testedLetters.length} Letters):</span>
                <span>
                  {testedLetters.length < 2 ? (
                    <span className="text-slate-500">Select at least 2 letters</span>
                  ) : isConnectedSample ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Connected in 3D!
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <X className="w-4 h-4" /> Disconnected in 3D!
                    </span>
                  )}
                </span>
              </div>

              {/* Equation Visualizer */}
              <div className="flex flex-wrap items-center gap-2 min-h-[50px] bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                {testedLetters.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">
                    Tap letters below to test their 3D connection...
                  </span>
                ) : (
                  testedLetters.map((l, idx) => {
                    const face = sampleFaces.find((f) => f.label === l);
                    return (
                      <React.Fragment key={`sandbox-chip-${l}`}>
                        <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/60 text-cyan-300 font-black text-sm flex items-center gap-1.5 shadow-md">
                          <span>{l}</span>
                          <span className="text-xs text-slate-400 font-mono">({face?.value})</span>
                        </div>
                        {idx < testedLetters.length - 1 && (
                          <span className="text-slate-400 font-bold text-sm">+</span>
                        )}
                      </React.Fragment>
                    );
                  })
                )}

                {testedLetters.length > 0 && (
                  <>
                    <span className="text-slate-400 font-bold text-sm">=</span>
                    <div className="px-4 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500 text-cyan-300 font-black text-sm">
                      Sum = {sampleSum}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 20 Letter Selector Buttons */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase text-slate-400">
                Click Letters to Add/Remove (A to T):
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {sampleFaces.map((f) => {
                  const isSelected = testedLetters.includes(f.label);
                  return (
                    <button
                      key={`btn-sandbox-${f.label}`}
                      id={`btn-sandbox-${f.label}`}
                      onClick={() => toggleLetter(f.label)}
                      className={`p-3 rounded-xl font-black text-sm border-2 transition-all transform active:scale-95 flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/20'
                          : 'bg-slate-950 hover:bg-slate-800 text-white border-slate-800 hover:border-cyan-500/40'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                        {f.value}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

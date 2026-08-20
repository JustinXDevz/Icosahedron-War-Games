import React from 'react';
import { X, Trophy, Swords, Flame, Compass, Target, BookOpen, Link2 } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RuleModal: React.FC<RuleModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div
        id="modal-rules-card"
        className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl animate-scaleIn"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                Icosahedron War Guide & Rules
              </h3>
              <p className="text-xs text-slate-400">
                Ruangguru Clash of Champions Season 3 Game Mechanics
              </p>
            </div>
          </div>

          <button
            id="btn-close-rules"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Concept & Target Sum Mechanic */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/40 space-y-2 text-xs text-slate-300">
          <h4 className="font-bold text-cyan-400 text-sm flex items-center gap-2">
            <Target className="w-4 h-4" /> Connected Alphabet Target Sum (e.g. Target = 54)
          </h4>
          <p className="leading-relaxed">
            In the flagship Clash of Champions challenge, you are given a <strong className="text-white">Target Number (e.g., 54)</strong>. Your objective is to find and link a chain of <strong className="text-cyan-300">directly connected/adjacent alphabet faces</strong> on the 3D icosahedron whose numeric values add up exactly to the target sum!
          </p>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div className="font-bold text-amber-400 flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5" /> Adjacency Rule:
            </div>
            <p>
              Two faces are connected if and only if they <strong className="text-white">share a triangular edge</strong> in 3D space. You cannot jump across disconnected faces!
            </p>
          </div>
        </div>

        {/* Section 2: Dihya's Master Method */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
          <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
            🧭 Dihya's Opposite Reference Pole Strategy
          </h4>
          <p className="leading-relaxed">
            Contestant <span className="text-white font-bold">Dihya</span> solved the 20-face 3D memorization by picking two antipodal poles (North and South reference faces). This decomposes the 20 faces into:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li><strong className="text-slate-200">2 Pole Faces</strong> (Top & Bottom references).</li>
            <li><strong className="text-slate-200">Two 5-Triangle Caps</strong> directly adjacent to each pole.</li>
            <li><strong className="text-slate-200">10-Triangle Alternating Equator Belt</strong> connecting the poles.</li>
            <li><strong className="text-slate-200">10 Antipodal Pairs</strong> linking straight through the center.</li>
          </ul>
        </div>

        {/* Section 3: Modes */}
        <div className="space-y-3">
          <h4 className="font-bold text-white text-sm">All Game Modes:</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                <Target className="w-4 h-4" /> Target Sum Quest
              </div>
              <p className="text-slate-400 text-[11px]">
                Search connected alphabet chains that match target sums (e.g. 54) in 3D and 2D net views.
              </p>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" /> Tournament Gauntlet
              </div>
              <p className="text-slate-400 text-[11px]">
                Duel COC champions (Dihya, Sandy, Axel, Maxwell, Shakira) in buzzer speed rounds with hidden numbers.
              </p>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <div className="font-bold text-rose-400 flex items-center gap-1.5">
                <Swords className="w-4 h-4" /> Icosahedron War (Conquest)
              </div>
              <p className="text-slate-400 text-[11px]">
                Turn-based territory war claiming adjacent vertices, antipodal counter-strikes, and shields.
              </p>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <div className="font-bold text-orange-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4" /> Rapid Fire 60s
              </div>
              <p className="text-slate-400 text-[11px]">
                60-second high-speed mental arithmetic sprint with streak multipliers.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            id="btn-close-rules-bottom"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20"
          >
            Got it, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};

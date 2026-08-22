import React, { useState } from 'react';
import { GameMode } from './types/game';
import { Navbar } from './components/Navbar';
import { TargetSumQuestMode } from './components/TargetSumQuestMode';
import { TournamentMode } from './components/TournamentMode';
import { WarConquestMode } from './components/WarConquestMode';
import { RapidFireMode } from './components/RapidFireMode';
import { DihyaMethodLab } from './components/DihyaMethodLab';
import { HowToPlayGuide } from './components/HowToPlayGuide';
import { RuleModal } from './components/RuleModal';
import { sounds } from './utils/soundEffects';

export default function App() {
  const [currentMode, setCurrentMode] = useState<GameMode>('target_sum');
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 font-sans antialiased relative overflow-x-hidden">
      {/* Dynamic Background Stage Spotlights */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* Top Navigation */}
      <Navbar
        currentMode={currentMode}
        onSelectMode={(mode) => setCurrentMode(mode)}
        onOpenRules={() => setCurrentMode('guide')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 z-10 relative">
        {currentMode === 'target_sum' && <TargetSumQuestMode />}
        {currentMode === 'tournament' && <TournamentMode />}
        {currentMode === 'war' && <WarConquestMode />}
        {currentMode === 'rapid' && <RapidFireMode />}
        {currentMode === 'lab' && <DihyaMethodLab />}
        {currentMode === 'guide' && <HowToPlayGuide onSelectMode={(mode) => setCurrentMode(mode)} />}
      </main>

      {/* Rules Modal (Quick Popup alternative) */}
      <RuleModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md py-4 px-4 text-center z-10 relative mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-semibold text-slate-300">
              Icosahedron War • Ruangguru Clash of Champions Season 3
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>20 Faces (A–T) • 12 Vertices • 30 Edges • Connected Sums</span>
            <button
              id="btn-footer-rules"
              onClick={() => {
                sounds.playClick();
                setCurrentMode('guide');
              }}
              className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2"
            >
              View Official Guide & Practice
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

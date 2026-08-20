import React, { useState } from 'react';
import { GameMode } from '../types/game';
import { sounds } from '../utils/soundEffects';
import {
  Trophy,
  Swords,
  Flame,
  Compass,
  Target,
  Volume2,
  VolumeX,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onOpenRules: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  onOpenRules,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(sounds.isMuted);

  const toggleAudio = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const navItems: { id: GameMode; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'target_sum',
      label: 'Target Sum Quest',
      icon: <Target className="w-4 h-4 text-cyan-400" />,
      badge: 'Target = 54',
    },
    {
      id: 'tournament',
      label: 'COC Tournament',
      icon: <Trophy className="w-4 h-4 text-amber-400" />,
      badge: 'Season 3',
    },
    {
      id: 'war',
      label: 'Icosahedron War',
      icon: <Swords className="w-4 h-4 text-rose-400" />,
      badge: 'Conquest',
    },
    {
      id: 'rapid',
      label: 'Rapid Fire',
      icon: <Flame className="w-4 h-4 text-orange-400" />,
      badge: '60s Sprint',
    },
    {
      id: 'lab',
      label: "Dihya's Lab",
      icon: <Compass className="w-4 h-4 text-indigo-400" />,
      badge: '3D Academy',
    },
  ];

  return (
    <header className="w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div
            onClick={() => {
              sounds.playClick();
              onSelectMode('target_sum');
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <span className="text-xl font-black text-slate-950">20</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-base tracking-tight group-hover:text-cyan-400 transition-colors">
                  ICOSAHEDRON WAR
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-md border border-cyan-500/30">
                  COC S3
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Ruangguru Clash of Champions 3D Arena
              </p>
            </div>
          </div>

          {/* Audio and Help Controls on Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="btn-sound-mobile"
              onClick={toggleAudio}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            <button
              id="btn-rules-mobile"
              onClick={onOpenRules}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800/80 overflow-x-auto max-w-full">
          {navItems.map((item) => {
            const isActive = currentMode === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => {
                  sounds.playClick();
                  onSelectMode(item.id);
                }}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Desktop Utility Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button
            id="btn-sound-desktop"
            onClick={toggleAudio}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            id="btn-rules-desktop"
            onClick={onOpenRules}
            className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Rules & Dihya Strategy</span>
          </button>
        </div>
      </div>
    </header>
  );
};

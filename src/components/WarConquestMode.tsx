import React, { useState, useEffect } from 'react';
import { IcosahedronFace, IcosahedronVertex, Champion, ConquestMove } from '../types/game';
import { COC_CHAMPIONS } from '../data/champions';
import { generateIcosahedronFaces, generateIcosahedronVertices } from '../utils/icosahedronGeometry';
import { ThreeIcosahedron } from './ThreeIcosahedron';
import { UnfoldedNetView } from './UnfoldedNetView';
import { sounds } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  Swords,
  Shield,
  Zap,
  Sparkles,
  RotateCcw,
  Flag,
  Trophy,
  Activity,
  Check,
  ChevronRight,
} from 'lucide-react';

export const WarConquestMode: React.FC = () => {
  // Game Setup
  const [faces, setFaces] = useState<IcosahedronFace[]>(() => generateIcosahedronFaces());
  const [vertices, setVertices] = useState<IcosahedronVertex[]>(() => generateIcosahedronVertices(faces));
  const [rival, setRival] = useState<Champion>(COC_CHAMPIONS[0]); // Dihya by default
  const [isPvP, setIsPvP] = useState<boolean>(false);

  // Turn and State
  const [turn, setTurn] = useState<'player' | 'opponent'>('player');
  const [selectedFaceId, setSelectedFaceId] = useState<number | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<{
    faceId: number;
    prompt: string;
    options: number[];
    correct: number;
    points: number;
  } | null>(null);

  // Stats
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [playerEnergy, setPlayerEnergy] = useState<number>(50);
  const [opponentEnergy, setOpponentEnergy] = useState<number>(30);
  const [movesLog, setMovesLog] = useState<ConquestMove[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Reset / Init Board
  const initializeWar = (champ: Champion = rival) => {
    sounds.playClick();
    const newFaces = generateIcosahedronFaces();
    setFaces(newFaces);
    setVertices(generateIcosahedronVertices(newFaces));
    setPlayerScore(0);
    setOpponentScore(0);
    setPlayerEnergy(50);
    setOpponentEnergy(30);
    setTurn('player');
    setSelectedFaceId(null);
    setActiveChallenge(null);
    setMovesLog([]);
    setGameOver(false);
  };

  // Face Click Handler
  const handleFaceClick = (faceId: number) => {
    if (gameOver) return;
    const face = faces[faceId];
    if (!face) return;

    setSelectedFaceId(faceId);

    // If it's player's turn, create conquest challenge for this face
    if (turn === 'player') {
      const oppFace = faces[face.oppositeFaceId];
      const adjFaces = face.adjacentFaceIds.map((id) => faces[id]);
      const neighborSum = adjFaces.reduce((sum, f) => sum + f.value, 0);

      // Math challenge on this face
      const isAntipodalTarget =
        face.owner === 'opponent' ||
        faces.some((f) => f.owner === 'player' && f.oppositeFaceId === faceId);

      let targetVal = 0;
      let promptText = '';

      if (isAntipodalTarget) {
        targetVal = face.value + (oppFace?.value || 10);
        promptText = `Antipodal Link: Calculate Face ${face.label} (${face.value}) + Opposite ${oppFace?.label} (${oppFace?.value}) to conquer!`;
      } else {
        targetVal = face.value * 2;
        promptText = `Territory Claim: Solve 2 × Face ${face.label} (${face.value}) to conquer this sector!`;
      }

      // Generate 4 options
      const options = [
        targetVal,
        targetVal + 5,
        Math.max(1, targetVal - 4),
        targetVal + 10,
      ].sort(() => Math.random() - 0.5);

      setActiveChallenge({
        faceId,
        prompt: promptText,
        options,
        correct: targetVal,
        points: isAntipodalTarget ? 25 : 15,
      });
    }
  };

  // Solve Challenge
  const handleAnswerChallenge = (ans: number) => {
    if (!activeChallenge) return;

    const isCorrect = ans === activeChallenge.correct;
    const targetFace = faces[activeChallenge.faceId];

    if (isCorrect) {
      sounds.playCapture();
      const faceId = activeChallenge.faceId;

      // Update Face Owner
      const updatedFaces = faces.map((f) => {
        if (f.id === faceId) {
          return { ...f, owner: 'player' as const };
        }
        return f;
      });

      // Check vertex conquests
      let vertexBonus = 0;
      const updatedVertices = vertices.map((v) => {
        const playerHeld = v.connectedFaceIds.filter(
          (id) => updatedFaces[id]?.owner === 'player'
        ).length;
        if (playerHeld >= 3 && v.owner !== 'player') {
          vertexBonus += 20;
          sounds.playVertexLock();
          return { ...v, owner: 'player' as const };
        }
        return v;
      });

      const totalGain = activeChallenge.points + vertexBonus;
      setPlayerScore((s) => s + totalGain);
      setPlayerEnergy((e) => Math.min(100, e + 20));
      setFaces(updatedFaces);
      setVertices(updatedVertices);

      setMovesLog((prev) => [
        {
          faceId,
          player: 'player',
          scoreGained: totalGain,
          actionType: vertexBonus > 0 ? 'vertex_lock' : 'claim',
          description: `You captured Face ${targetFace.label} (${totalGain} pts${
            vertexBonus > 0 ? ' + Vertex Citadel Bonus!' : ''
          })`,
        },
        ...prev.slice(0, 7),
      ]);

      setActiveChallenge(null);

      // Check win condition
      checkGameEnd(updatedFaces);

      // Pass turn to Opponent AI
      setTurn('opponent');
    } else {
      sounds.playWrong();
      setActiveChallenge(null);
      // Turn passes on mistake
      setTurn('opponent');
    }
  };

  // AI Turn Logic
  useEffect(() => {
    if (turn !== 'opponent' || gameOver) return;

    const aiTimer = setTimeout(() => {
      // AI chooses a target face (prioritizes neutral or player's antipodal)
      const neutralFaces = faces.filter((f) => f.owner !== 'opponent');
      if (neutralFaces.length === 0) {
        setGameOver(true);
        return;
      }

      // AI selects best strategic face
      const chosen =
        neutralFaces.find((f) => faces[f.oppositeFaceId]?.owner === 'opponent') ||
        neutralFaces[Math.floor(Math.random() * neutralFaces.length)];

      sounds.playCapture();

      const updatedFaces = faces.map((f) => {
        if (f.id === chosen.id) {
          return { ...f, owner: 'opponent' as const };
        }
        return f;
      });

      let aiVertexBonus = 0;
      const updatedVertices = vertices.map((v) => {
        const oppHeld = v.connectedFaceIds.filter(
          (id) => updatedFaces[id]?.owner === 'opponent'
        ).length;
        if (oppHeld >= 3 && v.owner !== 'opponent') {
          aiVertexBonus += 20;
          return { ...v, owner: 'opponent' as const };
        }
        return v;
      });

      const gain = 15 + aiVertexBonus;
      setOpponentScore((s) => s + gain);
      setOpponentEnergy((e) => Math.min(100, e + 15));
      setFaces(updatedFaces);
      setVertices(updatedVertices);

      setMovesLog((prev) => [
        {
          faceId: chosen.id,
          player: 'opponent',
          scoreGained: gain,
          actionType: aiVertexBonus > 0 ? 'vertex_lock' : 'claim',
          description: `${rival.name} captured Face ${chosen.label} (${gain} pts)`,
        },
        ...prev.slice(0, 7),
      ]);

      checkGameEnd(updatedFaces);
      setTurn('player');
    }, 1800);

    return () => clearTimeout(aiTimer);
  }, [turn, faces, gameOver, rival]);

  // Check if all faces conquered or threshold met
  const checkGameEnd = (currentFaces: IcosahedronFace[]) => {
    const neutralCount = currentFaces.filter((f) => f.owner === 'neutral').length;
    if (neutralCount === 0 || playerScore >= 150 || opponentScore >= 150) {
      setGameOver(true);
      if (playerScore > opponentScore) {
        sounds.playVictory();
        confetti({ particleCount: 100, spread: 70 });
      }
    }
  };

  // Special Skill: Dihya's Antipodal Strike
  const triggerDihyaAntipodalSkill = () => {
    if (playerEnergy < 40 || turn !== 'player') return;
    sounds.playVertexLock();

    // Find any player face whose opposite is still neutral/opponent
    const playerFaces = faces.filter((f) => f.owner === 'player');
    const targetOpposite = playerFaces.find((pf) => faces[pf.oppositeFaceId]?.owner !== 'player');

    if (targetOpposite) {
      const oppFaceId = targetOpposite.oppositeFaceId;
      const updatedFaces = faces.map((f) =>
        f.id === oppFaceId ? { ...f, owner: 'player' as const } : f
      );
      setFaces(updatedFaces);
      setPlayerScore((s) => s + 35);
      setPlayerEnergy((e) => e - 40);

      setMovesLog((prev) => [
        {
          faceId: oppFaceId,
          player: 'player',
          scoreGained: 35,
          actionType: 'antipodal_strike',
          description: `⚡ Activated Dihya's Antipodal Strike! Captured Face ${faces[oppFaceId]?.label} across the core (+35 pts)`,
        },
        ...prev.slice(0, 7),
      ]);
    }
  };

  // Count territories
  const playerCount = faces.filter((f) => f.owner === 'player').length;
  const opponentCount = faces.filter((f) => f.owner === 'opponent').length;
  const neutralCount = faces.filter((f) => f.owner === 'neutral').length;

  return (
    <div id="war-conquest-container" className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Territory War Header */}
      <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-cyan-500/20">
            <Swords className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              Icosahedron War: Territory Conquest
            </h2>
            <p className="text-xs text-slate-400">
              Turn-based 3D polyhedral conquest • 20 Faces • 12 Vertex Citadels
            </p>
          </div>
        </div>

        {/* Rival Selector */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Rival:</span>
          <select
            id="select-rival-champ"
            value={rival.id}
            onChange={(e) => {
              const selected = COC_CHAMPIONS.find((c) => c.id === e.target.value);
              if (selected) {
                setRival(selected);
                initializeWar(selected);
              }
            }}
            className="bg-transparent text-xs font-bold text-cyan-400 focus:outline-none cursor-pointer"
          >
            {COC_CHAMPIONS.map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                {c.name} ({c.difficulty})
              </option>
            ))}
          </select>
        </div>

        <button
          id="btn-restart-war"
          onClick={() => initializeWar()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset War
        </button>
      </div>

      {/* Territory Influence Bar */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-2">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-cyan-400 flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-cyan-400" /> YOU ({playerCount} Faces / {playerScore} pts)
          </span>
          <span className="text-slate-400">
            Neutral: {neutralCount} | Turn: <span className={turn === 'player' ? 'text-cyan-400 font-extrabold animate-pulse' : 'text-rose-400'}>{turn === 'player' ? 'YOUR TURN' : `${rival.name.toUpperCase()}'S TURN`}</span>
          </span>
          <span className="text-rose-400 flex items-center gap-1.5">
            {rival.name} ({opponentCount} Faces / {opponentScore} pts) <span className="w-3 h-3 rounded-full bg-rose-500" />
          </span>
        </div>

        <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
          <div
            className="bg-cyan-500 h-full transition-all duration-500"
            style={{ width: `${(playerCount / 20) * 100}%` }}
          />
          <div
            className="bg-slate-800 h-full transition-all duration-500"
            style={{ width: `${(neutralCount / 20) * 100}%` }}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-500"
            style={{ width: `${(opponentCount / 20) * 100}%` }}
          />
        </div>
      </div>

      {/* Main War Arena Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D Polyhedron Battlefield */}
        <div className="lg:col-span-8 space-y-4">
          <ThreeIcosahedron
            faces={faces}
            selectedFaceId={selectedFaceId}
            onFaceClick={handleFaceClick}
            autoRotate={false}
            showLabels={true}
            showOpposites={true}
            height={440}
          />

          <UnfoldedNetView
            faces={faces}
            selectedFaceId={selectedFaceId}
            onFaceClick={handleFaceClick}
            showDihyaPoles={true}
          />
        </div>

        {/* Tactical Control Panel & Combat Log */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          {/* Active Face Challenge Dialog */}
          {activeChallenge && turn === 'player' && !gameOver ? (
            <div className="bg-slate-900 rounded-2xl p-5 border-2 border-cyan-500 shadow-2xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-cyan-400 tracking-wider">
                  Target: Face {faces[activeChallenge.faceId]?.label}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full">
                  +{activeChallenge.points} pts
                </span>
              </div>

              <p className="text-sm font-bold text-white leading-snug">
                {activeChallenge.prompt}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                {activeChallenge.options.map((opt, i) => (
                  <button
                    key={`opt-challenge-${i}`}
                    id={`btn-challenge-opt-${i}`}
                    onClick={() => handleAnswerChallenge(opt)}
                    className="p-3 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 font-bold text-white rounded-xl border border-slate-700 hover:border-cyan-400 transition-all text-sm"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tactical Actions & Skills
              </h3>

              {/* Dihya Antipodal Skill Button */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Special Energy:</span>
                  <span className="font-bold text-cyan-400">{playerEnergy}/100</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all"
                    style={{ width: `${playerEnergy}%` }}
                  />
                </div>

                <button
                  id="btn-dihya-skill"
                  onClick={triggerDihyaAntipodalSkill}
                  disabled={playerEnergy < 40 || turn !== 'player' || gameOver}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${
                    playerEnergy >= 40 && turn === 'player' && !gameOver
                      ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-950/40 text-slate-600 border-slate-800 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-cyan-400" /> Dihya's Antipodal Strike
                  </span>
                  <span className="px-2 py-0.5 bg-cyan-500/20 rounded text-[10px]">
                    40 Energy
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                💡 <span className="font-semibold text-slate-300">How to Play:</span> Click any 3D face on the polyhedron or 2D net to claim it by solving arithmetic relations. Connect faces around vertices to trigger Vertex Citadel Locks!
              </div>
            </div>
          )}

          {/* Combat Log */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-2.5 flex-1 min-h-[220px]">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> War Combat Log
              </span>
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-[200px] pr-1">
              {movesLog.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No moves yet. Click a face to initiate battle!</p>
              ) : (
                movesLog.map((m, idx) => (
                  <div
                    key={`log-${idx}`}
                    className={`text-xs p-2 rounded-lg border ${
                      m.player === 'player'
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                    }`}
                  >
                    {m.description}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Game Over Victory Modal */}
      {gameOver && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl animate-scaleIn">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center text-cyan-400 text-4xl shadow-xl">
              <Trophy className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">
                {playerScore > opponentScore
                  ? 'WAR VICTORY! POLYHEDRON CONQUERED'
                  : 'RIVAL DEFEAT!'}
              </h3>
              <p className="text-xs text-slate-300">
                Final Score: You <span className="font-bold text-cyan-400">{playerScore}</span> vs{' '}
                <span className="font-bold text-rose-400">{opponentScore}</span> {rival.name}
              </p>
            </div>

            <button
              id="btn-play-again-war"
              onClick={() => initializeWar()}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl shadow-lg transition-all"
            >
              Start New Icosahedron War
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

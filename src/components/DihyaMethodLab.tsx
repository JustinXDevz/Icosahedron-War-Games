import React, { useState } from 'react';
import { IcosahedronFace, IcosahedronVertex, GameQuestion } from '../types/game';
import { generateIcosahedronFaces, generateIcosahedronVertices } from '../utils/icosahedronGeometry';
import { generateQuestion } from '../utils/questionGenerator';
import { ThreeIcosahedron } from './ThreeIcosahedron';
import { UnfoldedNetView } from './UnfoldedNetView';
import { sounds } from '../utils/soundEffects';
import {
  Compass,
  Sliders,
  Sparkles,
  Layers,
  HelpCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Calculator,
} from 'lucide-react';

export const DihyaMethodLab: React.FC = () => {
  const [faces, setFaces] = useState<IcosahedronFace[]>(() => generateIcosahedronFaces());
  const [vertices, setVertices] = useState<IcosahedronVertex[]>(() => generateIcosahedronVertices(faces));
  const [selectedFaceId, setSelectedFaceId] = useState<number | null>(0);
  const [selectedPairIndex, setSelectedPairIndex] = useState<number>(0);
  const [explodedFactor, setExplodedFactor] = useState<number>(0);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [hideNumbersInLab, setHideNumbersInLab] = useState<boolean>(false);

  // Practice question state for 3-5 alphabet sums
  const [practiceQuestion, setPracticeQuestion] = useState<GameQuestion | null>(() =>
    generateQuestion(faces, vertices, 'hard')
  );
  const [practiceAnswer, setPracticeAnswer] = useState<string | number | null>(null);
  const [isPracticeAnswered, setIsPracticeAnswered] = useState<boolean>(false);

  // 10 Antipodal Pairs (each pair has 2 faces)
  const antipodalPairs: [number, number][] = [];
  const visited = new Set<number>();
  for (let i = 0; i < 20; i++) {
    if (!visited.has(i)) {
      const opp = faces[i].oppositeFaceId;
      antipodalPairs.push([i, opp]);
      visited.add(i);
      visited.add(opp);
    }
  }

  // Tutorial Steps for Dihya's Strategy
  const DIHYA_STEPS = [
    {
      title: '1. Establish Two Opposite Reference Poles',
      desc: 'Top Champions like Dihya don’t try to memorize 20 random faces in 3D space. First, identify two directly opposite (antipodal) faces as your Anchor Poles (e.g. Face A and Face T).',
      highlightFaceIds: [0, faces[0]?.oppositeFaceId || 19],
    },
    {
      title: '2. The Two 5-Triangle Pentagonal Caps',
      desc: 'Surrounding each Pole is a cap of 5 equilateral triangles. Once you anchor Pole 1 (Faces A-E) and Pole 2 (Faces P-T), half the shape is already mapped!',
      highlightFaceIds: [0, 1, 2, 3, 4, 15, 16, 17, 18, 19],
    },
    {
      title: '3. The Middle 10-Triangle Equator Belt',
      desc: 'The remaining 10 triangles (Faces F-O) form an alternating ribbon wrapping around the center. Each triangle points alternately Up and Down.',
      highlightFaceIds: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    },
    {
      title: '4. Sum of 3–5 Alphabet Values',
      desc: 'In Clash of Champions Hardcore battles, questions test your mental recall by asking for the sum of 3, 4, or 5 letters. By knowing the spatial anchors, you instantly pull values from memory.',
      highlightFaceIds: practiceQuestion?.targetFaceIds || [0, 1, 2],
    },
  ];

  const handlePairSelect = (pairIdx: number) => {
    sounds.playClick();
    setSelectedPairIndex(pairIdx);
    const [f1, f2] = antipodalPairs[pairIdx];
    setSelectedFaceId(f1);
  };

  const randomizeValues = () => {
    sounds.playClick();
    const newVals = Array.from({ length: 20 }, () => Math.floor(Math.random() * 80) + 12);
    const newFaces = generateIcosahedronFaces(newVals);
    setFaces(newFaces);
    const newVertices = generateIcosahedronVertices(newFaces);
    setVertices(newVertices);
    setPracticeQuestion(generateQuestion(newFaces, newVertices, 'extreme_coc'));
    setIsPracticeAnswered(false);
    setPracticeAnswer(null);
  };

  const nextPracticeQuestion = () => {
    sounds.playClick();
    setPracticeQuestion(generateQuestion(faces, vertices, 'extreme_coc'));
    setIsPracticeAnswered(false);
    setPracticeAnswer(null);
  };

  const handlePracticeAnswer = (opt: string | number) => {
    sounds.playClick();
    setPracticeAnswer(opt);
    setIsPracticeAnswered(true);
    if (String(opt) === String(practiceQuestion?.correctAnswer)) {
      sounds.playCorrect();
    } else {
      sounds.playWrong();
    }
  };

  const currentStep = DIHYA_STEPS[activeStep];
  const highlightedFaces =
    activeStep === 3
      ? practiceQuestion?.targetFaceIds || [0, 1, 2]
      : currentStep.highlightFaceIds;

  return (
    <div id="dihya-lab-container" className="w-full max-w-6xl mx-auto space-y-6">
      {/* Academy Header */}
      <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-cyan-500/20">
            <Compass className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">
                Dihya’s 3D Spatial Academy & Alphabet Sum Lab
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/40">
                Season 3 Master Strategy
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive 3D geometry breakdown, 20 Alphabet values mapping, and 3–5 letter sum trainer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-lab-memory"
            onClick={() => setHideNumbersInLab(!hideNumbersInLab)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            {hideNumbersInLab ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-rose-400" />}
            {hideNumbersInLab ? 'Show Numbers' : 'Hide Numbers (Memory Mode)'}
          </button>
          <button
            id="btn-randomize-lab-values"
            onClick={randomizeValues}
            className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> New Numbers
          </button>
        </div>
      </div>

      {/* Step-by-Step Dihya Strategy Navigator */}
      <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Dihya's 4-Step Spatial Method
          </h3>
          <span className="text-xs text-cyan-400 font-bold">Step {activeStep + 1} of 4</span>
        </div>

        {/* Step Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DIHYA_STEPS.map((step, idx) => (
            <button
              key={`step-${idx}`}
              id={`btn-dihya-step-${idx}`}
              onClick={() => {
                sounds.playClick();
                setActiveStep(idx);
              }}
              className={`p-3.5 rounded-2xl text-left text-xs font-bold border transition-all ${
                activeStep === idx
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <div className="text-[10px] uppercase font-semibold opacity-70">Step {idx + 1}</div>
              <div className="truncate">{step.title.split('. ')[1]}</div>
            </button>
          ))}
        </div>

        {/* Active Step Explanation Banner */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-cyan-500/30 text-xs text-slate-300 space-y-1">
          <h4 className="font-bold text-white text-sm">{currentStep.title}</h4>
          <p className="leading-relaxed text-slate-300">{currentStep.desc}</p>
        </div>
      </div>

      {/* 3D Visualizer & Inspection Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 3D Viewport & Net */}
        <div className="lg:col-span-8 space-y-4">
          <ThreeIcosahedron
            faces={faces}
            selectedFaceId={selectedFaceId}
            highlightedFaceIds={highlightedFaces}
            onFaceClick={(id) => {
              setSelectedFaceId(id);
              const pIdx = antipodalPairs.findIndex((p) => p[0] === id || p[1] === id);
              if (pIdx !== -1) setSelectedPairIndex(pIdx);
            }}
            autoRotate={false}
            showLabels={true}
            hideNumbers={hideNumbersInLab}
            showOpposites={true}
            explodedFactor={explodedFactor}
            height={400}
          />

          {/* Exploded 3D Slider */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>3D Polyhedral Core Explode Slider:</span>
            </div>
            <input
              id="slider-explode-factor"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={explodedFactor}
              onChange={(e) => setExplodedFactor(parseFloat(e.target.value))}
              className="w-48 accent-cyan-400 cursor-pointer"
            />
            <span className="text-xs font-mono text-cyan-400 font-bold w-12 text-right">
              {Math.round(explodedFactor * 100)}%
            </span>
          </div>

          <UnfoldedNetView
            faces={faces}
            selectedFaceId={selectedFaceId}
            highlightedFaceIds={highlightedFaces}
            onFaceClick={(id) => {
              setSelectedFaceId(id);
              const pIdx = antipodalPairs.findIndex((p) => p[0] === id || p[1] === id);
              if (pIdx !== -1) setSelectedPairIndex(pIdx);
            }}
            showDihyaPoles={true}
            hideNumbers={hideNumbersInLab}
          />
        </div>

        {/* Right Column: 3-5 Alphabet Sum Practice & 10 Pairs Matrix */}
        <div className="lg:col-span-4 space-y-4">
          {/* Alphabet Sum Practice Trainer */}
          {practiceQuestion && (
            <div className="bg-slate-900/90 rounded-3xl p-5 border border-cyan-500/40 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4" /> 3–5 Alphabet Sum Trainer
                </h4>
                <button
                  id="btn-next-practice"
                  onClick={nextPracticeQuestion}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold underline"
                >
                  New Question
                </button>
              </div>

              {/* Equation Chips */}
              {practiceQuestion.terms && (
                <div className="flex flex-wrap items-center gap-1.5 py-1">
                  {practiceQuestion.terms.map((t, idx) => (
                    <React.Fragment key={`prac-t-${idx}`}>
                      <div className="w-8 h-8 rounded-lg bg-slate-950 border border-cyan-500/50 flex items-center justify-center text-cyan-300 font-black text-xs">
                        {t.label}
                      </div>
                      {idx < practiceQuestion.terms!.length - 1 && (
                        <span className="text-slate-400 font-bold text-xs">+</span>
                      )}
                    </React.Fragment>
                  ))}
                  <span className="text-slate-400 font-bold text-xs">=</span>
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-dashed border-cyan-400 flex items-center justify-center text-cyan-400 font-black text-xs">
                    ?
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-300 font-semibold">{practiceQuestion.prompt}</p>

              {/* Options */}
              <div className="grid grid-cols-2 gap-2">
                {practiceQuestion.options.map((opt, idx) => {
                  const isSelected = practiceAnswer === opt;
                  const isCorrect = String(opt) === String(practiceQuestion.correctAnswer);

                  let style = 'bg-slate-950 hover:bg-slate-800 text-white border-slate-800';
                  if (isPracticeAnswered) {
                    if (isCorrect) style = 'bg-emerald-600 text-white border-emerald-400 font-bold';
                    else if (isSelected) style = 'bg-rose-600 text-white border-rose-400';
                    else style = 'opacity-50 bg-slate-950 text-slate-500 border-slate-900';
                  }

                  return (
                    <button
                      key={`prac-opt-${idx}`}
                      id={`btn-prac-opt-${idx}`}
                      onClick={() => handlePracticeAnswer(opt)}
                      disabled={isPracticeAnswered}
                      className={`p-2.5 rounded-xl border text-sm font-bold transition-all ${style}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {isPracticeAnswered && (
                <div className="text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 animate-fadeIn">
                  💡 <strong className="text-cyan-300 font-mono">{practiceQuestion.explanation}</strong>
                </div>
              )}
            </div>
          )}

          {/* 10 Antipodal Pairs Matrix */}
          <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                10 Antipodal Pairs Matrix
              </h4>
              <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                Opposite Pairs
              </span>
            </div>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {antipodalPairs.map(([f1Id, f2Id], idx) => {
                const f1 = faces[f1Id];
                const f2 = faces[f2Id];
                const isSelected = selectedPairIndex === idx;

                return (
                  <button
                    key={`pair-${idx}`}
                    id={`btn-pair-${idx}`}
                    onClick={() => handlePairSelect(idx)}
                    className={`w-full p-2 rounded-xl border text-xs flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-500 text-white font-bold'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded bg-slate-800 text-[9px] flex items-center justify-center font-bold text-cyan-400">
                        {idx + 1}
                      </span>
                      <span>
                        {f1.label} ({f1.value}) ↔ {f2.label} ({f2.value})
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-cyan-400">
                      Sum: {f1.value + f2.value}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

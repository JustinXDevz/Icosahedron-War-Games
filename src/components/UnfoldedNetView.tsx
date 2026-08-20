import React from 'react';
import { IcosahedronFace } from '../types/game';
import { getUnfoldedNetLayout } from '../utils/icosahedronGeometry';
import { sounds } from '../utils/soundEffects';

interface UnfoldedNetViewProps {
  faces: IcosahedronFace[];
  selectedFaceId?: number | null;
  highlightedFaceIds?: number[];
  onFaceClick?: (faceId: number) => void;
  showDihyaPoles?: boolean;
  hideNumbers?: boolean;
}

export const UnfoldedNetView: React.FC<UnfoldedNetViewProps> = ({
  faces,
  selectedFaceId = null,
  highlightedFaceIds = [],
  onFaceClick,
  showDihyaPoles = false,
  hideNumbers = false,
}) => {
  const netLayout = getUnfoldedNetLayout(52);

  return (
    <div
      id="unfolded-net-container"
      className="w-full bg-slate-900/90 rounded-2xl p-4 border border-slate-800/80 shadow-xl overflow-x-auto"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            2D Unfolded Net View (Classic 5-10-5 Belt)
          </h4>
        </div>
        {showDihyaPoles && (
          <span className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
            🧭 Dihya's 2-Pole Reference Active
          </span>
        )}
      </div>

      <div className="relative flex justify-center py-2 min-w-[540px]">
        <svg
          viewBox="0 0 600 240"
          className="w-full max-w-[620px] h-auto drop-shadow-md select-none"
        >
          {/* Triangular Faces in 2D Net */}
          {netLayout.map((netFace) => {
            const face = faces[netFace.id] || {
              id: netFace.id,
              label: `${netFace.id + 1}`,
              value: 0,
              color: '#3b82f6',
              oppositeFaceId: 0,
            };

            const isSelected = selectedFaceId === netFace.id;
            const isHighlighted = highlightedFaceIds.includes(netFace.id);
            const isOppositeOfSelected =
              selectedFaceId !== null && faces[selectedFaceId]?.oppositeFaceId === netFace.id;

            // Dihya Pole Indicators: Pole 1 = Face A (id 0), Pole 2 = Antipodal to A
            const isPole = showDihyaPoles && (netFace.id === 0 || netFace.id === faces[0]?.oppositeFaceId);

            let fillColor = face.color;
            if (face.owner === 'player') fillColor = '#06b6d4';
            if (face.owner === 'opponent') fillColor = '#f43f5e';

            return (
              <g
                key={`net-face-${netFace.id}`}
                id={`net-face-${netFace.id}`}
                className="cursor-pointer transition-all duration-200"
                onClick={() => {
                  sounds.playClick();
                  onFaceClick?.(netFace.id);
                }}
              >
                <polygon
                  points={netFace.points}
                  fill={fillColor}
                  fillOpacity={isSelected ? 0.95 : isHighlighted || isOppositeOfSelected ? 0.85 : 0.65}
                  stroke={
                    isSelected
                      ? '#38bdf8'
                      : isOppositeOfSelected
                      ? '#facc15'
                      : isHighlighted
                      ? '#fbbf24'
                      : isPole
                      ? '#a855f7'
                      : 'rgba(255,255,255,0.35)'
                  }
                  strokeWidth={isSelected ? 4 : isOppositeOfSelected || isPole ? 3 : 1.5}
                  strokeLinejoin="round"
                  className="hover:fill-opacity-95 hover:stroke-cyan-300 transition-all"
                />

                {/* Face Label & Value */}
                <text
                  x={netFace.center[0]}
                  y={hideNumbers ? netFace.center[1] + 2 : netFace.center[1] - 4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#ffffff"
                  fontSize={hideNumbers ? "18" : "14"}
                  fontWeight="bold"
                  className="pointer-events-none drop-shadow"
                >
                  {face.label}
                </text>
                {!hideNumbers && (
                  <text
                    x={netFace.center[0]}
                    y={netFace.center[1] + 12}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isSelected ? '#ffffff' : '#e2e8f0'}
                    fontSize="11"
                    fontWeight="600"
                    className="pointer-events-none"
                  >
                    {face.value}
                  </text>
                )}

                {/* Pole Star Badge */}
                {isPole && (
                  <circle
                    cx={netFace.center[0]}
                    cy={netFace.center[1] - 18}
                    r="4"
                    fill="#facc15"
                    className="animate-pulse pointer-events-none"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1 border-t border-slate-800/60 pt-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block" /> Player Territory
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> Rival Territory
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 inline-block" /> Antipodal Pair
          </span>
        </div>
        <span>Click any triangle to inspect 3D mapping</span>
      </div>
    </div>
  );
};

export type GameMode = 'target_sum' | 'tournament' | 'war' | 'rapid' | 'lab';

export type GameDifficulty = 'normal' | 'hard' | 'extreme_coc';

export type MemoryClockDuration = 5 | 10 | 15 | 20 | 30 | 60 | 0; // 0 = untimed/daily practice (no clock)

export interface IcosahedronFace {
  id: number; // 0 to 19
  label: string; // "A" to "T"
  value: number; // Numeric value for calculations (10-99)
  color: string;
  oppositeFaceId: number; // Antipodal face index
  adjacentFaceIds: [number, number, number]; // 3 neighboring faces
  vertices: [number, number, number]; // 3 vertex indices
  symbol?: string;
  owner?: 'player' | 'opponent' | 'neutral';
  isShielded?: boolean;
}

export interface IcosahedronVertex {
  id: number; // 0 to 11
  x: number;
  y: number;
  z: number;
  connectedFaceIds: number[]; // 5 faces meeting here
  owner?: 'player' | 'opponent' | 'neutral';
}

export interface Champion {
  id: string;
  name: string;
  title: string;
  university: string;
  major: string;
  avatarColor: string;
  avatarIcon: string;
  specialty: string;
  difficulty: 'Rookie' | 'Master' | 'Grandmaster' | 'Legend';
  speedMs: number; // AI reaction time in ms
  accuracy: number; // 0.0 to 1.0
  quote: string;
  signatureSkill: {
    name: string;
    description: string;
  };
}

export type QuestionType =
  | 'target_connected_sum'
  | 'sum_3_alphabets'
  | 'sum_4_alphabets'
  | 'sum_5_alphabets'
  | 'vertex_5_alphabets'
  | 'antipodal_quad_sum'
  | 'ring_5_alphabets'
  | 'antipodal_sum'
  | 'antipodal_product'
  | 'adjacent_sum'
  | 'vertex_sum'
  | 'face_value'
  | 'opposite_label';

export interface AlphabetValueTerm {
  label: string;
  value: number;
}

export interface TargetSumChallenge {
  id: string;
  targetSum: number; // e.g. 54
  chainLengthMin: number;
  chainLengthMax: number;
  targetChainLength?: number;
  solutionPaths: number[][]; // Array of face ID arrays that form valid connected paths summing to targetSum
  solutionLetterStrings: string[]; // e.g. ["A + B + F = 54", "D + I + N = 54"]
  hintStartingLetter: string;
  prompt: string;
  promptIndonesian: string;
}

export interface GameQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  promptIndonesian: string;
  targetFaceIds: number[];
  targetSum?: number;
  terms?: AlphabetValueTerm[]; // breakdown of letters and values
  options: (string | number)[];
  correctAnswer: string | number;
  explanation: string;
  timeLimit: number; // seconds
}

export interface ConquestMove {
  faceId: number;
  player: 'player' | 'opponent';
  scoreGained: number;
  actionType: 'claim' | 'antipodal_strike' | 'vertex_lock' | 'shield';
  description: string;
}

export interface PlayerStats {
  score: number;
  streak: number;
  maxStreak: number;
  correctAnswers: number;
  totalAnswered: number;
  specialEnergy: number; // 0 to 100
}

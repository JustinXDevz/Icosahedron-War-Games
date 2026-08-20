import { IcosahedronFace, TargetSumChallenge, GameQuestion, GameDifficulty } from '../types/game';

// Check if a list of face IDs is non-empty and forms a continuous connected subgraph
export function isFacesConnected(faceIds: number[], faces: IcosahedronFace[]): boolean {
  if (faceIds.length === 0) return false;
  if (faceIds.length === 1) return true;

  const idSet = new Set(faceIds);
  const visited = new Set<number>();
  const queue: number[] = [faceIds[0]];
  visited.add(faceIds[0]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const face = faces[current];
    if (!face) continue;

    for (const adjId of face.adjacentFaceIds) {
      if (idSet.has(adjId) && !visited.has(adjId)) {
        visited.add(adjId);
        queue.push(adjId);
      }
    }
  }

  return visited.size === faceIds.length;
}

// Get all adjacent face IDs that connect to the current selected chain/component
export function getLegalNextNeighbors(currentChain: number[], faces: IcosahedronFace[]): number[] {
  if (currentChain.length === 0) {
    // Any face can be the start
    return faces.map((f) => f.id);
  }

  const selectedSet = new Set(currentChain);
  const validNeighbors = new Set<number>();

  // If linear path: can extend from last face (or any selected face in the connected cluster)
  const lastFaceId = currentChain[currentChain.length - 1];
  const lastFace = faces[lastFaceId];

  if (lastFace) {
    for (const adj of lastFace.adjacentFaceIds) {
      if (!selectedSet.has(adj)) {
        validNeighbors.add(adj);
      }
    }
  }

  // Also allow connecting to any adjacent boundary of the cluster
  for (const fId of currentChain) {
    const f = faces[fId];
    if (f) {
      for (const adj of f.adjacentFaceIds) {
        if (!selectedSet.has(adj)) {
          validNeighbors.add(adj);
        }
      }
    }
  }

  return Array.from(validNeighbors);
}

// Find all simple connected paths of length between minLen and maxLen
export function findAllConnectedPaths(
  faces: IcosahedronFace[],
  minLen: number = 2,
  maxLen: number = 5
): { path: number[]; sum: number; letters: string }[] {
  const results: { path: number[]; sum: number; letters: string }[] = [];
  const seenPathKeys = new Set<string>();

  function dfs(currentPath: number[], currentSum: number) {
    const len = currentPath.length;

    if (len >= minLen && len <= maxLen) {
      const sortedKey = [...currentPath].sort((a, b) => a - b).join('-');
      if (!seenPathKeys.has(sortedKey)) {
        seenPathKeys.add(sortedKey);
        const letters = currentPath.map((id) => faces[id]?.label || '').join(' + ');
        results.push({
          path: [...currentPath],
          sum: currentSum,
          letters,
        });
      }
    }

    if (len >= maxLen) return;

    const lastId = currentPath[len - 1];
    const lastFace = faces[lastId];
    if (!lastFace) return;

    for (const adjId of lastFace.adjacentFaceIds) {
      if (!currentPath.includes(adjId)) {
        const nextVal = faces[adjId]?.value || 0;
        dfs([...currentPath, adjId], currentSum + nextVal);
      }
    }
  }

  for (let i = 0; i < faces.length; i++) {
    dfs([i], faces[i]?.value || 0);
  }

  return results;
}

// Generate a Target Sum Challenge with at least 1 valid connected chain
export function generateTargetSumChallenge(
  faces: IcosahedronFace[],
  difficulty: GameDifficulty = 'hard'
): TargetSumChallenge {
  const minLen = difficulty === 'normal' ? 2 : difficulty === 'hard' ? 3 : 3;
  const maxLen = difficulty === 'normal' ? 4 : difficulty === 'hard' ? 4 : 5;

  const allPaths = findAllConnectedPaths(faces, minLen, maxLen);

  if (allPaths.length === 0) {
    // Fallback simple 3-face chain
    const p0 = 0;
    const p1 = faces[0].adjacentFaceIds[0];
    const p2 = faces[p1].adjacentFaceIds[1];
    const sum = faces[p0].value + faces[p1].value + faces[p2].value;
    return {
      id: `target_ch_${Date.now()}`,
      targetSum: sum,
      chainLengthMin: 3,
      chainLengthMax: 3,
      targetChainLength: 3,
      solutionPaths: [[p0, p1, p2]],
      solutionLetterStrings: [`${faces[p0].label} + ${faces[p1].label} + ${faces[p2].label} = ${sum}`],
      hintStartingLetter: faces[p0].label,
      prompt: `Find a connected chain of alphabet letters that sums to exactly ${sum}!`,
      promptIndonesian: `Cari rantai huruf alfabet yang saling terhubung dengan jumlah tepat ${sum}!`,
    };
  }

  // Filter paths to those matching target lengths
  const candidates = allPaths.filter((p) => p.path.length >= minLen && p.path.length <= maxLen);
  const picked = candidates[Math.floor(Math.random() * candidates.length)] || allPaths[0];

  const targetSum = picked.sum;

  // Find all solution paths that equal this exact targetSum
  const solutions = allPaths.filter((p) => p.sum === targetSum);
  const solutionPaths = solutions.map((s) => s.path);
  const solutionLetterStrings = solutions.map(
    (s) =>
      s.path.map((id) => `${faces[id].label}(${faces[id].value})`).join(' + ') + ` = ${targetSum}`
  );

  const startFaceId = picked.path[0];
  const hintStartingLetter = faces[startFaceId]?.label || 'A';

  return {
    id: `target_ch_${Date.now()}_${Math.random()}`,
    targetSum,
    chainLengthMin: minLen,
    chainLengthMax: maxLen,
    targetChainLength: picked.path.length,
    solutionPaths,
    solutionLetterStrings,
    hintStartingLetter,
    prompt: `🎯 Target Sum = ${targetSum}: Find connected alphabet letters whose sum equals ${targetSum}!`,
    promptIndonesian: `🎯 Target Jumlah = ${targetSum}: Temukan huruf alfabet yang saling terhubung dengan jumlah total ${targetSum}!`,
  };
}

// Generate a multiple choice question where the prompt gives a Target Sum (e.g. Target = 54)
// and the player selects the connected alphabet combination that sums to 54
export function generateTargetConnectedSumQuestion(
  faces: IcosahedronFace[],
  difficulty: GameDifficulty = 'hard'
): GameQuestion {
  const challenge = generateTargetSumChallenge(faces, difficulty);
  const correctPath = challenge.solutionPaths[0];
  const correctOptionStr = correctPath.map((id) => faces[id]?.label).join(' + ');

  // Generate 3 deceptive distractor options:
  // 1. A disconnected set of letters that sums to the target (or close to it)
  // 2. A connected chain with sum off by 5 or 10
  // 3. A connected chain with sum off by 2 or 3
  const optionsSet = new Set<string>([correctOptionStr]);
  const allPaths = findAllConnectedPaths(faces, 2, 5);

  // Distractor 1: Connected path with different sum
  for (const p of allPaths) {
    if (optionsSet.size >= 4) break;
    if (p.sum !== challenge.targetSum && p.path.length === correctPath.length) {
      const opt = p.path.map((id) => faces[id]?.label).join(' + ');
      optionsSet.add(opt);
    }
  }

  // Distractor 2: Disconnected random letters
  while (optionsSet.size < 4) {
    const randomFaces = [...faces].sort(() => Math.random() - 0.5).slice(0, correctPath.length);
    const opt = randomFaces.map((f) => f.label).join(' + ');
    optionsSet.add(opt);
  }

  const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

  const breakdown = correctPath
    .map((id) => `${faces[id].label}(${faces[id].value})`)
    .join(' + ');

  return {
    id: `q_target_${Date.now()}_${Math.random()}`,
    type: 'target_connected_sum',
    targetSum: challenge.targetSum,
    prompt: `🎯 Question Target = ${challenge.targetSum}: Which CONNECTED chain of alphabet letters sums to exactly ${challenge.targetSum}?`,
    promptIndonesian: `🎯 Pertanyaan Target = ${challenge.targetSum}: Manakah rantai huruf alfabet yang SALING TERHUBUNG dengan jumlah tepat ${challenge.targetSum}?`,
    targetFaceIds: correctPath,
    options,
    correctAnswer: correctOptionStr,
    explanation: `Connected chain ${correctOptionStr} gives ${breakdown} = ${challenge.targetSum}. All faces share edges continuously!`,
    timeLimit: 18,
  };
}

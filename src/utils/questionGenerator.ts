import { IcosahedronFace, IcosahedronVertex, GameQuestion, QuestionType, GameDifficulty, AlphabetValueTerm } from '../types/game';
import { generateTargetConnectedSumQuestion } from './pathSumGenerator';

// Helper to generate distinct plausible distractor numbers for multi-term sums
function generateNumericOptions(correct: number, count: number = 4): number[] {
  const options = new Set<number>([correct]);
  const offsets = [-10, 10, -5, 5, -2, 2, -1, 1, -15, 15, -20, 20, 3, -3, -8, 8, -12, 12];

  for (const off of offsets) {
    if (options.size >= count) break;
    const cand = correct + off;
    if (cand > 0 && cand !== correct) {
      options.add(cand);
    }
  }

  while (options.size < count) {
    const rand = Math.max(1, correct + Math.floor(Math.random() * 30) - 15);
    options.add(rand);
  }

  return Array.from(options).sort(() => Math.random() - 0.5);
}

// Pick N unique random elements from array
function pickRandomN<T>(array: T[], n: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export function generateQuestion(
  faces: IcosahedronFace[],
  vertices: IcosahedronVertex[],
  difficulty: GameDifficulty = 'hard'
): GameQuestion {
  // Determine question pool based on difficulty
  let questionTypes: QuestionType[] = [];

  if (difficulty === 'normal') {
    questionTypes = [
      'target_connected_sum',
      'sum_3_alphabets',
      'antipodal_sum',
      'adjacent_sum',
      'sum_4_alphabets',
    ];
  } else if (difficulty === 'hard') {
    questionTypes = [
      'target_connected_sum',
      'sum_3_alphabets',
      'sum_4_alphabets',
      'sum_5_alphabets',
      'vertex_5_alphabets',
      'antipodal_quad_sum',
    ];
  } else {
    // 'extreme_coc' - specifically focused on intense target connected sums and 3-5 alphabet sums!
    questionTypes = [
      'target_connected_sum',
      'target_connected_sum',
      'sum_3_alphabets',
      'sum_4_alphabets',
      'sum_5_alphabets',
      'vertex_5_alphabets',
      'antipodal_quad_sum',
      'ring_5_alphabets',
    ];
  }

  const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];

  if (type === 'target_connected_sum') {
    return generateTargetConnectedSumQuestion(faces, difficulty);
  }

  switch (type) {
    case 'sum_3_alphabets': {
      const selectedFaces = pickRandomN(faces, 3);
      const terms: AlphabetValueTerm[] = selectedFaces.map((f) => ({
        label: f.label,
        value: f.value,
      }));
      const lettersStr = terms.map((t) => t.label).join(' + ');
      const correct = terms.reduce((acc, t) => acc + t.value, 0);
      const options = generateNumericOptions(correct);
      const formulaBreakdown = terms.map((t) => `${t.label}(${t.value})`).join(' + ');

      return {
        id: `q_sum3_${Date.now()}_${Math.random()}`,
        type,
        prompt: `Recall 3 Alphabet Values and calculate: ${lettersStr} = ?`,
        promptIndonesian: `Ingat nilai alfabet dan hitung jumlah 3 huruf: ${lettersStr} = ?`,
        targetFaceIds: selectedFaces.map((f) => f.id),
        terms,
        options,
        correctAnswer: correct,
        explanation: `Values: ${formulaBreakdown} = ${correct}.`,
        timeLimit: 14,
      };
    }

    case 'sum_4_alphabets': {
      const selectedFaces = pickRandomN(faces, 4);
      const terms: AlphabetValueTerm[] = selectedFaces.map((f) => ({
        label: f.label,
        value: f.value,
      }));
      const lettersStr = terms.map((t) => t.label).join(' + ');
      const correct = terms.reduce((acc, t) => acc + t.value, 0);
      const options = generateNumericOptions(correct);
      const formulaBreakdown = terms.map((t) => `${t.label}(${t.value})`).join(' + ');

      return {
        id: `q_sum4_${Date.now()}_${Math.random()}`,
        type,
        prompt: `Recall 4 Alphabet Values and calculate: ${lettersStr} = ?`,
        promptIndonesian: `Ingat nilai alfabet dan hitung jumlah 4 huruf: ${lettersStr} = ?`,
        targetFaceIds: selectedFaces.map((f) => f.id),
        terms,
        options,
        correctAnswer: correct,
        explanation: `Values: ${formulaBreakdown} = ${correct}.`,
        timeLimit: 16,
      };
    }

    case 'sum_5_alphabets': {
      const selectedFaces = pickRandomN(faces, 5);
      const terms: AlphabetValueTerm[] = selectedFaces.map((f) => ({
        label: f.label,
        value: f.value,
      }));
      const lettersStr = terms.map((t) => t.label).join(' + ');
      const correct = terms.reduce((acc, t) => acc + t.value, 0);
      const options = generateNumericOptions(correct);
      const formulaBreakdown = terms.map((t) => `${t.label}(${t.value})`).join(' + ');

      return {
        id: `q_sum5_${Date.now()}_${Math.random()}`,
        type,
        prompt: `🔥 Clash Extreme: Sum of 5 Alphabet Values: ${lettersStr} = ?`,
        promptIndonesian: `🔥 Tantangan Ekstrem: Hitung jumlah 5 huruf alfabet: ${lettersStr} = ?`,
        targetFaceIds: selectedFaces.map((f) => f.id),
        terms,
        options,
        correctAnswer: correct,
        explanation: `Values: ${formulaBreakdown} = ${correct}.`,
        timeLimit: 20,
      };
    }

    case 'vertex_5_alphabets': {
      const randomVertex = vertices[Math.floor(Math.random() * vertices.length)];
      const connectedFaces = randomVertex.connectedFaceIds.map((id) => faces[id]);
      const terms: AlphabetValueTerm[] = connectedFaces.map((f) => ({
        label: f.label,
        value: f.value,
      }));
      const lettersStr = terms.map((t) => t.label).join(' + ');
      const correct = terms.reduce((acc, t) => acc + t.value, 0);
      const options = generateNumericOptions(correct);
      const formulaBreakdown = terms.map((t) => `${t.label}(${t.value})`).join(' + ');

      return {
        id: `q_v5_${Date.now()}_${Math.random()}`,
        type,
        prompt: `Vertex Node V${randomVertex.id + 1} Cluster: Sum of 5 adjacent letters (${lettersStr}) = ?`,
        promptIndonesian: `Klaster Titik Sudut Node V${randomVertex.id + 1}: Jumlah 5 huruf yang bertemu (${lettersStr}) = ?`,
        targetFaceIds: randomVertex.connectedFaceIds,
        terms,
        options,
        correctAnswer: correct,
        explanation: `Vertex V${randomVertex.id + 1} joins faces ${formulaBreakdown} = ${correct}.`,
        timeLimit: 18,
      };
    }

    case 'antipodal_quad_sum': {
      // Pick 2 distinct pairs
      const f1 = faces[Math.floor(Math.random() * 10)];
      const opp1 = faces[f1.oppositeFaceId];
      const f2Candidates = faces.filter(
        (f) => f.id !== f1.id && f.id !== opp1.id && f.id !== f1.oppositeFaceId
      );
      const f2 = f2Candidates[Math.floor(Math.random() * f2Candidates.length)];
      const opp2 = faces[f2.oppositeFaceId];

      const terms: AlphabetValueTerm[] = [
        { label: f1.label, value: f1.value },
        { label: opp1.label, value: opp1.value },
        { label: f2.label, value: f2.value },
        { label: opp2.label, value: opp2.value },
      ];
      const lettersStr = `(${f1.label} + ${opp1.label}) + (${f2.label} + ${opp2.label})`;
      const correct = terms.reduce((acc, t) => acc + t.value, 0);
      const options = generateNumericOptions(correct);
      const formulaBreakdown = terms.map((t) => `${t.label}(${t.value})`).join(' + ');

      return {
        id: `q_quad_${Date.now()}_${Math.random()}`,
        type,
        prompt: `Antipodal Quad: Sum of 2 Opposite Pairs: ${lettersStr} = ?`,
        promptIndonesian: `Quad Antipodal: Jumlah 2 Pasang Sisi Berseberangan: ${lettersStr} = ?`,
        targetFaceIds: [f1.id, opp1.id, f2.id, opp2.id],
        terms,
        options,
        correctAnswer: correct,
        explanation: `Pairs: ${f1.label}(${f1.value}) + ${opp1.label}(${opp1.value}) + ${f2.label}(${f2.value}) + ${opp2.label}(${opp2.value}) = ${correct}.`,
        timeLimit: 18,
      };
    }

    case 'ring_5_alphabets': {
      // 5 alternating faces from middle equator belt (ids 5 to 14)
      const beltFaces = faces.slice(5, 15);
      const selected = [beltFaces[0], beltFaces[2], beltFaces[4], beltFaces[6], beltFaces[8]];
      const terms: AlphabetValueTerm[] = selected.map((f) => ({
        label: f.label,
        value: f.value,
      }));
      const lettersStr = terms.map((t) => t.label).join(' + ');
      const correct = terms.reduce((acc, t) => acc + t.value, 0);
      const options = generateNumericOptions(correct);
      const formulaBreakdown = terms.map((t) => `${t.label}(${t.value})`).join(' + ');

      return {
        id: `q_ring5_${Date.now()}_${Math.random()}`,
        type,
        prompt: `Equator Belt Ring: Sum of 5 alternating letters: ${lettersStr} = ?`,
        promptIndonesian: `Sabuk Ekuator: Jumlah 5 huruf selang-seling: ${lettersStr} = ?`,
        targetFaceIds: selected.map((f) => f.id),
        terms,
        options,
        correctAnswer: correct,
        explanation: `Equator Ring: ${formulaBreakdown} = ${correct}.`,
        timeLimit: 18,
      };
    }

    case 'adjacent_sum': {
      const targetFace = faces[Math.floor(Math.random() * 20)];
      const adjFaces = targetFace.adjacentFaceIds.map((id) => faces[id]);
      const terms: AlphabetValueTerm[] = adjFaces.map((f) => ({
        label: f.label,
        value: f.value,
      }));
      const lettersStr = terms.map((t) => t.label).join(' + ');
      const correct = terms.reduce((acc, t) => acc + t.value, 0);
      const options = generateNumericOptions(correct);
      const formulaBreakdown = terms.map((t) => `${t.label}(${t.value})`).join(' + ');

      return {
        id: `q_adj3_${Date.now()}_${Math.random()}`,
        type,
        prompt: `Sum of 3 Neighbor Letters surrounding Face ${targetFace.label}: ${lettersStr} = ?`,
        promptIndonesian: `Jumlah 3 huruf tetangga di sekeliling Sisi ${targetFace.label}: ${lettersStr} = ?`,
        targetFaceIds: [targetFace.id, ...targetFace.adjacentFaceIds],
        terms,
        options,
        correctAnswer: correct,
        explanation: `Neighbors of ${targetFace.label}: ${formulaBreakdown} = ${correct}.`,
        timeLimit: 15,
      };
    }

    default: {
      // Fallback 3 alphabet sum
      const selectedFaces = pickRandomN(faces, 3);
      const terms: AlphabetValueTerm[] = selectedFaces.map((f) => ({
        label: f.label,
        value: f.value,
      }));
      const lettersStr = terms.map((t) => t.label).join(' + ');
      const correct = terms.reduce((acc, t) => acc + t.value, 0);
      const options = generateNumericOptions(correct);
      const formulaBreakdown = terms.map((t) => `${t.label}(${t.value})`).join(' + ');

      return {
        id: `q_sum3_def_${Date.now()}`,
        type: 'sum_3_alphabets',
        prompt: `Sum of 3 Alphabet Values: ${lettersStr} = ?`,
        promptIndonesian: `Jumlah nilai 3 huruf alfabet: ${lettersStr} = ?`,
        targetFaceIds: selectedFaces.map((f) => f.id),
        terms,
        options,
        correctAnswer: correct,
        explanation: `${formulaBreakdown} = ${correct}`,
        timeLimit: 14,
      };
    }
  }
}

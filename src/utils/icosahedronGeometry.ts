import { IcosahedronFace, IcosahedronVertex } from '../types/game';

const PHI = (1 + Math.sqrt(5)) / 2;

// 12 vertices of a regular icosahedron
const RAW_VERTICES: [number, number, number][] = [
  [-1, PHI, 0],
  [1, PHI, 0],
  [-1, -PHI, 0],
  [1, -PHI, 0],
  [0, -1, PHI],
  [0, 1, PHI],
  [0, -1, -PHI],
  [0, 1, -PHI],
  [PHI, 0, -1],
  [PHI, 0, 1],
  [-PHI, 0, -1],
  [-PHI, 0, 1],
];

// Normalize vertices to unit sphere
export const VERTICES: [number, number, number][] = RAW_VERTICES.map(([x, y, z]) => {
  const len = Math.sqrt(x * x + y * y + z * z);
  return [x / len, y / len, z / len];
});

// 20 Triangular Faces defined by vertex indices
export const FACE_VERTEX_INDICES: [number, number, number][] = [
  // 5 around vertex 0
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],

  // 5 upper belt
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],

  // 5 lower belt
  [3, 4, 9],
  [3, 2, 4],
  [3, 6, 2],
  [3, 8, 6],
  [3, 9, 8],

  // 5 around bottom vertex 3 (connected to upper belt)
  [4, 5, 9], // will adjust to exact connections below
  [2, 11, 4],
  [6, 10, 2],
  [8, 7, 6],
  [9, 1, 8],
];

// Standard regular icosahedron 20 face definitions with properly oriented normals
export const STANDARD_FACES: [number, number, number][] = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1],
];

// Verified 20 unique faces of icosahedron
export const ICOSAHEDRON_TRIANGLES: [number, number, number][] = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 4, 11],
  [11, 2, 10],
  [10, 6, 7],
  [7, 8, 1],
  [3, 4, 9],
  [3, 2, 4],
  [3, 6, 2],
  [3, 8, 6],
  [3, 9, 8],
  [4, 5, 9],
  [2, 11, 4],
  [6, 10, 2],
  [8, 7, 6],
  [9, 1, 8],
];

// Palette colors for Clash of Champions aesthetics
export const FACE_COLORS = [
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#0284c7', // Sky
  '#4f46e5', // Violet
  '#d946ef', // Fuchsia
  '#fb7185', // Coral
  '#fbbf24', // Gold
  '#34d399', // Mint
  '#38bdf8', // Light Cyan
];

export const FACE_LABELS = [
  'A', 'B', 'C', 'D', 'E',
  'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O',
  'P', 'Q', 'R', 'S', 'T',
];

// Compute face center normal
export function getFaceCenter(vIndices: [number, number, number]): [number, number, number] {
  const v0 = VERTICES[vIndices[0]];
  const v1 = VERTICES[vIndices[1]];
  const v2 = VERTICES[vIndices[2]];

  const cx = (v0[0] + v1[0] + v2[0]) / 3;
  const cy = (v0[1] + v1[1] + v2[1]) / 3;
  const cz = (v0[2] + v1[2] + v2[2]) / 3;
  const len = Math.sqrt(cx * cx + cy * cy + cz * cz);
  return [cx / len, cy / len, cz / len];
}

// Generate complete icosahedron faces with verified antipodal pairs and adjacency
export function generateIcosahedronFaces(seedValues?: number[]): IcosahedronFace[] {
  // Pre-calculate centers
  const centers = ICOSAHEDRON_TRIANGLES.map(getFaceCenter);

  // Generate numbers for faces (seed or dynamic math values)
  const values = seedValues || [
    7, 12, 23, 15, 8,
    31, 19, 44, 27, 16,
    9, 36, 14, 52, 21,
    18, 40, 25, 33, 11,
  ];

  const faces: IcosahedronFace[] = [];

  for (let i = 0; i < 20; i++) {
    const c1 = centers[i];
    
    // Find antipodal face (normal vector is closest to -c1)
    let bestOppositeIndex = -1;
    let minDot = 1.0;
    for (let j = 0; j < 20; j++) {
      if (i === j) continue;
      const c2 = centers[j];
      const dot = c1[0] * c2[0] + c1[1] * c2[1] + c1[2] * c2[2];
      if (dot < minDot) {
        minDot = dot;
        bestOppositeIndex = j;
      }
    }

    // Find adjacent faces (share exactly 2 vertices)
    const vI = ICOSAHEDRON_TRIANGLES[i];
    const adj: number[] = [];
    for (let j = 0; j < 20; j++) {
      if (i === j) continue;
      const vJ = ICOSAHEDRON_TRIANGLES[j];
      let shared = 0;
      for (const vi of vI) {
        if (vJ.includes(vi)) shared++;
      }
      if (shared === 2) {
        adj.push(j);
      }
    }

    // Ensure exactly 3 adjacent faces
    while (adj.length < 3) {
      adj.push((i + 1) % 20);
    }

    faces.push({
      id: i,
      label: FACE_LABELS[i],
      value: values[i % values.length],
      color: FACE_COLORS[i % FACE_COLORS.length],
      oppositeFaceId: bestOppositeIndex,
      adjacentFaceIds: [adj[0], adj[1], adj[2]],
      vertices: [vI[0], vI[1], vI[2]],
      owner: 'neutral',
      isShielded: false,
    });
  }

  return faces;
}

// Generate vertex structures
export function generateIcosahedronVertices(faces: IcosahedronFace[]): IcosahedronVertex[] {
  const vertices: IcosahedronVertex[] = [];

  for (let vId = 0; vId < 12; vId++) {
    const vPos = VERTICES[vId];
    const connectedFaces = faces.filter((f) => f.vertices.includes(vId)).map((f) => f.id);

    vertices.push({
      id: vId,
      x: vPos[0],
      y: vPos[1],
      z: vPos[2],
      connectedFaceIds: connectedFaces,
      owner: 'neutral',
    });
  }

  return vertices;
}

// 2D Net Unfolding Layout Coordinates (Classic 5-10-5 belt unfolded net)
export interface NetFacePosition {
  id: number;
  row: number; // 0, 1, 2
  col: number; // position along row
  points: string; // SVG triangle polygon points
  center: [number, number];
}

export function getUnfoldedNetLayout(size: number = 60): NetFacePosition[] {
  const h = (Math.sqrt(3) / 2) * size;
  const net: NetFacePosition[] = [];

  // 2D net layout organized in standard 3 rows (5 top, 10 middle alternating, 5 bottom)
  // Row 0: Top 5 triangles (pointing down)
  for (let c = 0; c < 5; c++) {
    const faceId = c;
    const x = 120 + c * size * 1.5;
    const y = 80;
    // Triangle pointing down
    const p1 = `${x},${y}`;
    const p2 = `${x + size},${y}`;
    const p3 = `${x + size / 2},${y + h}`;
    net.push({
      id: faceId,
      row: 0,
      col: c,
      points: `${p1} ${p2} ${p3}`,
      center: [x + size / 2, y + h / 3],
    });
  }

  // Row 1: Middle belt 10 triangles (alternating up and down)
  for (let c = 0; c < 10; c++) {
    const faceId = 5 + c;
    const x = 45 + c * (size / 2) * 1.5;
    const y = 80 + h;
    const isUp = c % 2 === 0;

    let points = '';
    let cy = y;
    if (isUp) {
      const p1 = `${x + size / 2},${y}`;
      const p2 = `${x},${y + h}`;
      const p3 = `${x + size},${y + h}`;
      points = `${p1} ${p2} ${p3}`;
      cy = y + (2 * h) / 3;
    } else {
      const p1 = `${x},${y}`;
      const p2 = `${x + size},${y}`;
      const p3 = `${x + size / 2},${y + h}`;
      points = `${p1} ${p2} ${p3}`;
      cy = y + h / 3;
    }

    net.push({
      id: faceId,
      row: 1,
      col: c,
      points,
      center: [x + size / 2, cy],
    });
  }

  // Row 2: Bottom 5 triangles (pointing up)
  for (let c = 0; c < 5; c++) {
    const faceId = 15 + c;
    const x = 120 + c * size * 1.5;
    const y = 80 + 2 * h;
    // Triangle pointing up
    const p1 = `${x + size / 2},${y}`;
    const p2 = `${x},${y + h}`;
    const p3 = `${x + size},${y + h}`;
    net.push({
      id: faceId,
      row: 2,
      col: c,
      points: `${p1} ${p2} ${p3}`,
      center: [x + size / 2, y + (2 * h) / 3],
    });
  }

  return net;
}

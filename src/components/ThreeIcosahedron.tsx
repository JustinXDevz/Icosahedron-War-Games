import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { IcosahedronFace } from '../types/game';
import { ICOSAHEDRON_TRIANGLES, VERTICES, getFaceCenter } from '../utils/icosahedronGeometry';
import { RotateCw, Pause, Play } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface ThreeIcosahedronProps {
  faces: IcosahedronFace[];
  selectedFaceId?: number | null;
  highlightedFaceIds?: number[];
  onFaceClick?: (faceId: number) => void;
  autoRotate?: boolean;
  onToggleAutoRotate?: () => void;
  showLabels?: boolean;
  hideNumbers?: boolean; // When true, only shows Alphabet Letter (Memory recall mode)
  showOpposites?: boolean;
  explodedFactor?: number; // 0.0 to 1.0
  height?: number | string;
  theme?: 'arena' | 'cyber' | 'lab';
}

// 256x256 texture size is ideal for 3D triangle faces (75% less VRAM and bandwidth than 512x512)
const TEX_SIZE = 256;

// Draw directly onto a provided 2D canvas context (No canvas re-allocation)
function drawFaceCanvas(
  ctx: CanvasRenderingContext2D,
  face: IcosahedronFace,
  isHighlighted: boolean,
  isSelected: boolean,
  showLabels: boolean,
  hideNumbers: boolean = false
) {
  ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);

  // Draw equilateral triangle path
  ctx.beginPath();
  ctx.moveTo(128, 20);
  ctx.lineTo(235, 210);
  ctx.lineTo(21, 210);
  ctx.closePath();

  // Face owner / base color
  let baseColor = face.color;
  if (face.owner === 'player') {
    baseColor = '#06b6d4';
  } else if (face.owner === 'opponent') {
    baseColor = '#f43f5e';
  }

  const grad = ctx.createLinearGradient(50, 25, 200, 225);
  grad.addColorStop(0, baseColor);
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fill();

  // Border Stroke
  ctx.lineWidth = isSelected ? 12 : isHighlighted ? 9 : 4;
  ctx.strokeStyle = isSelected
    ? '#38bdf8'
    : isHighlighted
    ? '#facc15'
    : face.isShielded
    ? '#a855f7'
    : 'rgba(255, 255, 255, 0.4)';
  ctx.stroke();

  // Inner subtle pattern
  ctx.beginPath();
  ctx.arc(128, 145, 55, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (showLabels) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (hideNumbers) {
      // Large Alphabet Letter
      ctx.font = 'bold 64px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(face.label, 128, 142);
    } else {
      ctx.font = 'bold 48px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(face.label, 128, 125);

      // Face Numeric Value
      ctx.font = '800 34px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = isHighlighted ? '#fde047' : '#38bdf8';
      ctx.fillText(String(face.value), 128, 165);
    }

    // Ownership badge
    if (face.owner === 'player') {
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#06b6d4';
      ctx.fillText('★ YOU', 128, 198);
    } else if (face.owner === 'opponent') {
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('⚔ RIVAL', 128, 198);
    }
  }
}

export const ThreeIcosahedron: React.FC<ThreeIcosahedronProps> = ({
  faces,
  selectedFaceId = null,
  highlightedFaceIds = [],
  onFaceClick,
  autoRotate = false,
  onToggleAutoRotate,
  showLabels = true,
  hideNumbers = false,
  showOpposites = false,
  explodedFactor = 0,
  height = 420,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const faceMeshesRef = useRef<THREE.Mesh[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Persistent Texture Cache to prevent GC thrashing & memory leaks
  const texturesRef = useRef<
    {
      canvas: HTMLCanvasElement;
      ctx: CanvasRenderingContext2D;
      texture: THREE.CanvasTexture;
    }[]
  >([]);

  const [hoveredFaceId, setHoveredFaceId] = useState<number | null>(null);
  const [internalAutoRotate, setInternalAutoRotate] = useState<boolean>(autoRotate);

  // Visibility and animation loop control
  const isVisibleRef = useRef<boolean>(true);
  const isDraggingRef = useRef(false);
  const isInteractingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const raycastPendingRef = useRef<boolean>(false);

  // Synchronize internal autoRotate with prop
  useEffect(() => {
    setInternalAutoRotate(autoRotate);
  }, [autoRotate]);

  // Request a single frame render on demand (useful when scene is static)
  const renderScene = useCallback(() => {
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, []);

  // Setup ThreeJS scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 400;
    const h = typeof height === 'number' ? height : mountRef.current.clientHeight || 420;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / h, 0.1, 100);
    camera.position.set(0, 0, 3.2);
    cameraRef.current = camera;

    // High Performance WebGL Renderer with capped pixel ratio to save GPU
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      precision: 'mediump',
    });
    renderer.setSize(width, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    rendererRef.current = renderer;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // Optimized Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.6);
    dirLight1.position.set(4, 6, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf59e0b, 1.0);
    dirLight2.position.set(-4, -5, -3);
    scene.add(dirLight2);

    // Group for Icosahedron
    const group = new THREE.Group();
    meshGroupRef.current = group;
    scene.add(group);

    // Build Individual 20 Triangular Face Meshes with persistent textures
    const meshes: THREE.Mesh[] = [];
    const texPool: {
      canvas: HTMLCanvasElement;
      ctx: CanvasRenderingContext2D;
      texture: THREE.CanvasTexture;
    }[] = [];

    const scale = 1.0;

    for (let i = 0; i < 20; i++) {
      const vIndices = ICOSAHEDRON_TRIANGLES[i];
      const v0 = new THREE.Vector3(...VERTICES[vIndices[0]]).multiplyScalar(scale);
      const v1 = new THREE.Vector3(...VERTICES[vIndices[1]]).multiplyScalar(scale);
      const v2 = new THREE.Vector3(...VERTICES[vIndices[2]]).multiplyScalar(scale);

      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array([
        v0.x, v0.y, v0.z,
        v1.x, v1.y, v1.z,
        v2.x, v2.y, v2.z,
      ]);
      const uvs = new Float32Array([0.5, 0.95, 0.95, 0.1, 0.05, 0.1]);

      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geom.computeVertexNormals();

      // Create persistent 256x256 canvas & texture for face i
      const canvas = document.createElement('canvas');
      canvas.width = TEX_SIZE;
      canvas.height = TEX_SIZE;
      const ctx = canvas.getContext('2d', { willReadFrequently: false })!;

      const faceData = faces[i] || {
        id: i,
        label: `${i + 1}`,
        value: i * 2,
        color: '#06b6d4',
        owner: 'neutral',
      };

      drawFaceCanvas(ctx, faceData, false, false, showLabels, hideNumbers);

      const texture = new THREE.CanvasTexture(canvas);
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      texPool.push({ canvas, ctx, texture });

      const material = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
        roughness: 0.3,
        metalness: 0.3,
      });

      const mesh = new THREE.Mesh(geom, material);
      mesh.userData = { faceId: i };
      group.add(mesh);
      meshes.push(mesh);
    }

    faceMeshesRef.current = meshes;
    texturesRef.current = texPool;

    // Outer subtle wireframe halo
    const wireGeom = new THREE.IcosahedronGeometry(scale * 1.01, 0);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const wireMesh = new THREE.Mesh(wireGeom, wireMat);
    group.add(wireMesh);

    // Initial render
    renderer.render(scene, camera);

    // Active Render Loop with Smart Idle Optimization
    let lastTime = performance.now();
    const animate = (time: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);

      // If tab is hidden or element is scrolled out of view, sleep
      if (!isVisibleRef.current) return;

      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      let needsRender = false;

      if (group && internalAutoRotate && !isDraggingRef.current) {
        group.rotation.y += delta * 0.45;
        group.rotation.x += delta * 0.18;
        needsRender = true;
      }

      if (isInteractingRef.current) {
        needsRender = true;
      }

      if (needsRender) {
        renderer.render(scene, camera);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // IntersectionObserver to pause rendering when out of viewport
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries[0]?.isIntersecting ?? true;
        isVisibleRef.current = isIntersecting && !document.hidden;
        if (isVisibleRef.current) {
          renderScene();
        }
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(mountRef.current);

    // VisibilityChange listener
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      if (isVisibleRef.current) {
        renderScene();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0] || !camera || !renderer) return;
      const { width: newW, height: newH } = entries[0].contentRect;
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
        renderer.render(scene, camera);
      }
    });
    resizeObserver.observe(mountRef.current);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();

      renderer.dispose();
      meshes.forEach((m) => {
        m.geometry.dispose();
        if (m.material instanceof THREE.Material) {
          m.material.dispose();
        }
      });
      wireGeom.dispose();
      wireMat.dispose();
      texPool.forEach((t) => t.texture.dispose());
    };
  }, []);

  // Update Face Textures in-place when props change (Fast, 0 heap allocation)
  useEffect(() => {
    if (!faceMeshesRef.current.length || !texturesRef.current.length || !faces.length) return;

    faceMeshesRef.current.forEach((mesh, i) => {
      const face = faces[i];
      const texItem = texturesRef.current[i];
      if (!face || !texItem) return;

      const isSelected = selectedFaceId === i;
      const isHighlighted =
        highlightedFaceIds.includes(i) ||
        (showOpposites && selectedFaceId !== null && faces[selectedFaceId]?.oppositeFaceId === i);

      // Redraw directly into the existing canvas
      drawFaceCanvas(texItem.ctx, face, isHighlighted, isSelected, showLabels, hideNumbers);
      texItem.texture.needsUpdate = true;

      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        if (isSelected) {
          mesh.material.emissive.setHex(0x0ea5e9);
          mesh.material.emissiveIntensity = 0.45;
        } else if (isHighlighted) {
          mesh.material.emissive.setHex(0xeab308);
          mesh.material.emissiveIntensity = 0.4;
        } else {
          mesh.material.emissive.setHex(0x000000);
          mesh.material.emissiveIntensity = 0;
        }
      }

      // Handle exploded factor
      if (explodedFactor > 0) {
        const center = getFaceCenter(ICOSAHEDRON_TRIANGLES[i]);
        mesh.position.set(
          center[0] * explodedFactor * 0.8,
          center[1] * explodedFactor * 0.8,
          center[2] * explodedFactor * 0.8
        );
      } else {
        mesh.position.set(0, 0, 0);
      }
    });

    renderScene();
  }, [
    faces,
    selectedFaceId,
    highlightedFaceIds,
    showLabels,
    hideNumbers,
    showOpposites,
    explodedFactor,
    renderScene,
  ]);

  // Pointer Events for 3D Orbiting with throttled updates
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    isInteractingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;

    if (isDraggingRef.current && meshGroupRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      meshGroupRef.current.rotation.y += deltaX * 0.008;
      meshGroupRef.current.rotation.x += deltaY * 0.008;

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      renderScene();
    } else {
      // Throttle raycast on hover
      if (raycastPendingRef.current) return;
      raycastPendingRef.current = true;

      requestAnimationFrame(() => {
        raycastPendingRef.current = false;
        if (!mountRef.current || !cameraRef.current) return;

        const rect = mountRef.current.getBoundingClientRect();
        mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObjects(faceMeshesRef.current);

        if (intersects.length > 0) {
          const faceId = intersects[0].object.userData.faceId;
          if (hoveredFaceId !== faceId) {
            setHoveredFaceId(faceId);
          }
        } else if (hoveredFaceId !== null) {
          setHoveredFaceId(null);
        }
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    isInteractingRef.current = false;

    if (!mountRef.current || !cameraRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(faceMeshesRef.current);

    if (intersects.length > 0) {
      const faceId = intersects[0].object.userData.faceId;
      sounds.playClick();
      onFaceClick?.(faceId);
    }
  };

  const resetRotation = useCallback(() => {
    if (meshGroupRef.current) {
      meshGroupRef.current.rotation.set(0, 0, 0);
      sounds.playWhoosh();
      renderScene();
    }
  }, [renderScene]);

  const toggleRotation = () => {
    const next = !internalAutoRotate;
    setInternalAutoRotate(next);
    onToggleAutoRotate?.();
    sounds.playClick();
  };

  return (
    <div
      id="threejs-icosahedron-viewport"
      className="relative w-full rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-900/90 border border-slate-800/80 shadow-2xl overflow-hidden select-none"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      {/* Background Arena Spotlight Rings */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.1),transparent_70%)]" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      {/* 3D Canvas Mount Point */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Interactive Controls Overlay */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-lg">
        <button
          id="btn-toggle-autorotate"
          onClick={toggleRotation}
          title={internalAutoRotate ? 'Pause 3D Rotation' : 'Auto-Rotate Polyhedron'}
          className={`p-2 rounded-lg text-xs font-medium transition-all ${
            internalAutoRotate
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          {internalAutoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          id="btn-reset-rotation"
          onClick={resetRotation}
          title="Reset Camera View"
          className="p-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Hover Info Badge */}
      {hoveredFaceId !== null && faces[hoveredFaceId] && (
        <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-cyan-500/40 shadow-xl flex items-center gap-2.5 animate-fadeIn">
          <div
            className="w-3.5 h-3.5 rounded-full shadow-sm"
            style={{ backgroundColor: faces[hoveredFaceId].color }}
          />
          <div className="text-xs">
            <span className="font-bold text-white">Face {faces[hoveredFaceId].label}</span>
            <span className="mx-1.5 text-slate-500">|</span>
            <span className="font-semibold text-cyan-400">Value: {faces[hoveredFaceId].value}</span>
            <span className="mx-1.5 text-slate-500">|</span>
            <span className="text-amber-400">
              Opposite: Face {faces[faces[hoveredFaceId].oppositeFaceId]?.label}
            </span>
          </div>
        </div>
      )}

      {/* Orbit Guidance Note */}
      <div className="absolute bottom-3 right-3 text-[10px] text-slate-400/80 bg-slate-950/60 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-800/60 pointer-events-none">
        Drag to 3D Orbit • Click Face to Inspect
      </div>
    </div>
  );
};

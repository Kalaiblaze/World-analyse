import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ALL_PILLARS,
  DotConnection,
  IntelligenceBriefing,
  PillarId,
} from '../utils/intelligenceEngine';

interface SpatialPatternObservatory3DProps {
  briefing: IntelligenceBriefing;
  selectedPillar: PillarId | 'ALL';
  onSelectPillar: (pillar: PillarId | 'ALL') => void;
}

type FinishMode = 'archival-bronze' | 'obsidian-titanium' | 'lapis-laboratory';

const PILLAR_ANGLES: Record<PillarId, number> = {
  [PillarId.PHYSICS]: 0,
  [PillarId.TECH]: Math.PI / 3,
  [PillarId.AEROSPACE]: (2 * Math.PI) / 3,
  [PillarId.DEFENCE]: Math.PI,
  [PillarId.GEOPOLITICS]: (4 * Math.PI) / 3,
  [PillarId.MONEY]: (5 * Math.PI) / 3,
};

const PILLAR_COLORS: Record<PillarId, number> = {
  [PillarId.PHYSICS]: 0xc2410c,
  [PillarId.TECH]: 0x1d4ed8,
  [PillarId.AEROSPACE]: 0x0f766e,
  [PillarId.DEFENCE]: 0xb91c1c,
  [PillarId.GEOPOLITICS]: 0x6d28d9,
  [PillarId.MONEY]: 0xb45309,
};

const ORBIT_RADIUS = 6.2;

// Module-scope reusable math helpers (Zero GC in render loop)
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _mouseNdc = new THREE.Vector2();

function createProceduralDialTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#181512';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#c8b89a';
    ctx.lineWidth = 2;
    for (let r = 50; r <= 240; r += 38) {
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = '#8c7a5b';
    ctx.lineWidth = 1;
    for (let i = 0; i < 72; i++) {
      const angle = (i * Math.PI * 2) / 72;
      const inner = i % 6 === 0 ? 70 : 195;
      ctx.beginPath();
      ctx.moveTo(256 + Math.cos(angle) * inner, 256 + Math.sin(angle) * inner);
      ctx.lineTo(256 + Math.cos(angle) * 244, 256 + Math.sin(angle) * 244);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds a composite 5-to-8 part procedural 3D monument for each of the 6 intelligence pillars.
 * Pivoted at bottom-center (y = 0) so every structure sits flush on the observatory deck.
 */
function buildCompositePillarMonument(
  pillar: PillarId,
  accentHex: number,
  isSoftwareGl: boolean
): {
  root: THREE.Group;
  pastStratum: THREE.Group;
  presentStratum: THREE.Group;
  futureStratum: THREE.Group;
  hitProxy: THREE.Mesh;
  highlightRing: THREE.Mesh;
} {
  const root = new THREE.Group();
  const pastStratum = new THREE.Group();
  const presentStratum = new THREE.Group();
  const futureStratum = new THREE.Group();

  root.add(pastStratum, presentStratum, futureStratum);

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x26231f,
    metalness: 0.78,
    roughness: 0.42,
  });
  const brushedBrassMat = new THREE.MeshStandardMaterial({
    color: 0xc89d54,
    metalness: 0.88,
    roughness: 0.18,
  });
  const accentMat = new THREE.MeshPhysicalMaterial({
    color: accentHex,
    metalness: 0.35,
    roughness: 0.22,
    clearcoat: isSoftwareGl ? 0 : 0.8,
  });
  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xf5f0e6,
    metalness: 0.1,
    roughness: 0.68,
  });

  // Contact shadow disc at y = 0.015
  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(1.45, 24),
    new THREE.MeshBasicMaterial({
      color: 0x090807,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    })
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.015;
  root.add(shadowDisc);

  // Selection highlight ring at y = 0.03
  const highlightRing = new THREE.Mesh(
    new THREE.RingGeometry(1.18, 1.34, 32),
    new THREE.MeshBasicMaterial({
      color: accentHex,
      side: THREE.DoubleSide,
    })
  );
  highlightRing.rotation.x = -Math.PI / 2;
  highlightRing.position.y = 0.03;
  root.add(highlightRing);

  // 1. PAST STRATUM (Base Pedestal & Foundation Plinth — 3 distinct parts)
  const baseOctagon = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.18, 0.32, 8),
    darkMetalMat
  );
  baseOctagon.position.y = 0.16;
  baseOctagon.castShadow = !isSoftwareGl;
  baseOctagon.receiveShadow = !isSoftwareGl;

  const baseBevelCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.84, 0.96, 0.24, 16),
    ceramicMat
  );
  baseBevelCollar.position.y = 0.44;

  const pastTrimTorus = new THREE.Mesh(
    new THREE.TorusGeometry(0.86, 0.045, 12, 28),
    brushedBrassMat
  );
  pastTrimTorus.rotation.x = Math.PI / 2;
  pastTrimTorus.position.y = 0.56;

  pastStratum.add(baseOctagon, baseBevelCollar, pastTrimTorus);

  // 2. PRESENT STRATUM (Domain-Specific Mechanical Core — 3 to 4 distinct parts)
  if (pillar === PillarId.PHYSICS) {
    // Tokamak Magnetic Torus + 4 Field Coils
    const corePillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.38, 0.9, 16),
      darkMetalMat
    );
    corePillar.position.y = 1.02;
    const plasmaTorus = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.16, 16, 32),
      accentMat
    );
    plasmaTorus.rotation.x = Math.PI / 2;
    plasmaTorus.position.y = 1.05;
    presentStratum.add(corePillar, plasmaTorus);

    for (let i = 0; i < 4; i++) {
      const coil = new THREE.Mesh(
        new THREE.TorusGeometry(0.24, 0.04, 10, 20),
        brushedBrassMat
      );
      const a = (i * Math.PI) / 2;
      coil.position.set(Math.cos(a) * 0.62, 1.05, Math.sin(a) * 0.62);
      coil.rotation.y = -a;
      presentStratum.add(coil);
    }
  } else if (pillar === PillarId.TECH) {
    // 3D Stacked Chiplet Wafer Dies + Interposer Columns
    for (let layer = 0; layer < 3; layer++) {
      const waferDie = new THREE.Mesh(
        new THREE.BoxGeometry(1.05 - layer * 0.14, 0.14, 1.05 - layer * 0.14),
        layer === 1 ? accentMat : darkMetalMat
      );
      waferDie.position.y = 0.75 + layer * 0.28;
      presentStratum.add(waferDie);
    }
    const busFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.85, 0.52),
      brushedBrassMat
    );
    busFrame.position.y = 1.02;
    presentStratum.add(busFrame);
  } else if (pillar === PillarId.AEROSPACE) {
    // VLEO Skimming Hull + Delta Wing Assembly + Intake Scoop
    const pylon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.28, 0.8, 12),
      darkMetalMat
    );
    pylon.position.y = 0.96;
    const fuselage = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 1.35, 8),
      accentMat
    );
    fuselage.rotation.z = -Math.PI / 2;
    fuselage.position.y = 1.25;
    const deltaWing = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.06, 1.32),
      brushedBrassMat
    );
    deltaWing.position.y = 1.22;
    presentStratum.add(pylon, fuselage, deltaWing);
  } else if (pillar === PillarId.DEFENCE) {
    // Armored Bistatic AESA Radar Turret + Phased Array Shield
    const turretMount = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.68, 0.48, 10),
      darkMetalMat
    );
    turretMount.position.y = 0.82;
    const radarFace = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.68, 0.18),
      accentMat
    );
    radarFace.position.y = 1.24;
    radarFace.rotation.x = -0.35;
    const directorDish = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.12, 0.3, 16),
      brushedBrassMat
    );
    directorDish.position.set(0, 1.32, 0.22);
    directorDish.rotation.x = Math.PI / 3;
    presentStratum.add(turretMount, radarFace, directorDish);
  } else if (pillar === PillarId.GEOPOLITICS) {
    // Sovereign Globe + Equatorial Corridor Ring + Meridian Cradle
    const globeSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, 24, 18),
      accentMat
    );
    globeSphere.position.y = 1.12;
    const equatorialBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.68, 0.05, 12, 32),
      brushedBrassMat
    );
    equatorialBand.rotation.x = Math.PI / 2 - 0.28;
    equatorialBand.position.y = 1.12;
    const meridianArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.04, 10, 28),
      darkMetalMat
    );
    meridianArc.position.y = 1.12;
    presentStratum.add(globeSphere, equatorialBand, meridianArc);
  } else {
    // MONEY & ECONOMY: 3 Sovereign Capital Columns + Liquidity Balance Beam
    for (let c = -1; c <= 1; c++) {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.18, 0.78 + (c + 1) * 0.12, 12),
        c === 0 ? accentMat : brushedBrassMat
      );
      col.position.set(c * 0.36, 0.98, 0);
      presentStratum.add(col);
    }
    const ledgerCap = new THREE.Mesh(
      new THREE.BoxGeometry(1.12, 0.14, 0.48),
      darkMetalMat
    );
    ledgerCap.position.y = 1.44;
    presentStratum.add(ledgerCap);
  }

  // 3. FUTURE STRATUM (1-5-10Y Horizon Beacon Crown — 2 parts)
  const crownHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.46, 0.035, 10, 28),
    brushedBrassMat
  );
  crownHalo.rotation.x = Math.PI / 2;
  crownHalo.position.y = 1.85;

  const futureOctahedron = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.26, 0),
    accentMat
  );
  futureOctahedron.position.y = 2.05;

  futureStratum.add(crownHalo, futureOctahedron);

  // Invisible simplified proxy box on layer 1 for fast raycasting
  const hitProxy = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.15, 2.5, 12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitProxy.position.y = 1.25;
  hitProxy.layers.set(1);
  hitProxy.userData = { pillar };
  root.add(hitProxy);

  return {
    root,
    pastStratum,
    presentStratum,
    futureStratum,
    hitProxy,
    highlightRing,
  };
}

/**
 * Builds the central 8-part 3D Temporal Gyro-Astrolabe centerpiece.
 */
function buildCenterGyroAstrolabe(isSoftwareGl: boolean): {
  group: THREE.Group;
  ringPast: THREE.Mesh;
  ringPresent: THREE.Mesh;
  ringFuture: THREE.Mesh;
  diamondCore: THREE.Mesh;
} {
  const group = new THREE.Group();

  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0x3b3127,
    metalness: 0.85,
    roughness: 0.32,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4a359,
    metalness: 0.92,
    roughness: 0.16,
  });
  const lapisMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    metalness: 0.65,
    roughness: 0.25,
  });
  const diamondMat = new THREE.MeshPhysicalMaterial({
    color: 0xfff7ed,
    metalness: 0.1,
    roughness: 0.08,
    transmission: isSoftwareGl ? 0 : 0.88,
    transparent: true,
    opacity: isSoftwareGl ? 0.85 : 1,
    ior: 2.4,
    clearcoat: 1.0,
  });

  // Base pedestal (3 parts)
  const baseStep1 = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.15, 0.26, 24), bronzeMat);
  baseStep1.position.y = 0.13;
  const baseStep2 = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.65, 0.28, 24), goldMat);
  baseStep2.position.y = 0.4;
  const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.4, 16), bronzeMat);
  spindle.position.y = 1.4;

  // 3 Gyro Rings (Past, Present, Future)
  const ringPast = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.055, 16, 48), bronzeMat);
  ringPast.position.y = 2.1;

  const ringPresent = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.055, 16, 48), goldMat);
  ringPresent.position.y = 2.1;

  const ringFuture = new THREE.Mesh(new THREE.TorusGeometry(1.82, 0.05, 16, 48), lapisMat);
  ringFuture.position.y = 2.1;

  // Central synthetic diamond octahedron core
  const diamondCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 1), diamondMat);
  diamondCore.position.y = 2.1;

  group.add(baseStep1, baseStep2, spindle, ringPast, ringPresent, ringFuture, diamondCore);

  return { group, ringPast, ringPresent, ringFuture, diamondCore };
}

export const SpatialPatternObservatory3D: React.FC<SpatialPatternObservatory3DProps> = ({
  briefing,
  selectedPillar,
  onSelectPillar,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  const [explodedTarget, setExplodedTarget] = useState<number>(0.25);
  const [finishMode, setFinishMode] = useState<FinishMode>('archival-bronze');
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [hoveredPillar, setHoveredPillar] = useState<PillarId | null>(null);

  // Store mutable state & callbacks in refs so React HUD updates never tear down the WebGL canvas
  const selectedPillarRef = useRef<PillarId | 'ALL'>(selectedPillar);
  const explodedTargetRef = useRef<number>(explodedTarget);
  const finishModeRef = useRef<FinishMode>(finishMode);
  const onSelectPillarRef = useRef(onSelectPillar);
  const connectionsRef = useRef<DotConnection[]>(briefing.dotConnections);
  const requestRenderRef = useRef<(() => void) | null>(null);
  const triggerCameraFocusRef = useRef<((pillar: PillarId | 'ALL') => void) | null>(null);

  useEffect(() => {
    selectedPillarRef.current = selectedPillar;
    if (triggerCameraFocusRef.current) {
      triggerCameraFocusRef.current(selectedPillar);
    }
    if (requestRenderRef.current) {
      requestRenderRef.current();
    }
  }, [selectedPillar]);

  useEffect(() => {
    explodedTargetRef.current = explodedTarget;
    if (requestRenderRef.current) {
      requestRenderRef.current();
    }
  }, [explodedTarget]);

  useEffect(() => {
    finishModeRef.current = finishMode;
    if (requestRenderRef.current) {
      requestRenderRef.current();
    }
  }, [finishMode]);

  useEffect(() => {
    onSelectPillarRef.current = onSelectPillar;
  }, [onSelectPillar]);

  useEffect(() => {
    connectionsRef.current = briefing.dotConnections;
    if (requestRenderRef.current) {
      requestRenderRef.current();
    }
  }, [briefing.dotConnections]);

  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    // 1. Software-WebGL detection from GPU renderer string (never userAgent)
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = mountEl.clientWidth || 1200;
    const height = mountEl.clientHeight || 540;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountEl.innerHTML = '';
    mountEl.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const bgHex = 0x161412;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.032);

    // 2. Studio Environment Map via RoomEnvironment + PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 3. Camera & OrbitControls
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
    camera.position.set(0, 7.8, 14.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.06;
    controls.minDistance = 5.5;
    controls.maxDistance = 24;
    controls.target.set(0, 1.2, 0);

    // 4. Balanced 3-Point Studio Lighting Rig (Warm Key + Cool Hemisphere Fill + Rim)
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x44382c, 0.85);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.2);
    keyLight.position.set(9, 14, 8);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      const d = 10;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 35;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.15);
    rimLight.position.set(-10, 8, -9);
    scene.add(rimLight);

    // 5. Observatory Floor Plinth + Procedural Dial Texture (Offset on Y to avoid Z-fighting)
    const dialTexture = createProceduralDialTexture(renderer);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: dialTexture,
      roughness: 0.62,
      metalness: 0.22,
    });
    const floorDisc = new THREE.Mesh(new THREE.CylinderGeometry(9.6, 10.2, 0.3, 64), floorMat);
    floorDisc.position.y = -0.15;
    floorDisc.receiveShadow = !isSoftwareGl;
    scene.add(floorDisc);

    // Instanced outer azimuth markers (36 markers > 20 instances -> InstancedMesh)
    const markerGeo = new THREE.BoxGeometry(0.08, 0.14, 0.36);
    const markerMat = new THREE.MeshStandardMaterial({
      color: 0xc89d54,
      metalness: 0.85,
      roughness: 0.25,
    });
    const markerInstanced = new THREE.InstancedMesh(markerGeo, markerMat, 36);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 36; i++) {
      const a = (i * Math.PI * 2) / 36;
      dummy.position.set(Math.cos(a) * 8.6, 0.07, Math.sin(a) * 8.6);
      dummy.rotation.set(0, -a, 0);
      dummy.scale.setScalar(i % 6 === 0 ? 1.35 : 0.9);
      dummy.updateMatrix();
      markerInstanced.setMatrixAt(i, dummy.matrix);
    }
    markerInstanced.instanceMatrix.needsUpdate = true;
    markerInstanced.computeBoundingSphere();
    scene.add(markerInstanced);

    // 6. Central 3D Temporal Gyro-Astrolabe
    const centerGyro = buildCenterGyroAstrolabe(isSoftwareGl);
    scene.add(centerGyro.group);

    // 7. Six Composite Pillar Monuments
    const pillarNodes: Record<
      PillarId,
      ReturnType<typeof buildCompositePillarMonument>
    > = {} as Record<PillarId, ReturnType<typeof buildCompositePillarMonument>>;
    const hitProxies: THREE.Mesh[] = [];

    for (const pillar of ALL_PILLARS) {
      const angle = PILLAR_ANGLES[pillar];
      const built = buildCompositePillarMonument(
        pillar,
        PILLAR_COLORS[pillar],
        isSoftwareGl
      );
      built.root.position.set(
        Math.cos(angle) * ORBIT_RADIUS,
        0,
        Math.sin(angle) * ORBIT_RADIUS
      );
      built.root.lookAt(0, 0, 0);
      scene.add(built.root);
      pillarNodes[pillar] = built;
      hitProxies.push(built.hitProxy);
    }

    // 8. 3D Causal Dot-Connecting Arcs (TubeGeometry arches between pillars)
    const arcGroup = new THREE.Group();
    scene.add(arcGroup);

    const rebuildCausalArcs = () => {
      while (arcGroup.children.length > 0) {
        const child = arcGroup.children[0] as THREE.Mesh;
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material?.dispose();
        }
        arcGroup.remove(child);
      }

      const activePillar = selectedPillarRef.current;
      connectionsRef.current.forEach((conn, idx) => {
        const sPos = pillarNodes[conn.sourcePillar].root.position;
        const mPos = pillarNodes[conn.intermediatePillar].root.position;
        const tPos = pillarNodes[conn.targetPillar].root.position;

        const isHighlighted =
          activePillar === 'ALL' ||
          conn.sourcePillar === activePillar ||
          conn.intermediatePillar === activePillar ||
          conn.targetPillar === activePillar;

        const curve1 = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(sPos.x, 1.6, sPos.z),
          new THREE.Vector3((sPos.x + mPos.x) * 0.5, 3.4 + idx * 0.35, (sPos.z + mPos.z) * 0.5),
          new THREE.Vector3(mPos.x, 1.6, mPos.z)
        );
        const curve2 = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(mPos.x, 1.6, mPos.z),
          new THREE.Vector3((mPos.x + tPos.x) * 0.5, 3.8 + idx * 0.35, (mPos.z + tPos.z) * 0.5),
          new THREE.Vector3(tPos.x, 1.6, tPos.z)
        );

        const tubeGeo1 = new THREE.TubeGeometry(curve1, 24, isHighlighted ? 0.045 : 0.02, 8, false);
        const tubeGeo2 = new THREE.TubeGeometry(curve2, 24, isHighlighted ? 0.045 : 0.02, 8, false);

        const mat1 = new THREE.MeshStandardMaterial({
          color: isHighlighted ? 0xea580c : 0x57534e,
          emissive: isHighlighted ? 0x9a3412 : 0x000000,
          emissiveIntensity: isHighlighted ? 0.65 : 0,
          roughness: 0.3,
          metalness: 0.5,
        });
        const mat2 = new THREE.MeshStandardMaterial({
          color: isHighlighted ? 0x3b82f6 : 0x57534e,
          emissive: isHighlighted ? 0x1d4ed8 : 0x000000,
          emissiveIntensity: isHighlighted ? 0.65 : 0,
          roughness: 0.3,
          metalness: 0.5,
        });

        arcGroup.add(new THREE.Mesh(tubeGeo1, mat1), new THREE.Mesh(tubeGeo2, mat2));
      });
    };

    rebuildCausalArcs();

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 9. Smooth Camera Preset Transition State & On-Demand Render Loop with Software-WebGL Pacing
    let currentExploded = explodedTargetRef.current;
    let cameraTransitionActive = false;
    _targetCamPos.copy(camera.position);
    _targetLookAt.copy(controls.target);

    triggerCameraFocusRef.current = (pillar: PillarId | 'ALL') => {
      rebuildCausalArcs();
      if (pillar === 'ALL') {
        _targetCamPos.set(0, 7.8, 14.2);
        _targetLookAt.set(0, 1.2, 0);
      } else {
        const angle = PILLAR_ANGLES[pillar];
        const px = Math.cos(angle) * ORBIT_RADIUS;
        const pz = Math.sin(angle) * ORBIT_RADIUS;
        _targetCamPos.set(
          Math.cos(angle) * (ORBIT_RADIUS + 4.8),
          3.8,
          Math.sin(angle) * (ORBIT_RADIUS + 4.8)
        );
        _targetLookAt.set(px * 0.75, 1.3, pz * 0.75);
      }
      cameraTransitionActive = true;
    };

    controls.addEventListener('start', () => {
      cameraTransitionActive = false;
    });

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      if (gl.flush) gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame((now) => {
        renderDirty = false;
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        // Apply finish theme palette
        const mode = finishModeRef.current;
        const targetBg =
          mode === 'archival-bronze'
            ? 0x161412
            : mode === 'obsidian-titanium'
            ? 0x0b0f17
            : 0x0f172a;
        (scene.background as THREE.Color).setHex(targetBg);
        if (scene.fog instanceof THREE.FogExp2) {
          scene.fog.color.setHex(targetBg);
        }

        // Smoothly damp exploded temporal strata separation
        const expTarget = explodedTargetRef.current;
        currentExploded = THREE.MathUtils.damp(currentExploded, expTarget, 8, dt || 0.016);
        const explodeSettled = Math.abs(currentExploded - expTarget) < 0.002;

        const activePillar = selectedPillarRef.current;
        for (const pillar of ALL_PILLARS) {
          const node = pillarNodes[pillar];
          node.presentStratum.position.y = currentExploded * 0.75;
          node.futureStratum.position.y = currentExploded * 1.65;
          const isSelected = activePillar === 'ALL' || activePillar === pillar;
          node.highlightRing.visible = isSelected;
          node.root.scale.setScalar(activePillar === pillar ? 1.14 : 1.0);
        }

        // Rotate central gyro rings slightly based on exploded state
        centerGyro.ringPast.rotation.x = 0.35 + currentExploded * 0.4;
        centerGyro.ringPresent.rotation.y = 0.6 + currentExploded * 0.8;
        centerGyro.ringFuture.rotation.z = -0.4 - currentExploded * 0.6;
        centerGyro.diamondCore.position.y = 2.1 + currentExploded * 0.55;

        // Smoothly damp camera focus transitions
        let camSettled = true;
        if (cameraTransitionActive) {
          const factor = isSoftwareGl ? 1 : 1 - Math.exp(-6 * (dt || 0.016));
          camera.position.lerp(_targetCamPos, factor);
          controls.target.lerp(_targetLookAt, factor);
          if (
            camera.position.distanceToSquared(_targetCamPos) < 0.01 &&
            controls.target.distanceToSquared(_targetLookAt) < 0.01
          ) {
            camera.position.copy(_targetCamPos);
            controls.target.copy(_targetLookAt);
            cameraTransitionActive = false;
          } else {
            camSettled = false;
          }
        }

        controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty || !explodeSettled || !camSettled) {
            requestRender();
          }
        };

        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    requestRenderRef.current = requestRender;
    controls.addEventListener('change', requestRender);

    // 10. High-Performance Raycasting on Layer 1 Proxy Cylinders
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    let lastHoverTime = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverTime < 60) return;
      lastHoverTime = now;

      const rect = renderer.domElement.getBoundingClientRect();
      _mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(_mouseNdc, camera);
      const hits = raycaster.intersectObjects(hitProxies, false);
      if (hits.length > 0) {
        const hitPillar = hits[0].object.userData.pillar as PillarId;
        setHoveredPillar(hitPillar);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredPillar(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(_mouseNdc, camera);
      const hits = raycaster.intersectObjects(hitProxies, false);
      if (hits.length > 0) {
        const clickedPillar = hits[0].object.userData.pillar as PillarId;
        const next =
          selectedPillarRef.current === clickedPillar ? 'ALL' : clickedPillar;
        onSelectPillarRef.current(next);
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    const handleResize = () => {
      if (!mountEl) return;
      const w = mountEl.clientWidth || 1200;
      const h = mountEl.clientHeight || 540;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
      requestRender();
    };
    window.addEventListener('resize', handleResize);

    // Initial render
    requestRender();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      controls.dispose();
      dialTexture.dispose();
      envTarget.dispose();
      renderer.dispose();
    };
  }, []);

  const activePillarData =
    selectedPillar === 'ALL'
      ? null
      : briefing.pillars.find((p) => p.id === selectedPillar) ?? null;

  return (
    <section
      id="spatial-observatory"
      aria-labelledby="spatial-observatory-heading"
      className="my-8"
    >
      <div className="relative w-full h-[540px] lg:h-[600px] rounded-xl overflow-hidden border-2 border-[#292524] shadow-[0_14px_0_0_#1C1917] bg-[#161412]">
        {/* Dedicated Empty WebGL Canvas Mount Container (Outside Sibling HUD Overlays) */}
        <div
          ref={canvasMountRef}
          data-testid="spatial-3d-observatory-canvas"
          className="w-full h-full"
        />

        {/* Top-Left Minimal Spec & Active Pillar Telemetry Header (Zero backdrop-filter over WebGL) */}
        <div className="absolute top-4 left-4 right-4 flex flex-wrap items-start justify-between gap-4 pointer-events-none z-10">
          <div className="p-4 rounded-lg bg-[#161412]/92 border border-[#44403C] text-[#FBF9F5] max-w-md pointer-events-auto shadow-lg">
            <div className="text-[11px] font-mono-tabular uppercase tracking-widest text-[#F59E0B] mb-1">
              3D SPATIAL PATTERN OBSERVATORY · THREE.JS PBR DECK
            </div>
            <h2
              id="spatial-observatory-heading"
              className="text-lg font-editorial font-semibold text-[#FBF9F5] leading-snug"
            >
              {activePillarData
                ? `${activePillarData.id}: ${activePillarData.headline}`
                : 'Interactive 6-Pillar 3D Temporal Gyro-Matrix (Past · Present · Future)'}
            </h2>
            <p className="mt-1 text-xs text-[#D6CEBE] leading-relaxed">
              {activePillarData
                ? `Present Metric: ${activePillarData.present.keyMetric} (${activePillarData.present.metricLabel})`
                : hoveredPillar
                ? `Inspecting 3D Monument: ${hoveredPillar} — Click monument to lock camera & filter briefing.`
                : 'Drag to orbit 360°, scroll to zoom, or click any 3D pillar monument to inspect its causal arcs.'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#161412]/92 border border-[#44403C] text-xs font-mono-tabular text-[#D6CEBE] pointer-events-auto">
            <div>STRATA SEPARATION: {Math.round(explodedTarget * 100)}%</div>
            <div className="text-[#F59E0B]">
              FOCUS: {selectedPillar === 'ALL' ? 'ALL 6 PILLARS' : selectedPillar.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Ergonomic Collapsible Bottom Control Dock (Zero Side-Panel Clutter, No backdrop-filter) */}
        <div
          style={{
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 'min(940px, 94vw)',
          }}
          className="absolute w-full z-10 pointer-events-auto"
        >
          <div className="flex justify-center mb-1.5">
            <button
              type="button"
              onClick={() => setDockCollapsed((prev) => !prev)}
              className="px-3.5 py-1 text-xs font-mono-tabular font-semibold text-[#FBF9F5] bg-[#1C1917] border border-[#57534E] rounded-t-md hover:bg-[#9A3412] transition-colors cursor-pointer"
            >
              {dockCollapsed ? '▴ Show 3D Controls' : '▾ Hide 3D Controls'}
            </button>
          </div>

          {!dockCollapsed && (
            <div className="px-3.5 py-2.5 rounded-xl bg-[#161412]/95 border border-[#57534E] text-[#FBF9F5] shadow-2xl flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
              {/* Camera / Pillar Target Buttons */}
              <div
                role="group"
                aria-label="3D Camera Pillar Presets"
                className="flex flex-wrap lg:flex-nowrap items-center gap-1"
              >
                <button
                  type="button"
                  onClick={() => onSelectPillar('ALL')}
                  className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedPillar === 'ALL'
                      ? 'bg-[#EA580C] text-[#FBF9F5]'
                      : 'bg-[#292524] text-[#D6CEBE] hover:text-[#FBF9F5]'
                  }`}
                >
                  Overview
                </button>
                {ALL_PILLARS.map((pillar) => (
                  <button
                    key={pillar}
                    type="button"
                    onClick={() =>
                      onSelectPillar(selectedPillar === pillar ? 'ALL' : pillar)
                    }
                    className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedPillar === pillar
                        ? 'bg-[#EA580C] text-[#FBF9F5]'
                        : 'bg-[#292524] text-[#D6CEBE] hover:text-[#FBF9F5]'
                    }`}
                  >
                    {pillar === PillarId.MONEY ? 'Money' : pillar}
                  </button>
                ))}
              </div>

              {/* Exploded 3D Temporal Strata Slider (Past / Present / Future Separation) */}
              <div className="flex items-center gap-2 shrink-0">
                <label
                  htmlFor="exploded-strata-slider"
                  className="text-[11px] font-mono-tabular text-[#D6CEBE] whitespace-nowrap"
                >
                  3D Strata:
                </label>
                <input
                  id="exploded-strata-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={explodedTarget}
                  onChange={(e) => setExplodedTarget(parseFloat(e.target.value))}
                  className="w-20 accent-[#EA580C] cursor-pointer"
                />
              </div>

              {/* Material & Studio Finish Selector */}
              <div className="flex items-center gap-1 shrink-0">
                {(
                  [
                    { id: 'archival-bronze', label: 'Bronze' },
                    { id: 'obsidian-titanium', label: 'Obsidian' },
                    { id: 'lapis-laboratory', label: 'Lapis' },
                  ] as const
                ).map((finish) => (
                  <button
                    key={finish.id}
                    type="button"
                    onClick={() => setFinishMode(finish.id)}
                    className={`px-2 py-1 text-[11px] font-mono-tabular rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      finishMode === finish.id
                        ? 'bg-[#FBF9F5] text-[#1C1917] font-semibold'
                        : 'bg-[#292524] text-[#D6CEBE] hover:text-[#FBF9F5]'
                    }`}
                  >
                    {finish.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

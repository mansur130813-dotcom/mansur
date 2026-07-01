import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { roomSize, type HotspotId, type Point } from '../gameData';

type ActionTarget = HotspotId | 'deskSort' | 'deskOpen';

type Props = {
  player: Point;
  lightOn: boolean;
  finalMode: boolean;
  fear: number;
  actionActive: boolean;
  actionTarget: ActionTarget | null;
  onViewYawChange: (yaw: number) => void;
};

const personScale = 1.6;
const personGroundY = 0.32;

type Pose = {
  leftUpperArm: number;
  rightUpperArm: number;
  leftLowerArm: number;
  rightLowerArm: number;
  leftUpperLeg?: number;
  rightUpperLeg?: number;
};

type AnimatedPersonParts = {
  leftUpperArm: THREE.Mesh;
  rightUpperArm: THREE.Mesh;
  leftLowerArm: THREE.Mesh;
  rightLowerArm: THREE.Mesh;
  leftUpperLeg: THREE.Mesh;
  rightUpperLeg: THREE.Mesh;
  leftLowerLeg: THREE.Mesh;
  rightLowerLeg: THREE.Mesh;
  leftShoe: THREE.Mesh;
  rightShoe: THREE.Mesh;
};

function actionPose(target: ActionTarget | null, motion: number): Pose {
  switch (target) {
    case 'boxes':
      return {
        leftUpperArm: -1.18 + Math.abs(motion) * 0.2,
        rightUpperArm: -1.18 + Math.abs(motion) * 0.2,
        leftLowerArm: -0.95 - motion * 0.16,
        rightLowerArm: -0.95 + motion * 0.16,
        leftUpperLeg: 0.22,
        rightUpperLeg: -0.1,
      };
    case 'deskSort':
      return {
        leftUpperArm: -1.55 + Math.abs(motion) * 0.55,
        rightUpperArm: -1.55 + Math.abs(motion) * 0.55,
        leftLowerArm: -0.72 + motion * 0.18,
        rightLowerArm: -0.72 - motion * 0.18,
      };
    case 'deskOpen':
      return {
        leftUpperArm: -0.42,
        rightUpperArm: -0.92 - Math.abs(motion) * 0.18,
        leftLowerArm: -0.18,
        rightLowerArm: -0.52 + motion * 0.34,
      };
    case 'desk':
      return {
        leftUpperArm: -0.82 + motion * 0.15,
        rightUpperArm: -0.72 - motion * 0.15,
        leftLowerArm: -0.52 + motion * 0.18,
        rightLowerArm: -0.58 - motion * 0.18,
      };
    case 'coffee':
      return {
        leftUpperArm: -0.16,
        rightUpperArm: -1.28 + motion * 0.08,
        leftLowerArm: -0.12,
        rightLowerArm: -1.05 + Math.abs(motion) * 0.12,
      };
    case 'switch':
      return {
        leftUpperArm: -0.08,
        rightUpperArm: -1.72 + motion * 0.12,
        leftLowerArm: -0.06,
        rightLowerArm: -0.34 + Math.abs(motion) * 0.22,
      };
    case 'shelves':
      return {
        leftUpperArm: -1.1 + motion * 0.14,
        rightUpperArm: -1.0 - motion * 0.14,
        leftLowerArm: -0.38,
        rightLowerArm: -0.42,
      };
    case 'hall':
      return {
        leftUpperArm: -0.4,
        rightUpperArm: -0.72 + motion * 0.08,
        leftLowerArm: -0.72,
        rightLowerArm: -1.18 + Math.abs(motion) * 0.1,
      };
    case 'camera':
      return {
        leftUpperArm: -0.72 + motion * 0.18,
        rightUpperArm: -0.76 - motion * 0.18,
        leftLowerArm: -0.62 - motion * 0.2,
        rightLowerArm: -0.62 + motion * 0.2,
      };
    case 'redFolder':
      return {
        leftUpperArm: -1.05 + motion * 0.1,
        rightUpperArm: -1.05 - motion * 0.1,
        leftLowerArm: -0.86,
        rightLowerArm: -0.86,
      };
    case 'case417':
      return {
        leftUpperArm: -0.95,
        rightUpperArm: -0.7 + motion * 0.22,
        leftLowerArm: -0.7,
        rightLowerArm: -0.42 - Math.abs(motion) * 0.22,
      };
    case 'flashlight':
      return {
        leftUpperArm: -0.35,
        rightUpperArm: -1.0 + motion * 0.18,
        leftLowerArm: -0.2,
        rightLowerArm: -0.3 + motion * 0.15,
      };
    case 'incinerator':
      return {
        leftUpperArm: -1.22 + motion * 0.14,
        rightUpperArm: -1.3 - motion * 0.14,
        leftLowerArm: -0.96,
        rightLowerArm: -1.05,
        leftUpperLeg: 0.18,
        rightUpperLeg: -0.08,
      };
    case 'exit':
      return {
        leftUpperArm: -0.2,
        rightUpperArm: -0.86 + motion * 0.28,
        leftLowerArm: -0.1,
        rightLowerArm: -0.18 + motion * 0.3,
      };
    default:
      return {
        leftUpperArm: -0.95 + motion * 0.18,
        rightUpperArm: -0.95 - motion * 0.18,
        leftLowerArm: -0.62 + motion * 0.16,
        rightLowerArm: -0.62 - motion * 0.16,
      };
  }
}

function toWorld(point: Point) {
  return {
    x: (point.x / roomSize.width - 0.5) * 18,
    z: (point.y / roomSize.height - 0.5) * 10.8,
  };
}

function box(
  scene: THREE.Scene,
  size: [number, number, number],
  position: [number, number, number],
  color: number,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0.05 }),
  );
  mesh.position.set(...position);
  scene.add(mesh);
  return mesh;
}

function labelSprite(text: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = 'rgba(18, 14, 10, 0.78)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#d8a14b';
    context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    context.fillStyle = '#f6edda';
    context.font = '700 25px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(1.65, 0.42, 1);
  return sprite;
}

function addLabel(scene: THREE.Scene, text: string, position: [number, number, number]) {
  const sprite = labelSprite(text);
  sprite.position.set(...position);
  scene.add(sprite);
}

function addTable(scene: THREE.Scene) {
  box(scene, [3.9, 0.32, 1.65], [0.3, 0.72, 1.1], 0x7a4f2f).castShadow = true;
  box(scene, [0.18, 0.85, 0.18], [-1.35, 0.3, 0.55], 0x3a2418);
  box(scene, [0.18, 0.85, 0.18], [1.95, 0.3, 0.55], 0x3a2418);
  box(scene, [0.18, 0.85, 0.18], [-1.35, 0.3, 1.7], 0x3a2418);
  box(scene, [0.18, 0.85, 0.18], [1.95, 0.3, 1.7], 0x3a2418);
  addLabel(scene, 'СТОЛ', [0.3, 1.55, 1.15]);
}

function addCoffee(scene: THREE.Scene) {
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.15, 0.24, 24),
    new THREE.MeshStandardMaterial({ color: 0xe1d2ae, roughness: 0.55 }),
  );
  cup.position.set(1.75, 1.02, 1.55);
  scene.add(cup);
  const coffee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.02, 24),
    new THREE.MeshStandardMaterial({ color: 0x2a1510, roughness: 0.4 }),
  );
  coffee.position.set(1.75, 1.15, 1.55);
  scene.add(coffee);
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.025, 8, 18, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xe1d2ae, roughness: 0.55 }),
  );
  handle.position.set(1.93, 1.04, 1.55);
  handle.rotation.z = Math.PI / 2;
  scene.add(handle);
  addLabel(scene, 'КОФЕ', [1.75, 1.62, 1.55]);
}

function addBoxes(scene: THREE.Scene) {
  box(scene, [1.0, 0.55, 0.72], [-6.6, 0.28, 3.7], 0xa36e35);
  box(scene, [0.86, 0.48, 0.62], [-7.15, 0.78, 3.42], 0x8b5a2b);
  box(scene, [0.82, 0.42, 0.58], [-6.2, 0.74, 3.2], 0xb57c3c);
  box(scene, [0.86, 0.04, 0.04], [-6.6, 0.58, 3.7], 0x2f2016);
  addLabel(scene, 'КОРОБКИ', [-6.65, 1.45, 3.45]);
}

function addCameraStation(scene: THREE.Scene) {
  box(scene, [1.25, 0.78, 0.12], [6.2, 0.95, 1.5], 0x183831);
  box(scene, [1.05, 0.55, 0.04], [6.2, 0.95, 1.42], 0x5bb494);
  box(scene, [0.45, 0.18, 0.4], [6.2, 0.32, 1.78], 0x181615);
  box(scene, [0.12, 0.5, 0.12], [6.2, 0.62, 1.72], 0x181615);
  box(scene, [0.5, 0.22, 0.32], [6.2, 1.78, -4.88], 0x111111);
  box(scene, [0.14, 0.14, 0.3], [6.2, 1.78, -4.62], 0x333333);
  addLabel(scene, 'КАМЕРЫ', [6.2, 1.72, 1.45]);
}

function addSecurityCamera(scene: THREE.Scene, position: [number, number, number], rotationY: number) {
  const mount = box(scene, [0.18, 0.18, 0.18], position, 0x171717);
  mount.rotation.y = rotationY;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.24, 0.28),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.62 }),
  );
  body.position.set(position[0], position[1] - 0.04, position[2]);
  body.rotation.y = rotationY;
  scene.add(body);

  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.08, 16),
    new THREE.MeshStandardMaterial({ color: 0x65c7a2, roughness: 0.35, emissive: 0x102c24 }),
  );
  lens.position.set(
    position[0] + Math.sin(rotationY) * 0.22,
    position[1] - 0.04,
    position[2] + Math.cos(rotationY) * 0.22,
  );
  lens.rotation.x = Math.PI / 2;
  lens.rotation.z = -rotationY;
  scene.add(lens);
}

function addRedFolder(scene: THREE.Scene) {
  box(scene, [1.25, 0.12, 0.6], [2.9, 1.16, -4.22], 0x5a3c29);
  box(scene, [0.08, 0.78, 0.52], [2.32, 0.78, -4.22], 0x2f2018);
  box(scene, [0.08, 0.78, 0.52], [3.48, 0.78, -4.22], 0x2f2018);
  box(scene, [0.95, 0.08, 0.55], [2.9, 1.27, -4.2], 0xa51f24);
  const seal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.035, 24),
    new THREE.MeshStandardMaterial({ color: 0xd8a14b, roughness: 0.4 }),
  );
  seal.position.set(2.96, 1.33, -4.46);
  seal.rotation.x = Math.PI / 2;
  scene.add(seal);
  addLabel(scene, 'КРАСНАЯ ПАПКА', [2.9, 1.95, -4.18]);
}

function addFlashlightModel(scene: THREE.Scene) {
  box(scene, [0.52, 0.12, 0.18], [-1.05, 1.04, 0.52], 0x1b1a18);
  box(scene, [0.16, 0.15, 0.22], [-1.42, 1.04, 0.52], 0xd8a14b);
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.46, 24),
    new THREE.MeshStandardMaterial({ color: 0x3a3020, roughness: 0.55 }),
  );
  cone.position.set(-1.52, 1.04, 0.52);
  cone.rotation.z = Math.PI / 2;
  scene.add(cone);
  addLabel(scene, 'ФОНАРИК', [-1.18, 1.65, 0.5]);
}

function addCase417(scene: THREE.Scene) {
  box(scene, [1.05, 0.62, 0.72], [6.8, 0.35, 3.7], 0x9b6a38);
  box(scene, [1.12, 0.08, 0.78], [6.8, 0.72, 3.7], 0xc29b63);
  const number = labelSprite('№417');
  number.position.set(6.8, 0.8, 3.25);
  number.scale.set(0.8, 0.22, 1);
  scene.add(number);
  addLabel(scene, 'ДЕЛО №417', [6.8, 1.38, 3.7]);
}

function addSwitchAndExit(scene: THREE.Scene) {
  box(scene, [0.08, 0.5, 0.42], [8.76, 1.15, -0.7], 0xe1d2ae);
  box(scene, [0.1, 0.18, 0.12], [8.7, 1.17, -0.7], 0xd8a14b);
  addLabel(scene, 'СВЕТ', [8.3, 1.88, -0.7]);
  box(scene, [1.8, 2.2, 0.18], [0, 1.1, 5.28], 0x3c291d);
  box(scene, [1.55, 1.9, 0.08], [0, 1.05, 5.16], 0x1b120e);
  box(scene, [0.09, 0.09, 0.08], [0.62, 1.05, 5.04], 0xd8a14b);
  addLabel(scene, 'ВЫХОД', [0, 2.55, 4.95]);
}

function addTree(scene: THREE.Scene, x: number, z: number, scale = 1) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12 * scale, 0.18 * scale, 1.25 * scale, 10),
    new THREE.MeshStandardMaterial({ color: 0x4a2d1d, roughness: 0.9 }),
  );
  trunk.position.set(x, 0.62 * scale - 0.04, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const crownMaterial = new THREE.MeshStandardMaterial({ color: 0x213f2a, roughness: 0.86 });
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.62 * scale, 1.45 * scale, 12), crownMaterial);
  crown.position.set(x, 1.7 * scale, z);
  crown.castShadow = true;
  scene.add(crown);

  const crownTop = new THREE.Mesh(new THREE.ConeGeometry(0.42 * scale, 1.05 * scale, 12), crownMaterial);
  crownTop.position.set(x, 2.35 * scale, z);
  crownTop.castShadow = true;
  scene.add(crownTop);
}

function addOutside(scene: THREE.Scene) {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 28),
    new THREE.MeshStandardMaterial({ color: 0x172117, roughness: 0.96 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.03, 6.6);
  ground.receiveShadow = true;
  scene.add(ground);

  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(2.15, 17),
    new THREE.MeshStandardMaterial({ color: 0x6b5a42, roughness: 0.98 }),
  );
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, -0.015, 11.4);
  scene.add(path);

  const pathEdgeMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3324, roughness: 0.95 });
  [-1.25, 1.25].forEach((x) => {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 15.8), pathEdgeMaterial);
    edge.position.set(x, 0.02, 11.5);
    scene.add(edge);
  });

  [
    [-7.2, 7.5, 1.25],
    [-5.5, 10.8, 0.95],
    [-8.6, 13.7, 1.15],
    [-4.0, 15.6, 1.35],
    [5.4, 7.8, 1.05],
    [7.7, 10.6, 1.3],
    [4.4, 13.6, 0.92],
    [8.4, 16.0, 1.18],
    [-1.8, 17.8, 0.8],
    [2.2, 18.4, 0.9],
  ].forEach(([x, z, scale]) => addTree(scene, x, z, scale));

  const backTreeLine = new THREE.Mesh(
    new THREE.BoxGeometry(26, 2.2, 0.45),
    new THREE.MeshStandardMaterial({ color: 0x0e170f, roughness: 0.96 }),
  );
  backTreeLine.position.set(0, 1.1, 20.4);
  scene.add(backTreeLine);
}

function capsule(
  radius: number,
  length: number,
  color: number,
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
) {
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(radius, length, 8, 14),
    new THREE.MeshStandardMaterial({ color, roughness: 0.72 }),
  );
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  return mesh;
}

function createPerson(dark = false) {
  const group = new THREE.Group();
  const skin = dark ? 0x050403 : 0xc89f79;
  const coat = dark ? 0x050403 : 0x315783;
  const pants = dark ? 0x050403 : 0x2b2f3a;
  const shoes = dark ? 0x020202 : 0x0c0b0a;
  const badge = dark ? 0x111111 : 0xf1ddb0;

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 24, 18),
    new THREE.MeshStandardMaterial({ color: skin, roughness: 0.68 }),
  );
  head.position.set(0, 1.35, 0);
  head.castShadow = true;
  group.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.185, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: dark ? 0x020202 : 0x21140f, roughness: 0.9 }),
  );
  hair.position.set(0, 1.43, -0.01);
  group.add(hair);

  group.add(capsule(0.06, 0.08, skin, [0, 1.13, 0]));

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.68, 0.28),
    new THREE.MeshStandardMaterial({ color: coat, roughness: 0.78 }),
  );
  torso.position.set(0, 0.78, 0);
  torso.castShadow = true;
  group.add(torso);

  const badgeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.11, 0.018),
    new THREE.MeshStandardMaterial({ color: badge, roughness: 0.35, emissive: dark ? 0x000000 : 0x6b4a18 }),
  );
  badgeMesh.position.set(0.13, 0.92, 0.15);
  group.add(badgeMesh);

  const leftUpperArm = capsule(0.065, 0.48, coat, [-0.32, 0.8, 0], [0, 0, -0.2]);
  const rightUpperArm = capsule(0.065, 0.48, coat, [0.32, 0.8, 0], [0, 0, 0.2]);
  const leftLowerArm = capsule(0.055, 0.44, skin, [-0.37, 0.45, 0], [0, 0, -0.08]);
  const rightLowerArm = capsule(0.055, 0.44, skin, [0.37, 0.45, 0], [0, 0, 0.08]);
  const leftUpperLeg = capsule(0.075, 0.28, pants, [-0.13, 0.32, 0], [0.04, 0, 0.02]);
  const rightUpperLeg = capsule(0.075, 0.28, pants, [0.13, 0.32, 0], [-0.04, 0, -0.02]);
  const leftLowerLeg = capsule(0.07, 0.32, pants, [-0.13, -0.02, 0], [0.03, 0, 0.02]);
  const rightLowerLeg = capsule(0.07, 0.32, pants, [0.13, -0.02, 0], [-0.03, 0, -0.02]);
  const leftShoe = capsule(0.08, 0.16, shoes, [-0.13, -0.24, 0.08], [Math.PI / 2, 0, 0]);
  const rightShoe = capsule(0.08, 0.16, shoes, [0.13, -0.24, 0.08], [Math.PI / 2, 0, 0]);

  group.add(
    leftUpperArm,
    rightUpperArm,
    leftLowerArm,
    rightLowerArm,
    leftUpperLeg,
    rightUpperLeg,
    leftLowerLeg,
    rightLowerLeg,
    leftShoe,
    rightShoe,
  );
  group.userData.parts = {
    leftUpperArm,
    rightUpperArm,
    leftLowerArm,
    rightLowerArm,
    leftUpperLeg,
    rightUpperLeg,
    leftLowerLeg,
    rightLowerLeg,
    leftShoe,
    rightShoe,
  } satisfies AnimatedPersonParts;

  return group;
}

export function ThreeArchive({ player, lightOn, finalMode, fear, actionActive, actionTarget, onViewYawChange }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<THREE.Group | null>(null);
  const doubleRef = useRef<THREE.Group | null>(null);
  const playerTargetRef = useRef(new THREE.Vector3(0, personGroundY, 0));
  const lampRef = useRef<THREE.PointLight | null>(null);
  const playerLightRef = useRef<THREE.PointLight | null>(null);
  const flashlightRef = useRef<THREE.SpotLight | null>(null);
  const actionActiveRef = useRef(actionActive);
  const actionTargetRef = useRef<ActionTarget | null>(actionTarget);
  const cameraYawRef = useRef(0.28);
  const cameraPitchRef = useRef(0.72);
  const draggingRef = useRef(false);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const onPointerDown = (event: PointerEvent) => {
      draggingRef.current = true;
      pointerRef.current = { x: event.clientX, y: event.clientY };
      mount.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      const dx = event.clientX - pointerRef.current.x;
      const dy = event.clientY - pointerRef.current.y;
      pointerRef.current = { x: event.clientX, y: event.clientY };
      cameraYawRef.current -= dx * 0.006;
      cameraPitchRef.current = THREE.MathUtils.clamp(cameraPitchRef.current + dy * 0.003, 0.38, 1.05);
      onViewYawChange(cameraYawRef.current);
    };

    const onPointerUp = (event: PointerEvent) => {
      draggingRef.current = false;
      if (mount.hasPointerCapture(event.pointerId)) mount.releasePointerCapture(event.pointerId);
    };

    mount.addEventListener('pointerdown', onPointerDown);
    mount.addEventListener('pointermove', onPointerMove);
    mount.addEventListener('pointerup', onPointerUp);
    mount.addEventListener('pointercancel', onPointerUp);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0908);
    scene.fog = new THREE.Fog(0x0a0908, 9, 20);

    const camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 100);
    camera.position.set(0, 7.4, 8.9);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: window.devicePixelRatio <= 1.25,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = false;
    mount.appendChild(renderer.domElement);

    addOutside(scene);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 10.8),
      new THREE.MeshStandardMaterial({ color: 0x33251c, roughness: 0.92 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    box(scene, [18, 2.8, 0.25], [0, 1.4, -5.5], 0x241b16);
    box(scene, [18, 2.8, 0.25], [0, 1.4, 5.5], 0x241b16);
    box(scene, [0.25, 2.8, 10.8], [-9.1, 1.4, 0], 0x241b16);
    box(scene, [0.25, 2.8, 10.8], [9.1, 1.4, 0], 0x241b16);

    for (let row = 0; row < 4; row += 1) {
      box(scene, [0.38, 1.8, 2.8], [-6.7 + row * 0.74, 0.9, -2.4], 0x2f231b);
      box(scene, [0.38, 1.8, 2.8], [5.0 + row * 0.74, 0.9, -2.4], 0x2f231b);
      box(scene, [1.7, 0.08, 0.16], [-6.1, 0.55 + row * 0.38, -3.0], 0x6a4b32);
      box(scene, [1.7, 0.08, 0.16], [5.9, 0.55 + row * 0.38, -3.0], 0x6a4b32);
      box(scene, [0.1, 0.28, 0.55], [-6.5 + row * 0.4, 0.72 + row * 0.22, -2.0], 0x8a6a42);
      box(scene, [0.1, 0.28, 0.55], [5.4 + row * 0.4, 0.72 + row * 0.22, -2.0], 0x8a6a42);
    }

    addTable(scene);
    box(scene, [0.9, 0.06, 0.5], [-0.8, 1.0, 1.0], 0xd8c9a8);
    addFlashlightModel(scene);
    addCoffee(scene);
    addRedFolder(scene);
    addCameraStation(scene);
    addSecurityCamera(scene, [-7.8, 2.35, -4.9], Math.PI * 0.25);
    addSecurityCamera(scene, [7.8, 2.35, -4.9], -Math.PI * 0.25);
    addSecurityCamera(scene, [-7.8, 2.35, 4.9], Math.PI * 0.75);
    addSecurityCamera(scene, [7.8, 2.35, 4.9], -Math.PI * 0.75);
    addCase417(scene);
    addBoxes(scene);
    box(scene, [0.7, 0.85, 0.7], [-7.2, 0.42, -2.0], 0x4c4a43);
    addLabel(scene, 'УРНА', [-7.2, 1.4, -2.0]);
    addSwitchAndExit(scene);

    const playerGroup = createPerson();
    const initialPlayerPosition = toWorld(player);
    playerGroup.scale.setScalar(personScale);
    playerGroup.position.set(initialPlayerPosition.x, personGroundY, initialPlayerPosition.z);
    playerTargetRef.current.set(initialPlayerPosition.x, personGroundY, initialPlayerPosition.z);
    scene.add(playerGroup);
    playerRef.current = playerGroup;

    const doubleGroup = createPerson(true);
    doubleGroup.scale.setScalar(personScale);
    doubleGroup.position.set(0, personGroundY, -1.5);
    scene.add(doubleGroup);
    doubleRef.current = doubleGroup;

    const ambient = new THREE.AmbientLight(0x8a7356, 0.75);
    scene.add(ambient);

    const hemisphere = new THREE.HemisphereLight(0xc7a76f, 0x140f0b, 0.85);
    scene.add(hemisphere);

    const lamp = new THREE.PointLight(0xd8a14b, 5.0, 13);
    lamp.position.set(-1.8, 3.2, 1.0);
    scene.add(lamp);
    lampRef.current = lamp;

    const cameraGlow = new THREE.PointLight(0x7bb89b, 0.9, 5);
    cameraGlow.position.set(6.2, 1.8, 1.2);
    scene.add(cameraGlow);

    const redFolderGlow = new THREE.PointLight(0xbf2f2f, 1.2, 3.8);
    redFolderGlow.position.set(2.9, 1.95, -4.18);
    scene.add(redFolderGlow);

    const exitGlow = new THREE.PointLight(0xd8a14b, 1.1, 4.5);
    exitGlow.position.set(0, 2.2, 4.7);
    scene.add(exitGlow);

    const moonGlow = new THREE.DirectionalLight(0x9fb8c9, 1.2);
    moonGlow.position.set(-4, 7, 12);
    scene.add(moonGlow);

    const pathGlow = new THREE.PointLight(0x9fb8c9, 1.25, 10);
    pathGlow.position.set(0, 2.4, 9.8);
    scene.add(pathGlow);

    const playerLight = new THREE.PointLight(0xf1ddb0, 3.2, 5.2);
    playerLight.position.set(0, 1.5, 0);
    scene.add(playerLight);
    playerLightRef.current = playerLight;

    const flashlightTarget = new THREE.Object3D();
    flashlightTarget.position.set(0, 0.5, -4);
    scene.add(flashlightTarget);

    const flashlight = new THREE.SpotLight(0xf1ddb0, 0.2, 9, Math.PI / 7, 0.48, 1.2);
    flashlight.position.set(0, 1.1, 0.7);
    flashlight.target = flashlightTarget;
    scene.add(flashlight);
    flashlightRef.current = flashlight;

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight || width * 0.6;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    let frame = 0;
    let animation = 0;
    const cameraGoal = new THREE.Vector3();
    const animate = () => {
      frame += 0.016;
      if (playerRef.current) {
        const yaw = cameraYawRef.current;
        const bodyYaw = yaw + Math.PI;
        const targetPosition = playerTargetRef.current;
        const distanceToTarget = Math.hypot(
          playerRef.current.position.x - targetPosition.x,
          playerRef.current.position.z - targetPosition.z,
        );
        const walking = distanceToTarget > 0.025;
        const working = actionActiveRef.current && !walking;
        const bob = walking ? Math.abs(Math.sin(frame * 11)) * 0.07 : Math.sin(frame * 2.2) * 0.012;
        const stride = walking ? Math.sin(frame * 11) : 0;
        const leftKnee = walking ? Math.max(0, -stride) : 0;
        const rightKnee = walking ? Math.max(0, stride) : 0;
        const workMotion = working ? Math.sin(frame * 9) : 0;
        const pose = working ? actionPose(actionTargetRef.current, workMotion) : null;
        const parts = playerRef.current.userData.parts as AnimatedPersonParts;

        playerRef.current.position.lerp(targetPosition, 0.28);
        playerRef.current.position.y = personGroundY + bob;
        playerRef.current.rotation.y = bodyYaw + Math.sin(frame * 2.2) * 0.035;
        parts.leftUpperArm.rotation.set(pose ? pose.leftUpperArm : -stride * 0.65, 0, -0.2);
        parts.rightUpperArm.rotation.set(pose ? pose.rightUpperArm : stride * 0.65, 0, 0.2);
        parts.leftLowerArm.rotation.set(pose ? pose.leftLowerArm : -stride * 0.78 - 0.18, 0, -0.08);
        parts.rightLowerArm.rotation.set(pose ? pose.rightLowerArm : stride * 0.78 - 0.18, 0, 0.08);
        parts.leftUpperLeg.rotation.set(pose?.leftUpperLeg ?? 0.04 + stride * 0.72, 0, 0.02);
        parts.rightUpperLeg.rotation.set(pose?.rightUpperLeg ?? -0.04 - stride * 0.72, 0, -0.02);
        parts.leftLowerLeg.rotation.set(0.03 - stride * 0.32 - leftKnee * 0.72, 0, 0.02);
        parts.rightLowerLeg.rotation.set(-0.03 + stride * 0.32 - rightKnee * 0.72, 0, -0.02);
        parts.leftShoe.rotation.set(Math.PI / 2 - stride * 0.26 + leftKnee * 0.38, 0, 0);
        parts.rightShoe.rotation.set(Math.PI / 2 + stride * 0.26 + rightKnee * 0.38, 0, 0);
        const target = playerRef.current.position;
        const distance = 5.8;
        const pitch = cameraPitchRef.current;
        const horizontal = Math.cos(pitch) * distance;
        cameraGoal.set(
          target.x + Math.sin(yaw) * horizontal,
          1.6 + Math.sin(pitch) * distance,
          target.z + Math.cos(yaw) * horizontal,
        );
        camera.position.lerp(cameraGoal, 0.055);
        camera.lookAt(target.x, 1.2, target.z);
        playerLight.position.set(target.x, 2.1, target.z + 0.4);
        flashlight.position.set(target.x - Math.sin(yaw) * 0.25, 1.15, target.z - Math.cos(yaw) * 0.25);
        flashlightTarget.position.set(target.x - Math.sin(yaw) * 3.4, 0.65, target.z - Math.cos(yaw) * 3.4);
      }
      if (doubleRef.current) doubleRef.current.position.y = personGroundY + Math.sin(frame * 3) * 0.08;
      renderer.render(scene, camera);
      animation = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animation);
      observer.disconnect();
      mount.removeEventListener('pointerdown', onPointerDown);
      mount.removeEventListener('pointermove', onPointerMove);
      mount.removeEventListener('pointerup', onPointerUp);
      mount.removeEventListener('pointercancel', onPointerUp);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
      });
    };
  }, [onViewYawChange]);

  useEffect(() => {
    const world = toWorld(player);
    playerTargetRef.current.set(world.x, personGroundY, world.z);
  }, [player]);

  useEffect(() => {
    actionActiveRef.current = actionActive;
  }, [actionActive]);

  useEffect(() => {
    actionTargetRef.current = actionTarget;
  }, [actionTarget]);

  useEffect(() => {
    if (lampRef.current) {
      lampRef.current.intensity = lightOn ? 5.0 + fear / 70 : 0.65;
      lampRef.current.distance = lightOn ? 12 : 4;
    }
    if (flashlightRef.current) {
      flashlightRef.current.intensity = lightOn ? 0.12 : 3.2;
      flashlightRef.current.distance = lightOn ? 4 : 10;
    }
  }, [fear, lightOn]);

  useEffect(() => {
    if (doubleRef.current) doubleRef.current.visible = finalMode;
  }, [finalMode]);

  return <div className="three-archive" ref={mountRef} />;
}

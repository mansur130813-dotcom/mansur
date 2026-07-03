import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { roomSize, type DroppedItem, type HotspotId, type Point } from '../gameData';

type ActionTarget =
  | HotspotId
  | 'boxesUnpack'
  | 'deskSort'
  | 'deskOpen'
  | 'coffeeMirror'
  | 'shelvesDust'
  | 'hallListen'
  | 'cameraTune'
  | 'redSeal'
  | 'case417Read'
  | 'flashlightBeam'
  | 'incineratorBurn'
  | 'exitUnlock'
  | 'gateRun'
  | 'keyTake'
  | 'vacuumUnlock'
  | 'vacuumSuck';

type Props = {
  player: Point;
  lightOn: boolean;
  fear: number;
  coffeeDrunk: boolean;
  inventory: string[];
  ghostCabinetUnlocked: boolean;
  droppedItems: DroppedItem[];
  shadowPoint: Point;
  shadowVisible: boolean;
  shadowAttacking: boolean;
  actionActive: boolean;
  actionTarget: ActionTarget | null;
  onViewYawChange: (yaw: number) => void;
};

const personScale = 1.25;
const personGroundY = 0.32;

type Pose = {
  leftUpperArm: number;
  rightUpperArm: number;
  leftLowerArm: number;
  rightLowerArm: number;
  leftUpperLeg?: number;
  rightUpperLeg?: number;
  leftLowerLeg?: number;
  rightLowerLeg?: number;
  leftShoe?: number;
  rightShoe?: number;
  bodyLean?: number;
  bodyTwist?: number;
  headPitch?: number;
  headYaw?: number;
  lift?: number;
  groupPitch?: number;
  groupRoll?: number;
  yawOffset?: number;
};

type AnimatedPersonParts = {
  head: THREE.Mesh;
  torso: THREE.Mesh;
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

type FirstPersonHandsParts = {
  leftSleeve: THREE.Mesh;
  rightSleeve: THREE.Mesh;
  leftHand: THREE.Mesh;
  rightHand: THREE.Mesh;
};

function actionPose(target: ActionTarget | null, motion: number): Pose {
  switch (target) {
    case 'boxesUnpack':
      return {
        leftUpperArm: -1.48 + Math.abs(motion) * 0.42,
        rightUpperArm: -1.58 - motion * 0.32,
        leftLowerArm: -1.22 + motion * 0.28,
        rightLowerArm: -1.18 - Math.abs(motion) * 0.32,
        leftUpperLeg: 0.56,
        rightUpperLeg: 0.28,
        leftLowerLeg: -1.05,
        rightLowerLeg: -0.88,
        leftShoe: Math.PI / 2 + 0.35,
        rightShoe: Math.PI / 2 + 0.18,
        bodyLean: 0.68,
        headPitch: 0.34,
        lift: -0.18,
        groupPitch: 0.22,
      };
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
        leftUpperArm: -2.35 + Math.abs(motion) * 0.95,
        rightUpperArm: -2.35 + Math.abs(motion) * 0.95,
        leftLowerArm: -0.35 + motion * 0.34,
        rightLowerArm: -0.35 - motion * 0.34,
        leftUpperLeg: -0.08,
        rightUpperLeg: 0.08,
        bodyLean: -0.12,
        headPitch: -0.2,
        lift: 0.1 + Math.abs(motion) * 0.08,
        groupPitch: -0.08,
      };
    case 'deskOpen':
      return {
        leftUpperArm: -0.12,
        rightUpperArm: -1.55 - Math.abs(motion) * 0.35,
        leftLowerArm: -0.08,
        rightLowerArm: -0.92 + motion * 0.72,
        leftUpperLeg: 0.14,
        rightUpperLeg: -0.18,
        bodyLean: 0.28,
        bodyTwist: -0.75,
        headPitch: 0.46,
        headYaw: -0.5,
        groupRoll: -0.08,
      };
    case 'desk':
      return {
        leftUpperArm: -0.82 + motion * 0.15,
        rightUpperArm: -0.72 - motion * 0.15,
        leftLowerArm: -0.52 + motion * 0.18,
        rightLowerArm: -0.58 - motion * 0.18,
      };
    case 'coffeeMirror':
      return {
        leftUpperArm: 0.08,
        rightUpperArm: -2.05 + motion * 0.16,
        leftLowerArm: -0.24,
        rightLowerArm: -1.62 + Math.abs(motion) * 0.34,
        leftUpperLeg: -0.08,
        rightUpperLeg: -0.08,
        bodyLean: -0.28,
        bodyTwist: 0.22,
        headPitch: -0.62,
        headYaw: 0.32,
        lift: 0.04,
        groupPitch: -0.06,
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
        leftUpperArm: 0.1,
        rightUpperArm: -2.55 + motion * 0.18,
        leftLowerArm: 0.0,
        rightLowerArm: -0.18 + Math.abs(motion) * 0.34,
        leftUpperLeg: -0.18,
        rightUpperLeg: 0.18,
        bodyTwist: -0.92,
        headYaw: -0.7,
        lift: 0.14,
        groupRoll: 0.14,
      };
    case 'shelvesDust':
      return {
        leftUpperArm: -2.05 + motion * 0.55,
        rightUpperArm: -0.18 - motion * 0.16,
        leftLowerArm: -0.08 + Math.abs(motion) * 0.44,
        rightLowerArm: -0.16,
        leftUpperLeg: 0.18,
        rightUpperLeg: -0.26,
        bodyLean: 0.16,
        bodyTwist: 0.95,
        headYaw: 0.82,
        headPitch: -0.08,
        groupRoll: -0.06,
      };
    case 'shelves':
      return {
        leftUpperArm: -1.1 + motion * 0.14,
        rightUpperArm: -1.0 - motion * 0.14,
        leftLowerArm: -0.38,
        rightLowerArm: -0.42,
      };
    case 'hallListen':
      return {
        leftUpperArm: 0.12,
        rightUpperArm: -1.05 + motion * 0.08,
        leftLowerArm: -0.1,
        rightLowerArm: -2.05 + Math.abs(motion) * 0.12,
        leftUpperLeg: -0.04,
        rightUpperLeg: -0.04,
        bodyLean: -0.08,
        bodyTwist: -0.25,
        headYaw: -1.15,
        headPitch: -0.2,
        groupPitch: -0.04,
      };
    case 'hall':
      return {
        leftUpperArm: -0.4,
        rightUpperArm: -0.72 + motion * 0.08,
        leftLowerArm: -0.72,
        rightLowerArm: -1.18 + Math.abs(motion) * 0.1,
      };
    case 'cameraTune':
      return {
        leftUpperArm: -0.38 + motion * 0.46,
        rightUpperArm: -1.18 - motion * 0.52,
        leftLowerArm: -1.35 - motion * 0.28,
        rightLowerArm: -0.28 + motion * 0.38,
        leftUpperLeg: -0.1,
        rightUpperLeg: 0.12,
        bodyLean: 0.22,
        bodyTwist: motion * 0.75,
        headPitch: 0.18,
        headYaw: motion * 0.28,
      };
    case 'camera':
      return {
        leftUpperArm: -0.72 + motion * 0.18,
        rightUpperArm: -0.76 - motion * 0.18,
        leftLowerArm: -0.62 - motion * 0.2,
        rightLowerArm: -0.62 + motion * 0.2,
      };
    case 'redSeal':
      return {
        leftUpperArm: -1.72 + motion * 0.14,
        rightUpperArm: -1.72 - motion * 0.22,
        leftLowerArm: -1.36,
        rightLowerArm: -0.28 + Math.abs(motion) * 0.5,
        leftUpperLeg: 0.06,
        rightUpperLeg: -0.1,
        bodyLean: 0.36,
        bodyTwist: 0.18,
        headPitch: 0.68,
        headYaw: 0.2,
        groupPitch: 0.04,
      };
    case 'redFolder':
      return {
        leftUpperArm: -1.05 + motion * 0.1,
        rightUpperArm: -1.05 - motion * 0.1,
        leftLowerArm: -0.86,
        rightLowerArm: -0.86,
      };
    case 'case417Read':
      return {
        leftUpperArm: -1.45,
        rightUpperArm: -0.42 + motion * 0.82,
        leftLowerArm: -1.12,
        rightLowerArm: -0.18 - Math.abs(motion) * 0.55,
        leftUpperLeg: 0.22,
        rightUpperLeg: -0.28,
        bodyLean: 0.52,
        bodyTwist: 0.42,
        headPitch: 0.78,
        headYaw: 0.28,
        groupPitch: 0.1,
      };
    case 'case417':
      return {
        leftUpperArm: -0.95,
        rightUpperArm: -0.7 + motion * 0.22,
        leftLowerArm: -0.7,
        rightLowerArm: -0.42 - Math.abs(motion) * 0.22,
      };
    case 'flashlightBeam':
      return {
        leftUpperArm: 0.02,
        rightUpperArm: -1.82 + motion * 0.78,
        leftLowerArm: -0.06,
        rightLowerArm: -0.04 + motion * 0.42,
        leftUpperLeg: -0.16,
        rightUpperLeg: 0.2,
        bodyTwist: motion * 1.05,
        headYaw: motion * 0.92,
        headPitch: -0.12,
        groupRoll: motion * 0.08,
      };
    case 'flashlight':
      return {
        leftUpperArm: -0.35,
        rightUpperArm: -1.0 + motion * 0.18,
        leftLowerArm: -0.2,
        rightLowerArm: -0.3 + motion * 0.15,
      };
    case 'incineratorBurn':
      return {
        leftUpperArm: -1.7 + motion * 0.18,
        rightUpperArm: -1.82 - motion * 0.18,
        leftLowerArm: -1.45,
        rightLowerArm: -1.5,
        leftUpperLeg: 0.62,
        rightUpperLeg: 0.36,
        leftLowerLeg: -1.18,
        rightLowerLeg: -0.92,
        leftShoe: Math.PI / 2 + 0.42,
        rightShoe: Math.PI / 2 + 0.28,
        bodyLean: 0.86,
        headPitch: 0.6,
        lift: -0.22,
        groupPitch: 0.3,
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
    case 'exitUnlock':
      return {
        leftUpperArm: -0.22,
        rightUpperArm: -1.28 + motion * 0.82,
        leftLowerArm: -0.08,
        rightLowerArm: 0.05 + motion * 0.72,
        leftUpperLeg: -0.22,
        rightUpperLeg: 0.24,
        bodyTwist: -0.9,
        headYaw: -0.62,
        bodyLean: 0.12,
        groupRoll: 0.1,
      };
    case 'exit':
      return {
        leftUpperArm: -0.2,
        rightUpperArm: -0.86 + motion * 0.28,
        leftLowerArm: -0.1,
        rightLowerArm: -0.18 + motion * 0.3,
      };
    case 'gateRun':
      return {
        leftUpperArm: -0.82 - motion * 1.1,
        rightUpperArm: -0.82 + motion * 1.1,
        leftLowerArm: -0.55 - Math.abs(motion) * 0.42,
        rightLowerArm: -0.55 - Math.abs(motion) * 0.42,
        leftUpperLeg: motion * 1.05,
        rightUpperLeg: -motion * 1.05,
        leftLowerLeg: -0.35 - Math.max(0, -motion) * 0.9,
        rightLowerLeg: -0.35 - Math.max(0, motion) * 0.9,
        leftShoe: Math.PI / 2 - motion * 0.35,
        rightShoe: Math.PI / 2 + motion * 0.35,
        bodyLean: 0.36,
        headPitch: -0.18,
        groupPitch: 0.12,
        lift: Math.abs(motion) * 0.08,
      };
    case 'keyTake':
      return {
        leftUpperArm: -0.24,
        rightUpperArm: -1.72 + motion * 0.22,
        leftLowerArm: -0.18,
        rightLowerArm: -1.45 + Math.abs(motion) * 0.55,
        leftUpperLeg: 0.1,
        rightUpperLeg: -0.18,
        bodyLean: 0.22,
        bodyTwist: -0.42,
        headPitch: 0.35,
        headYaw: -0.32,
        groupRoll: 0.04,
      };
    case 'vacuumUnlock':
      return {
        leftUpperArm: -1.18 - Math.abs(motion) * 0.34,
        rightUpperArm: -1.62 + motion * 0.42,
        leftLowerArm: -1.15,
        rightLowerArm: -0.28 + Math.abs(motion) * 0.7,
        leftUpperLeg: 0.18,
        rightUpperLeg: -0.22,
        bodyLean: 0.36,
        bodyTwist: -0.62,
        headPitch: 0.42,
        headYaw: -0.45,
        lift: Math.abs(motion) * 0.03,
      };
    case 'vacuumSuck':
      return {
        leftUpperArm: -1.28 + motion * 0.18,
        rightUpperArm: -1.32 - motion * 0.18,
        leftLowerArm: -1.5,
        rightLowerArm: -1.5,
        leftUpperLeg: 0.42,
        rightUpperLeg: -0.42,
        leftLowerLeg: -0.45,
        rightLowerLeg: -0.35,
        bodyLean: -0.22 + Math.abs(motion) * 0.1,
        bodyTwist: motion * 0.18,
        headPitch: -0.12,
        lift: Math.abs(motion) * 0.04,
        groupPitch: -0.12,
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
    x: (point.x / roomSize.width - 0.5) * 22,
    z: (point.y / roomSize.height - 0.5) * 13.2,
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

function transparentBox(
  scene: THREE.Scene,
  size: [number, number, number],
  position: [number, number, number],
  color: number,
  opacity: number,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }),
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

function addLabel(_scene: THREE.Scene, _text: string, _position: [number, number, number]) {
  // Labels are intentionally hidden so objects stay visible without floating text.
}

function addTable(scene: THREE.Scene) {
  box(scene, [2.85, 0.28, 1.18], [-1.22, 0.72, -1.95], 0x7a4f2f).castShadow = true;
  box(scene, [0.18, 0.85, 0.18], [-2.28, 0.3, -2.38], 0x3a2418);
  box(scene, [0.18, 0.85, 0.18], [-0.16, 0.3, -2.38], 0x3a2418);
  box(scene, [0.18, 0.85, 0.18], [-2.28, 0.3, -1.52], 0x3a2418);
  box(scene, [0.18, 0.85, 0.18], [-0.16, 0.3, -1.52], 0x3a2418);
  addLabel(scene, 'СТОЛ', [0.0, 1.42, 1.25]);
}

function addCoffee(scene: THREE.Scene) {
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.15, 0.24, 24),
    new THREE.MeshStandardMaterial({ color: 0xe1d2ae, roughness: 0.55 }),
  );
  cup.position.set(-0.62, 0.98, -1.9);
  scene.add(cup);
  const coffee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.02, 24),
    new THREE.MeshStandardMaterial({ color: 0x2a1510, roughness: 0.4 }),
  );
  coffee.position.set(-0.62, 1.11, -1.9);
  scene.add(coffee);
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.025, 8, 18, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xe1d2ae, roughness: 0.55 }),
  );
  handle.position.set(-0.44, 1.0, -1.9);
  handle.rotation.z = Math.PI / 2;
  scene.add(handle);
  addLabel(scene, 'КОФЕ', [0.82, 1.48, 1.38]);
  return coffee;
}

function addBoxes(scene: THREE.Scene) {
  box(scene, [1.0, 0.55, 0.72], [-5.2, 0.28, 4.35], 0xa36e35);
  box(scene, [0.86, 0.48, 0.62], [-5.75, 0.78, 4.07], 0x8b5a2b);
  box(scene, [0.82, 0.42, 0.58], [-4.8, 0.74, 3.85], 0xb57c3c);
  box(scene, [0.86, 0.04, 0.04], [-5.2, 0.58, 4.35], 0x2f2016);
  addLabel(scene, 'КОРОБКИ', [-5.25, 1.45, 4.15]);
}

function addCameraStation(scene: THREE.Scene) {
  box(scene, [1.25, 0.78, 0.12], [5.15, 0.95, 4.25], 0x183831);
  box(scene, [1.05, 0.55, 0.04], [5.15, 0.95, 4.17], 0x5bb494);
  box(scene, [0.45, 0.18, 0.4], [5.15, 0.32, 4.53], 0x181615);
  box(scene, [0.12, 0.5, 0.12], [5.15, 0.62, 4.47], 0x181615);
  box(scene, [0.5, 0.22, 0.32], [6.2, 1.78, -4.88], 0x111111);
  box(scene, [0.14, 0.14, 0.3], [6.2, 1.78, -4.62], 0x333333);
  addLabel(scene, 'КАМЕРЫ', [5.15, 1.72, 4.2]);
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
  const folderX = 1.9;

  box(scene, [1.25, 0.12, 0.6], [folderX, 1.16, -4.8], 0x5a3c29);
  box(scene, [0.08, 0.78, 0.52], [folderX - 0.58, 0.78, -4.8], 0x2f2018);
  box(scene, [0.08, 0.78, 0.52], [folderX + 0.58, 0.78, -4.8], 0x2f2018);
  box(scene, [0.95, 0.08, 0.55], [folderX, 1.27, -4.78], 0xa51f24);
  const seal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.035, 24),
    new THREE.MeshStandardMaterial({ color: 0xd8a14b, roughness: 0.4 }),
  );
  seal.position.set(folderX + 0.06, 1.33, -5.04);
  seal.rotation.x = Math.PI / 2;
  scene.add(seal);
  addLabel(scene, 'КРАСНАЯ ПАПКА', [folderX, 1.95, -4.77]);
}

function addFlashlightModel(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.position.set(-1.95, 0.98, -1.9);
  scene.add(group);

  box(group as unknown as THREE.Scene, [0.52, 0.12, 0.18], [0, 0, 0], 0x1b1a18);
  box(group as unknown as THREE.Scene, [0.16, 0.15, 0.22], [-0.25, 0, 0], 0xd8a14b);
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.46, 24),
    new THREE.MeshStandardMaterial({ color: 0x3a3020, roughness: 0.55 }),
  );
  cone.position.set(-0.34, 0, 0);
  cone.rotation.z = Math.PI / 2;
  group.add(cone);
  addLabel(scene, 'ФОНАРИК', [-2.12, 1.48, -3.9]);
  return group;
}

function addCase417(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.position.set(7.25, 0.35, 4.0);
  scene.add(group);

  box(group as unknown as THREE.Scene, [1.05, 0.62, 0.72], [0, 0, 0], 0x9b6a38);
  box(group as unknown as THREE.Scene, [1.12, 0.08, 0.78], [0, 0.37, 0], 0xc29b63);
  const number = labelSprite('№417');
  number.position.set(0, 0.47, -0.42);
  number.scale.set(0.95, 0.26, 1);
  group.add(number);
  return group;
}

function addSwitchAndExit(scene: THREE.Scene) {
  box(scene, [0.08, 0.5, 0.42], [10.86, 1.55, 3.25], 0xe1d2ae);
  box(scene, [0.1, 0.18, 0.12], [10.78, 1.57, 3.25], 0xd8a14b);
  addLabel(scene, 'СВЕТ', [10.35, 2.25, 3.25]);
  box(scene, [0.18, 2.2, 0.24], [-0.9, 1.1, 6.56], 0x3c291d);
  box(scene, [0.18, 2.2, 0.24], [0.9, 1.1, 6.56], 0x3c291d);
  box(scene, [1.98, 0.24, 0.24], [0, 2.18, 6.56], 0x3c291d);
  box(scene, [1.98, 0.12, 0.24], [0, 0.06, 6.56], 0x3c291d);

  const doorPivot = new THREE.Group();
  doorPivot.position.set(-0.78, 0, 6.44);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 1.9, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x1b120e, roughness: 0.82 }),
  );
  door.position.set(0.78, 1.05, 0);
  door.castShadow = true;
  doorPivot.add(door);

  const inset = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 1.42, 0.025),
    new THREE.MeshStandardMaterial({ color: 0x2f2119, roughness: 0.86 }),
  );
  inset.position.set(0.78, 1.08, -0.055);
  doorPivot.add(inset);

  const handle = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xd8a14b, roughness: 0.38, metalness: 0.2 }),
  );
  handle.position.set(1.4, 1.05, -0.09);
  handle.castShadow = true;
  doorPivot.add(handle);

  scene.add(doorPivot);
  addLabel(scene, 'ВЫХОД', [0, 2.55, 6.25]);
  return doorPivot;
}

function addRoomDoor(scene: THREE.Scene, x: number, opensLeft: boolean) {
  const doorPivot = new THREE.Group();
  doorPivot.position.set(x, 0, -0.95);
  doorPivot.userData.opensLeft = opensLeft;

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 2.35, 1.95),
    new THREE.MeshStandardMaterial({ color: 0x24150f, roughness: 0.82 }),
  );
  door.position.set(0, 1.175, 0.975);
  door.castShadow = true;
  doorPivot.add(door);

  const inset = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 1.72, 1.46),
    new THREE.MeshStandardMaterial({ color: 0x35231a, roughness: 0.86 }),
  );
  inset.position.set(opensLeft ? 0.06 : -0.06, 1.24, 1.0);
  doorPivot.add(inset);

  const handle = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xd8a14b, roughness: 0.38, metalness: 0.18 }),
  );
  handle.position.set(opensLeft ? 0.09 : -0.09, 1.08, 1.58);
  doorPivot.add(handle);

  scene.add(doorPivot);
  return doorPivot;
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

function addWhiteGate(scene: THREE.Scene) {
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f0e6, roughness: 0.42, metalness: 0.05 });
  const shadow = new THREE.MeshStandardMaterial({ color: 0xb8b4a8, roughness: 0.6 });

  [-5.15, 5.15].forEach((centerX) => {
    const topFence = new THREE.Mesh(new THREE.BoxGeometry(6.95, 0.14, 0.14), white);
    topFence.position.set(centerX, 1.62, 21.82);
    scene.add(topFence);

    const bottomFence = new THREE.Mesh(new THREE.BoxGeometry(6.95, 0.12, 0.12), shadow);
    bottomFence.position.set(centerX, 0.82, 21.82);
    scene.add(bottomFence);

    [-3.0, -1.5, 0, 1.5, 3.0].forEach((offset) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.85, 0.16), white);
      post.position.set(centerX + offset, 0.92, 21.82);
      post.castShadow = true;
      scene.add(post);
    });
  });

  [-1.35, 1.35].forEach((x) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.15, 0.18), white);
    post.position.set(x, 1.05, 21.8);
    post.castShadow = true;
    scene.add(post);
  });

  const topRail = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.16, 0.16), white);
  topRail.position.set(0, 1.9, 21.8);
  scene.add(topRail);

  const bottomRail = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.12, 0.14), shadow);
  bottomRail.position.set(0, 0.72, 21.8);
  scene.add(bottomRail);

  [-0.84, -0.42, 0, 0.42, 0.84].forEach((x) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.45, 0.12), white);
    bar.position.set(x, 1.2, 21.8);
    scene.add(bar);
  });

  const openLeft = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.55, 0.08), white);
  openLeft.position.set(-1.05, 1.18, 21.15);
  openLeft.rotation.y = -0.72;
  scene.add(openLeft);

  const openRight = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.55, 0.08), white);
  openRight.position.set(1.05, 1.18, 21.15);
  openRight.rotation.y = 0.72;
  scene.add(openRight);

  addLabel(scene, 'WHITE GATE', [0, 2.65, 21.25]);
}

function addOutsideKeyShelf(scene: THREE.Scene) {
  box(scene, [0.9, 0.08, 0.45], [2.05, 0.82, 13.0], 0x6a4b32);
  box(scene, [0.08, 0.72, 0.5], [1.58, 0.48, 13.0], 0x3a2418);
  box(scene, [0.08, 0.72, 0.5], [2.52, 0.48, 13.0], 0x3a2418);
  box(scene, [0.78, 0.5, 0.05], [2.05, 0.62, 13.22], 0x4a3324);

  const keyGroup = new THREE.Group();
  keyGroup.position.set(2.02, 0.93, 12.92);
  scene.add(keyGroup);

  const key = new THREE.Mesh(
    new THREE.TorusGeometry(0.1, 0.025, 10, 20),
    new THREE.MeshStandardMaterial({ color: 0xd8a14b, roughness: 0.35, metalness: 0.35 }),
  );
  key.rotation.x = Math.PI / 2;
  keyGroup.add(key);
  box(keyGroup as unknown as THREE.Scene, [0.28, 0.035, 0.055], [0.18, 0, 0], 0xd8a14b);
  addLabel(scene, 'KEY', [2.05, 1.45, 12.9]);
  return keyGroup;
}

function addGhostVacuumCabinet(scene: THREE.Scene) {
  box(scene, [0.1, 1.7, 1.36], [-10.98, 1.48, 0.15], 0x1f1510);
  box(scene, [0.58, 0.12, 1.42], [-10.68, 2.28, 0.15], 0x3a2418);
  box(scene, [0.58, 0.12, 1.42], [-10.68, 0.68, 0.15], 0x3a2418);
  box(scene, [0.58, 1.7, 0.1], [-10.68, 1.48, -0.58], 0x3a2418);
  box(scene, [0.58, 1.7, 0.1], [-10.68, 1.48, 0.88], 0x3a2418);
  box(scene, [0.5, 0.08, 1.18], [-10.68, 1.2, 0.15], 0x5a3c29);

  const vacuumGroup = new THREE.Group();
  vacuumGroup.position.set(-10.72, 1.48, 0.12);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.27, 0.66, 18),
    new THREE.MeshStandardMaterial({ color: 0x2c5f78, roughness: 0.58, metalness: 0.12 }),
  );
  body.rotation.z = Math.PI / 2;
  vacuumGroup.add(body);

  const nozzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.078, 0.58, 14),
    new THREE.MeshStandardMaterial({ color: 0xd8a14b, roughness: 0.4, metalness: 0.25 }),
  );
  nozzle.position.set(0, 0, -0.48);
  nozzle.rotation.x = Math.PI / 2;
  vacuumGroup.add(nozzle);

  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.028, 10, 22, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x181615, roughness: 0.5 }),
  );
  handle.position.set(0.02, 0.24, 0.05);
  handle.rotation.z = Math.PI;
  vacuumGroup.add(handle);

  const tank = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 18, 14),
    new THREE.MeshStandardMaterial({ color: 0x8fd7ff, roughness: 0.25, transparent: true, opacity: 0.68 }),
  );
  tank.position.set(0.08, 0.02, 0.35);
  vacuumGroup.add(tank);
  scene.add(vacuumGroup);

  const doorPivot = new THREE.Group();
  doorPivot.position.set(-10.36, 0.76, -0.58);
  const glassDoor = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 1.48, 1.2),
    new THREE.MeshStandardMaterial({
      color: 0x9fd4ff,
      roughness: 0.14,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );
  glassDoor.position.set(0, 0.72, 0.6);
  doorPivot.add(glassDoor);

  const lockBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.18, 0.16),
    new THREE.MeshStandardMaterial({ color: 0xd8a14b, roughness: 0.35, metalness: 0.35 }),
  );
  lockBody.position.set(-0.045, 0.72, 0.18);
  doorPivot.add(lockBody);

  const lockShackle = new THREE.Mesh(
    new THREE.TorusGeometry(0.09, 0.016, 8, 18, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xd8a14b, roughness: 0.3, metalness: 0.45 }),
  );
  lockShackle.position.set(-0.05, 0.85, 0.18);
  lockShackle.rotation.z = Math.PI;
  doorPivot.add(lockShackle);

  const keyHole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.012, 12),
    new THREE.MeshStandardMaterial({ color: 0x18110d, roughness: 0.5 }),
  );
  keyHole.position.set(-0.09, 0.71, 0.18);
  keyHole.rotation.z = Math.PI / 2;
  doorPivot.add(keyHole);
  scene.add(doorPivot);

  addLabel(scene, 'GHOST VACUUM', [-10.2, 2.55, 0.15]);
  return { door: doorPivot, vacuum: vacuumGroup };
}

function createDroppedItemModel(item: string) {
  const group = new THREE.Group();

  if (item === 'Ключ от стеклянной полки') {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.025, 10, 22),
      new THREE.MeshStandardMaterial({ color: 0xd8a14b, roughness: 0.35, metalness: 0.35 }),
    );
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    box(group as unknown as THREE.Scene, [0.32, 0.035, 0.055], [0.2, 0, 0], 0xd8a14b);
  } else if (item === 'Пылесос для привидений') {
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.22, 0.52, 16),
      new THREE.MeshStandardMaterial({ color: 0x2c5f78, roughness: 0.58, metalness: 0.12 }),
    );
    body.rotation.z = Math.PI / 2;
    group.add(body);

    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.06, 0.46, 12),
      new THREE.MeshStandardMaterial({ color: 0xd8a14b, roughness: 0.4, metalness: 0.25 }),
    );
    nozzle.position.set(0, 0, -0.38);
    nozzle.rotation.x = Math.PI / 2;
    group.add(nozzle);
  } else {
    box(group as unknown as THREE.Scene, [0.42, 0.06, 0.3], [0, 0, 0], 0xd8c9a8);
  }

  return group;
}

function addOutside(scene: THREE.Scene) {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 38),
    new THREE.MeshStandardMaterial({ color: 0x172117, roughness: 0.96 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.03, 11.8);
  ground.receiveShadow = true;
  scene.add(ground);

  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(2.35, 26),
    new THREE.MeshStandardMaterial({ color: 0x6b5a42, roughness: 0.98 }),
  );
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, -0.015, 16.0);
  scene.add(path);

  const pathEdgeMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3324, roughness: 0.95 });
  [-1.25, 1.25].forEach((x) => {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 25.0), pathEdgeMaterial);
    edge.position.set(x, 0.02, 16.0);
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
    [-7.4, 19.6, 1.08],
    [6.8, 19.8, 1.22],
    [-4.8, 22.2, 0.92],
    [4.9, 22.4, 1.02],
    [-8.8, 24.7, 1.28],
    [8.5, 25.0, 1.18],
  ].forEach(([x, z, scale]) => addTree(scene, x, z, scale));

  const backTreeLine = new THREE.Mesh(
    new THREE.BoxGeometry(30, 2.4, 0.45),
    new THREE.MeshStandardMaterial({ color: 0x0e170f, roughness: 0.96 }),
  );
  backTreeLine.position.set(0, 1.2, 28.4);
  scene.add(backTreeLine);
  addWhiteGate(scene);
  return { key: addOutsideKeyShelf(scene) };
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
  const makePersonMaterial = (color: number, roughness: number, emissive = 0x000000) =>
    new THREE.MeshStandardMaterial({ color, roughness, emissive });
  const skin = dark ? 0x050403 : 0xc89f79;
  const coat = dark ? 0x050403 : 0x315783;
  const pants = dark ? 0x050403 : 0x2b2f3a;
  const shoes = dark ? 0x020202 : 0x0c0b0a;
  const badge = dark ? 0x111111 : 0xf1ddb0;

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 24, 18),
    makePersonMaterial(skin, 0.68),
  );
  head.position.set(0, 1.35, 0);
  head.castShadow = true;
  group.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.185, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    makePersonMaterial(dark ? 0x020202 : 0x21140f, 0.9),
  );
  hair.position.set(0, 1.43, -0.01);
  group.add(hair);

  group.add(capsule(0.06, 0.08, skin, [0, 1.13, 0]));

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.68, 0.28),
    makePersonMaterial(coat, 0.78),
  );
  torso.position.set(0, 0.78, 0);
  torso.castShadow = true;
  group.add(torso);

  const badgeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.11, 0.018),
    makePersonMaterial(badge, 0.35, dark ? 0x000000 : 0x6b4a18),
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
    head,
    torso,
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

function createFirstPersonHands() {
  const group = new THREE.Group();
  group.visible = false;

  const sleeveMaterial = new THREE.MeshStandardMaterial({ color: 0x315783, roughness: 0.78 });
  const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xc89f79, roughness: 0.68 });

  const leftSleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.46, 8, 12), sleeveMaterial);
  const rightSleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.46, 8, 12), sleeveMaterial);
  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), skinMaterial);
  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), skinMaterial);

  leftSleeve.position.set(-0.22, -0.28, -0.54);
  rightSleeve.position.set(0.22, -0.28, -0.54);
  leftHand.position.set(-0.25, -0.44, -0.82);
  rightHand.position.set(0.25, -0.44, -0.82);
  leftSleeve.rotation.set(1.05, 0.18, -0.25);
  rightSleeve.rotation.set(1.05, -0.18, 0.25);

  group.add(leftSleeve, rightSleeve, leftHand, rightHand);
  group.userData.parts = { leftSleeve, rightSleeve, leftHand, rightHand } satisfies FirstPersonHandsParts;
  return group;
}

function updateFirstPersonHands(group: THREE.Group, target: ActionTarget | null, motion: number) {
  const parts = group.userData.parts as FirstPersonHandsParts;
  const beat = Math.abs(motion);
  const shake = Math.sin(motion * 2.1);

  group.visible = true;
  group.position.set(0, 0, 0);
  group.rotation.set(0, 0, 0);

  parts.leftSleeve.position.set(-0.22, -0.29, -0.54);
  parts.rightSleeve.position.set(0.22, -0.29, -0.54);
  parts.leftHand.position.set(-0.25, -0.45, -0.82);
  parts.rightHand.position.set(0.25, -0.45, -0.82);
  parts.leftSleeve.rotation.set(1.05, 0.18, -0.25);
  parts.rightSleeve.rotation.set(1.05, -0.18, 0.25);

  switch (target) {
    case 'boxesUnpack':
    case 'boxes':
      parts.leftHand.position.set(-0.34, -0.33 + beat * 0.1, -0.82 - beat * 0.22);
      parts.rightHand.position.set(0.34, -0.31 - beat * 0.08, -0.82 - beat * 0.2);
      parts.leftSleeve.rotation.set(1.35 + beat * 0.22, 0.3, -0.46);
      parts.rightSleeve.rotation.set(1.35 - beat * 0.16, -0.3, 0.46);
      break;
    case 'switch':
      parts.leftHand.position.set(-0.28, -0.5, -0.72);
      parts.rightHand.position.set(0.36, -0.05 + motion * 0.04, -0.92);
      parts.rightSleeve.rotation.set(1.95, -0.45, 0.18 + beat * 0.18);
      break;
    case 'deskSort':
      parts.leftHand.position.set(-0.28, -0.34 + beat * 0.28, -0.92);
      parts.rightHand.position.set(0.28, -0.34 + beat * 0.28, -0.92);
      parts.leftSleeve.rotation.set(1.7 - beat * 0.35, 0.2, -0.2);
      parts.rightSleeve.rotation.set(1.7 - beat * 0.35, -0.2, 0.2);
      break;
    case 'deskOpen':
    case 'case417Read':
      parts.leftHand.position.set(-0.32, -0.44, -0.86);
      parts.rightHand.position.set(0.12 + motion * 0.14, -0.33, -0.95);
      parts.rightSleeve.rotation.set(1.55, -0.22 + motion * 0.22, 0.12);
      break;
    case 'coffeeMirror':
    case 'coffee':
      parts.leftHand.position.set(-0.3, -0.5, -0.76);
      parts.rightHand.position.set(0.16, -0.12 - beat * 0.08, -0.62);
      parts.rightSleeve.rotation.set(2.25, -0.12, 0.12);
      break;
    case 'hallListen':
    case 'hall':
      parts.leftHand.position.set(-0.47, -0.12 + shake * 0.02, -0.42);
      parts.rightHand.position.set(0.28, -0.48, -0.75);
      parts.leftSleeve.rotation.set(2.15, 0.58, -0.7);
      break;
    case 'cameraTune':
    case 'camera':
      parts.leftHand.position.set(-0.32 + motion * 0.05, -0.28, -0.92);
      parts.rightHand.position.set(0.32 - motion * 0.05, -0.28, -0.92);
      parts.leftSleeve.rotation.set(1.42, 0.38, -0.28 + motion * 0.16);
      parts.rightSleeve.rotation.set(1.42, -0.38, 0.28 - motion * 0.16);
      break;
    case 'redSeal':
    case 'redFolder':
      parts.leftHand.position.set(-0.16, -0.31, -0.96);
      parts.rightHand.position.set(0.16 + motion * 0.08, -0.31, -0.96);
      parts.leftSleeve.rotation.set(1.5, 0.08, -0.12);
      parts.rightSleeve.rotation.set(1.55, -0.08, 0.12 + beat * 0.2);
      break;
    case 'flashlightBeam':
    case 'flashlight':
      parts.leftHand.position.set(-0.14, -0.31, -0.84);
      parts.rightHand.position.set(0.14, -0.31, -0.84);
      parts.leftSleeve.rotation.set(1.28, 0.05, -0.08);
      parts.rightSleeve.rotation.set(1.28, -0.05, 0.08);
      break;
    case 'keyTake':
      parts.leftHand.position.set(-0.28, -0.48, -0.78);
      parts.rightHand.position.set(0.1 + motion * 0.12, -0.26 - beat * 0.06, -0.9);
      parts.rightSleeve.rotation.set(1.72, -0.1, 0.24 + beat * 0.28);
      break;
    case 'vacuumUnlock':
      parts.leftHand.position.set(-0.22, -0.3, -0.86);
      parts.rightHand.position.set(0.24 + Math.sin(motion * 3) * 0.06, -0.24, -0.88);
      parts.rightSleeve.rotation.set(1.66, -0.28, 0.45 + Math.sin(motion * 3) * 0.35);
      break;
    case 'vacuumSuck':
      group.position.set(shake * 0.025, beat * 0.025, 0);
      parts.leftHand.position.set(-0.26, -0.22 + motion * 0.03, -1.02);
      parts.rightHand.position.set(0.26, -0.22 - motion * 0.03, -1.02);
      parts.leftSleeve.rotation.set(1.72, 0.18, -0.2 + shake * 0.15);
      parts.rightSleeve.rotation.set(1.72, -0.18, 0.2 - shake * 0.15);
      break;
    default:
      parts.leftHand.position.set(-0.26, -0.38 + beat * 0.08, -0.84);
      parts.rightHand.position.set(0.26, -0.38 - beat * 0.08, -0.84);
      break;
  }
}

function createShadowSuctionEffect() {
  const group = new THREE.Group();
  group.visible = false;

  for (let index = 0; index < 11; index += 1) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(0.18 + index * 0.015, 12, 8),
      new THREE.MeshBasicMaterial({
        color: index % 2 === 0 ? 0x020202 : 0x17110f,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
    );
    puff.userData.phase = index * 0.57;
    group.add(puff);
  }

  const core = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 1.7, 18, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x030202,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  core.rotation.x = Math.PI / 2;
  group.add(core);
  group.userData.core = core;

  return group;
}

export function ThreeArchive({
  player,
  lightOn,
  fear,
  coffeeDrunk,
  inventory,
  ghostCabinetUnlocked,
  droppedItems,
  shadowPoint,
  shadowVisible,
  shadowAttacking,
  actionActive,
  actionTarget,
  onViewYawChange,
}: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<THREE.Group | null>(null);
  const doubleRef = useRef<THREE.Group | null>(null);
  const firstPersonHandsRef = useRef<THREE.Group | null>(null);
  const shadowSuctionRef = useRef<THREE.Group | null>(null);
  const playerTargetRef = useRef(new THREE.Vector3(0, personGroundY, 0));
  const lampRef = useRef<THREE.PointLight | null>(null);
  const playerLightRef = useRef<THREE.PointLight | null>(null);
  const flashlightRef = useRef<THREE.SpotLight | null>(null);
  const coffeeLiquidRef = useRef<THREE.Object3D | null>(null);
  const exitDoorRef = useRef<THREE.Group | null>(null);
  const roomDoorsRef = useRef<THREE.Group[]>([]);
  const ghostCabinetDoorRef = useRef<THREE.Group | null>(null);
  const ghostVacuumRef = useRef<THREE.Group | null>(null);
  const sourceItemRefs = useRef<Record<string, THREE.Object3D | null>>({});
  const droppedLayerRef = useRef<THREE.Group | null>(null);
  const actionActiveRef = useRef(actionActive);
  const actionTargetRef = useRef<ActionTarget | null>(actionTarget);
  const shadowPointRef = useRef(shadowPoint);
  const shadowVisibleRef = useRef(shadowVisible);
  const shadowAttackingRef = useRef(shadowAttacking);
  const hasGhostKeyRef = useRef(inventory.includes('Ключ от стеклянной полки'));
  const hasGhostVacuumRef = useRef(inventory.includes('Пылесос для привидений'));
  const ghostCabinetUnlockedRef = useRef(ghostCabinetUnlocked);
  const exitDoorOpenedRef = useRef(false);
  const cameraYawRef = useRef(0.28);
  const cameraPitchRef = useRef(0);
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
      cameraPitchRef.current = THREE.MathUtils.clamp(cameraPitchRef.current + dy * 0.0025, -0.72, 0.72);
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

    const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.08, 100);
    camera.position.set(0, 1.3, 0);
    camera.lookAt(0, 0, 0);
    scene.add(camera);

    const firstPersonHands = createFirstPersonHands();
    camera.add(firstPersonHands);
    firstPersonHandsRef.current = firstPersonHands;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = false;
    mount.appendChild(renderer.domElement);

    const outside = addOutside(scene);
    sourceItemRefs.current['Ключ от стеклянной полки'] = outside.key;

    const droppedLayer = new THREE.Group();
    scene.add(droppedLayer);
    droppedLayerRef.current = droppedLayer;

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 13.2),
      new THREE.MeshStandardMaterial({ color: 0x33251c, roughness: 0.92 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    box(scene, [22, 4.2, 0.28], [0, 2.1, -6.7], 0x241b16);
    transparentBox(scene, [9.9, 4.2, 0.28], [-6.05, 2.1, 6.7], 0x241b16, 0.62);
    transparentBox(scene, [9.9, 4.2, 0.28], [6.05, 2.1, 6.7], 0x241b16, 0.62);
    transparentBox(scene, [2.2, 1.7, 0.28], [0, 3.35, 6.7], 0x241b16, 0.62);
    box(scene, [0.28, 4.2, 13.2], [-11.1, 2.1, 0], 0x241b16);
    box(scene, [0.28, 4.2, 13.2], [11.1, 2.1, 0], 0x241b16);
    transparentBox(scene, [22.4, 0.34, 13.6], [0, 4.35, 0], 0x12100e, 0.32);
    transparentBox(scene, [0.22, 4.35, 5.75], [-3.0, 2.17, -3.825], 0x1c1511, 0.72);
    transparentBox(scene, [0.22, 4.35, 5.75], [-3.0, 2.17, 3.825], 0x1c1511, 0.72);
    transparentBox(scene, [0.22, 1.3, 2.35], [-3.0, 3.7, 0], 0x1c1511, 0.72);
    transparentBox(scene, [0.22, 4.35, 5.75], [3.0, 2.17, -3.825], 0x1c1511, 0.72);
    transparentBox(scene, [0.22, 4.35, 5.75], [3.0, 2.17, 3.825], 0x1c1511, 0.72);
    transparentBox(scene, [0.22, 1.3, 2.35], [3.0, 3.7, 0], 0x1c1511, 0.72);
    roomDoorsRef.current = [addRoomDoor(scene, -3.02, true), addRoomDoor(scene, 3.02, false)];
    addLabel(scene, 'ROOM 1', [-5.9, 2.35, -4.65]);
    addLabel(scene, 'ROOM 2', [5.9, 2.35, -4.65]);
    addLabel(scene, 'CORRIDOR', [0, 2.35, 0.1]);
    const ghostCabinet = addGhostVacuumCabinet(scene);
    ghostCabinetDoorRef.current = ghostCabinet.door;
    ghostVacuumRef.current = ghostCabinet.vacuum;

    for (let row = 0; row < 4; row += 1) {
      box(scene, [0.38, 1.8, 2.8], [-7.9 + row * 0.74, 0.9, -4.4], 0x2f231b);
      box(scene, [0.38, 1.8, 2.8], [6.2 + row * 0.74, 0.9, -4.4], 0x2f231b);
      box(scene, [1.7, 0.08, 0.16], [-7.3, 0.55 + row * 0.38, -5.0], 0x6a4b32);
      box(scene, [1.7, 0.08, 0.16], [7.1, 0.55 + row * 0.38, -5.0], 0x6a4b32);
      box(scene, [0.1, 0.28, 0.55], [-7.7 + row * 0.4, 0.72 + row * 0.22, -4.0], 0x8a6a42);
      box(scene, [0.1, 0.28, 0.55], [6.6 + row * 0.4, 0.72 + row * 0.22, -4.0], 0x8a6a42);
    }
    box(scene, [2.3, 1.95, 0.18], [7.1, 0.98, -5.16], 0x241811);
    box(scene, [0.16, 1.95, 1.3], [6.05, 0.98, -4.48], 0x241811);
    box(scene, [0.16, 1.95, 1.3], [8.15, 0.98, -4.48], 0x241811);

    addTable(scene);
    const personalFolder = new THREE.Group();
    personalFolder.position.set(-1.25, 0.96, -1.98);
    scene.add(personalFolder);
    box(personalFolder as unknown as THREE.Scene, [0.82, 0.06, 0.44], [0, 0, 0], 0xd8c9a8);
    sourceItemRefs.current['Папка без номера'] = personalFolder;
    sourceItemRefs.current['Фонарик'] = addFlashlightModel(scene);
    coffeeLiquidRef.current = addCoffee(scene);
    addRedFolder(scene);
    addCameraStation(scene);
    addSecurityCamera(scene, [-7.8, 2.65, -6.54], 0);
    addSecurityCamera(scene, [7.8, 2.65, -6.54], 0);
    addSecurityCamera(scene, [-10.94, 2.65, 4.9], Math.PI / 2);
    addSecurityCamera(scene, [10.94, 2.65, 4.9], -Math.PI / 2);
    const emptyCase418 = new THREE.Group();
    emptyCase418.position.set(-7.2, 1.48, -4.02);
    scene.add(emptyCase418);
    box(emptyCase418 as unknown as THREE.Scene, [0.12, 0.48, 0.62], [0, 0, 0], 0xd8c9a8);
    box(emptyCase418 as unknown as THREE.Scene, [0.04, 0.5, 0.64], [-0.08, 0, 0], 0xa51f24);
    sourceItemRefs.current['Пустое дело №418'] = emptyCase418;

    sourceItemRefs.current['Личное дело №417'] = addCase417(scene);
    addBoxes(scene);
    exitDoorRef.current = addSwitchAndExit(scene);

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

    const shadowSuction = createShadowSuctionEffect();
    scene.add(shadowSuction);
    shadowSuctionRef.current = shadowSuction;

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
    redFolderGlow.position.set(1.9, 1.95, -4.18);
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
    let lastFrameAt = 0;
    const frameInterval = 1000 / 45;
    const cameraGoal = new THREE.Vector3();
    const lookGoal = new THREE.Vector3();
    const animate = (timestamp = 0) => {
      animation = requestAnimationFrame(animate);
      if (timestamp - lastFrameAt < frameInterval) return;
      lastFrameAt = timestamp;
      frame += 0.022;
      if (exitDoorRef.current) {
        const doorOpening = actionActiveRef.current && actionTargetRef.current === 'exitUnlock';
        if (doorOpening) exitDoorOpenedRef.current = true;
        const targetRotation = exitDoorOpenedRef.current ? 1.22 : 0;
        exitDoorRef.current.rotation.y = THREE.MathUtils.lerp(exitDoorRef.current.rotation.y, targetRotation, 0.08);
      }
      if (ghostCabinetDoorRef.current) {
        const unlockingCabinet =
          actionActiveRef.current &&
          (actionTargetRef.current === 'ghostVacuum' || actionTargetRef.current === 'vacuumUnlock') &&
          hasGhostKeyRef.current;
        const targetRotation = unlockingCabinet || ghostCabinetUnlockedRef.current || hasGhostVacuumRef.current ? -1.28 : 0;
        ghostCabinetDoorRef.current.rotation.y = THREE.MathUtils.lerp(
          ghostCabinetDoorRef.current.rotation.y,
          targetRotation,
          0.1,
        );
      }
      if (ghostVacuumRef.current) {
        ghostVacuumRef.current.visible = !hasGhostVacuumRef.current;
      }
      if (playerRef.current) {
        roomDoorsRef.current.forEach((door) => {
          const dx = playerRef.current!.position.x - door.position.x;
          const dz = playerRef.current!.position.z - door.position.z;
          const nearby = Math.hypot(dx, dz) < 1.45;
          const sign = door.userData.opensLeft ? -1 : 1;
          const targetRotation = nearby ? sign * 1.18 : 0;
          door.rotation.y = THREE.MathUtils.lerp(door.rotation.y, targetRotation, 0.1);
        });
      }
      if (playerRef.current) {
        const yaw = cameraYawRef.current;
        const bodyYaw = yaw + Math.PI;
        const forwardX = -Math.sin(yaw);
        const forwardZ = -Math.cos(yaw);
        const targetPosition = playerTargetRef.current;
        const distanceToTarget = Math.hypot(
          playerRef.current.position.x - targetPosition.x,
          playerRef.current.position.z - targetPosition.z,
        );
        const working = actionActiveRef.current;
        const walking = distanceToTarget > 0.025 && !working;
        const bob = walking ? Math.abs(Math.sin(frame * 11)) * 0.07 : Math.sin(frame * 2.2) * 0.012;
        const stride = walking ? Math.sin(frame * 11) : 0;
        const leftKnee = walking ? Math.max(0, -stride) : 0;
        const rightKnee = walking ? Math.max(0, stride) : 0;
        const workMotion = working ? Math.sin(frame * 9) : 0;
        const pose = working ? actionPose(actionTargetRef.current, workMotion) : null;
        const parts = playerRef.current.userData.parts as AnimatedPersonParts;
        if (firstPersonHandsRef.current) {
          if (working) updateFirstPersonHands(firstPersonHandsRef.current, actionTargetRef.current, workMotion);
          else firstPersonHandsRef.current.visible = false;
        }

        playerRef.current.position.lerp(targetPosition, working ? 0.55 : 0.28);
        playerRef.current.position.y = personGroundY + bob + (pose?.lift ?? 0);
        playerRef.current.rotation.set(
          pose?.groupPitch ?? 0,
          bodyYaw + Math.sin(frame * 2.2) * 0.035 + (pose?.yawOffset ?? 0),
          pose?.groupRoll ?? 0,
        );
        parts.torso.rotation.set(pose?.bodyLean ?? 0, pose?.bodyTwist ?? 0, 0);
        parts.head.rotation.set(pose?.headPitch ?? 0, pose?.headYaw ?? 0, 0);
        parts.leftUpperArm.rotation.set(pose ? pose.leftUpperArm : -stride * 0.65, 0, -0.2);
        parts.rightUpperArm.rotation.set(pose ? pose.rightUpperArm : stride * 0.65, 0, 0.2);
        parts.leftLowerArm.rotation.set(pose ? pose.leftLowerArm : -stride * 0.78 - 0.18, 0, -0.08);
        parts.rightLowerArm.rotation.set(pose ? pose.rightLowerArm : stride * 0.78 - 0.18, 0, 0.08);
        parts.leftUpperLeg.rotation.set(pose?.leftUpperLeg ?? 0.04 + stride * 0.72, 0, 0.02);
        parts.rightUpperLeg.rotation.set(pose?.rightUpperLeg ?? -0.04 - stride * 0.72, 0, -0.02);
        parts.leftLowerLeg.rotation.set(pose?.leftLowerLeg ?? 0.03 - stride * 0.32 - leftKnee * 0.72, 0, 0.02);
        parts.rightLowerLeg.rotation.set(pose?.rightLowerLeg ?? -0.03 + stride * 0.32 - rightKnee * 0.72, 0, -0.02);
        parts.leftShoe.rotation.set(pose?.leftShoe ?? Math.PI / 2 - stride * 0.26 + leftKnee * 0.38, 0, 0);
        parts.rightShoe.rotation.set(pose?.rightShoe ?? Math.PI / 2 + stride * 0.26 + rightKnee * 0.38, 0, 0);
        const target = playerRef.current.position;
        const pitch = cameraPitchRef.current;
        const eyeHeight = 1.34 * personScale + bob * 0.35 + (pose?.lift ?? 0) * 0.25;
        const lookDistance = 6;
        const lookFlat = Math.cos(pitch) * lookDistance;
        playerRef.current.visible = false;
        cameraGoal.set(
          target.x + forwardX * 0.1,
          personGroundY + eyeHeight,
          target.z + forwardZ * 0.1,
        );
        lookGoal.set(
          cameraGoal.x + forwardX * lookFlat,
          cameraGoal.y - Math.sin(pitch) * lookDistance,
          cameraGoal.z + forwardZ * lookFlat,
        );
        camera.position.lerp(cameraGoal, 0.34);
        camera.lookAt(lookGoal);
        playerLight.position.set(target.x, 2.1, target.z + 0.4);
        flashlight.position.set(cameraGoal.x, cameraGoal.y - 0.12, cameraGoal.z);
        flashlightTarget.position.set(
          cameraGoal.x + forwardX * 3.6,
          cameraGoal.y - Math.sin(pitch) * 3.6,
          cameraGoal.z + forwardZ * 3.6,
        );
      }
      if (doubleRef.current) {
        const sucking = actionActiveRef.current && actionTargetRef.current === 'vacuumSuck';
        const shadowWorld = toWorld(shadowPointRef.current);
        const targetX = sucking && playerRef.current ? playerRef.current.position.x : shadowWorld.x;
        const targetZ = sucking && playerRef.current ? playerRef.current.position.z - 0.75 : shadowWorld.z;
        doubleRef.current.visible = shadowVisibleRef.current || sucking;
        doubleRef.current.position.x = THREE.MathUtils.lerp(doubleRef.current.position.x, targetX, shadowAttackingRef.current ? 0.075 : 0.035);
        doubleRef.current.position.z = THREE.MathUtils.lerp(doubleRef.current.position.z, targetZ, shadowAttackingRef.current ? 0.075 : 0.035);
        doubleRef.current.position.y = personGroundY + Math.sin(frame * (shadowAttackingRef.current ? 7 : 3)) * 0.08;
        doubleRef.current.rotation.y = playerRef.current
          ? Math.atan2(
              playerRef.current.position.x - doubleRef.current.position.x,
              playerRef.current.position.z - doubleRef.current.position.z,
            )
          : 0;
        const pulse = sucking ? Math.max(0.12, 1 - ((Math.sin(frame * 8) + 1) * 0.28 + 0.35)) : 1;
        doubleRef.current.scale.setScalar(personScale * pulse);

        if (shadowSuctionRef.current && playerRef.current) {
          shadowSuctionRef.current.visible = sucking;
          if (sucking) {
            const start = doubleRef.current.position;
            const end = playerRef.current.position;
            const dx = end.x - start.x;
            const dz = end.z - start.z;
            const gap = Math.hypot(dx, dz) || 1;
            const sideX = -dz / gap;
            const sideZ = dx / gap;

            shadowSuctionRef.current.children.forEach((child, index) => {
              if (!(child instanceof THREE.Mesh)) return;
              const phase = Number(child.userData.phase ?? 0);
              const t = ((frame * 1.8 + index * 0.085) % 1);
              const swirl = Math.sin(frame * 18 + phase) * (0.34 * (1 - t));
              const lift = Math.cos(frame * 14 + phase) * 0.18 * (1 - t);
              child.position.set(
                start.x + dx * t + sideX * swirl,
                personGroundY + 0.62 + t * 0.8 + lift,
                start.z + dz * t + sideZ * swirl,
              );
              child.scale.setScalar(Math.max(0.08, 1 - t * 0.78));
              child.rotation.y += 0.18 + t * 0.18;
              if (child.material instanceof THREE.Material) {
                child.material.opacity = child.userData.core ? 0.26 : 0.5 * (1 - t) + 0.08;
              }
            });

            const core = shadowSuctionRef.current.userData.core as THREE.Mesh | undefined;
            if (core) {
              core.position.set((start.x + end.x) / 2, personGroundY + 0.92, (start.z + end.z) / 2);
              core.scale.set(0.75 + Math.sin(frame * 15) * 0.12, 1, gap * 0.72);
              core.lookAt(end.x, personGroundY + 1.05, end.z);
              core.rotateX(Math.PI / 2);
            }
          }
        }
      }
      renderer.render(scene, camera);
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
    const layer = droppedLayerRef.current;
    if (!layer) return;

    layer.clear();
    droppedItems.forEach((dropped) => {
      const model = createDroppedItemModel(dropped.item);
      const position = toWorld(dropped.point);
      model.position.set(position.x, 0.16, position.z);
      model.rotation.y = 0.45;
      layer.add(model);
    });
  }, [droppedItems]);

  useEffect(() => {
    actionActiveRef.current = actionActive;
  }, [actionActive]);

  useEffect(() => {
    actionTargetRef.current = actionTarget;
  }, [actionTarget]);

  useEffect(() => {
    shadowPointRef.current = shadowPoint;
    shadowVisibleRef.current = shadowVisible;
    shadowAttackingRef.current = shadowAttacking;
  }, [shadowAttacking, shadowPoint, shadowVisible]);

  useEffect(() => {
    hasGhostKeyRef.current = inventory.includes('Ключ от стеклянной полки');
    hasGhostVacuumRef.current =
      inventory.includes('Пылесос для привидений') ||
      droppedItems.some((item) => item.item === 'Пылесос для привидений');

    const movedItems = new Set([...inventory, ...droppedItems.map((item) => item.item)]);
    Object.entries(sourceItemRefs.current).forEach(([item, object]) => {
      if (object) object.visible = !movedItems.has(item);
    });
  }, [droppedItems, inventory]);

  useEffect(() => {
    ghostCabinetUnlockedRef.current = ghostCabinetUnlocked;
  }, [ghostCabinetUnlocked]);

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
    if (coffeeLiquidRef.current) coffeeLiquidRef.current.visible = !coffeeDrunk;
  }, [coffeeDrunk]);

  useEffect(() => {
    if (doubleRef.current) doubleRef.current.visible = shadowVisible;
  }, [shadowVisible]);

  return <div className="three-archive" ref={mountRef} />;
}

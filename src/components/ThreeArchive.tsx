import { memo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { hotspots, roomSize, type DroppedItem, type HotspotId, type Point } from '../gameData';

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
  | 'exitUnlock'
  | 'gateRun'
  | 'orangeKeyTake'
  | 'orangeKeyUnlock'
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
  orangeKeyShelfUnlocked: boolean;
  droppedItems: DroppedItem[];
  shadowPoint: Point;
  shadowVisible: boolean;
  shadowAttacking: boolean;
  actionActive: boolean;
  actionTarget: ActionTarget | null;
  currentTarget: HotspotId;
  objectiveHintVisible: boolean;
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
  leftHand: THREE.Group;
  rightHand: THREE.Group;
  heldItemSlot: THREE.Group;
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
    case 'orangeKeyTake':
      return {
        leftUpperArm: -0.38 + motion * 0.1,
        rightUpperArm: -2.18 + Math.abs(motion) * 0.38,
        leftLowerArm: -0.22,
        rightLowerArm: -0.74 - Math.max(0, motion) * 0.42,
        leftUpperLeg: 0.26,
        rightUpperLeg: -0.44,
        leftLowerLeg: -0.18,
        rightLowerLeg: -0.42,
        bodyLean: 0.48,
        bodyTwist: -0.78,
        headPitch: 0.5,
        headYaw: -0.7,
        groupRoll: 0.12,
        lift: -0.04 + Math.abs(motion) * 0.025,
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
    case 'ghostVacuum':
      return {
        leftUpperArm: -1.36 + Math.abs(motion) * 0.18,
        rightUpperArm: -1.36 - Math.abs(motion) * 0.18,
        leftLowerArm: -1.18 + motion * 0.16,
        rightLowerArm: -1.18 - motion * 0.16,
        leftUpperLeg: 0.2,
        rightUpperLeg: -0.18,
        bodyLean: 0.44,
        headPitch: 0.38,
        lift: -0.04 + Math.abs(motion) * 0.04,
        groupPitch: 0.08,
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

function itemMatches(item: string | undefined, patterns: string[]) {
  if (!item) return false;
  return patterns.some((pattern) => item.includes(pattern));
}

function smoothTexture(texture: THREE.Texture, anisotropy = 1) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = Math.max(1, anisotropy);
  texture.needsUpdate = true;
  return texture;
}

function createTargetGlow() {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.018, 8, 48),
    new THREE.MeshBasicMaterial({ color: 0xf1ddb0, transparent: true, opacity: 0.72, depthWrite: false }),
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const inner = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 32),
    new THREE.MeshBasicMaterial({ color: 0xd8a14b, transparent: true, opacity: 0.12, depthWrite: false }),
  );
  inner.rotation.x = -Math.PI / 2;
  group.add(inner);

  const light = new THREE.PointLight(0xf1ddb0, 1.1, 3.4);
  light.position.set(0, 0.85, 0);
  group.add(light);
  group.userData.ring = ring;
  group.userData.inner = inner;
  group.userData.light = light;
  return group;
}

function box(
  scene: THREE.Scene,
  size: [number, number, number],
  position: [number, number, number],
  color: number,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.08 }),
  );
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addShine(mesh: THREE.Mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createKeyModel(item: string) {
  const group = new THREE.Group();
  const keyColor = item === 'Оранжевый ключ' ? 0xff8a1d : 0xd8a14b;
  const metal = new THREE.MeshStandardMaterial({
    color: keyColor,
    roughness: 0.24,
    metalness: 0.62,
    emissive: item === 'Оранжевый ключ' ? 0x331000 : 0x1d1304,
    emissiveIntensity: item === 'Оранжевый ключ' ? 0.16 : 0.08,
  });

  const ring = addShine(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.021, 18, 48), metal));
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const stem = addShine(new THREE.Mesh(new THREE.CapsuleGeometry(0.026, 0.31, 8, 18), metal));
  stem.position.set(0.19, 0, 0);
  stem.rotation.z = Math.PI / 2;
  group.add(stem);

  const toothA = addShine(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.028, 0.055), metal));
  toothA.position.set(0.37, -0.03, 0);
  group.add(toothA);

  const toothB = addShine(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.028, 0.055), metal));
  toothB.position.set(0.32, 0.04, 0);
  group.add(toothB);

  const glint = addShine(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 16, 10),
      new THREE.MeshBasicMaterial({ color: 0xfff0c6, transparent: true, opacity: 0.82 }),
    ),
  );
  glint.position.set(-0.04, 0.045, 0.025);
  group.add(glint);
  return group;
}

function createFlashlightItemModel() {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x191817, roughness: 0.34, metalness: 0.42 });
  const brassMaterial = new THREE.MeshStandardMaterial({ color: 0xd8a14b, roughness: 0.28, metalness: 0.46 });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8f0c8,
    roughness: 0.12,
    metalness: 0.02,
    emissive: 0xf1ddb0,
    emissiveIntensity: 0.26,
    transparent: true,
    opacity: 0.82,
  });

  const body = addShine(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.068, 0.48, 36), bodyMaterial));
  body.rotation.z = Math.PI / 2;
  group.add(body);

  const gripMaterial = new THREE.MeshStandardMaterial({ color: 0x2d2a27, roughness: 0.58, metalness: 0.22 });
  [-0.09, -0.02, 0.05, 0.12].forEach((x) => {
    const rib = addShine(new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.006, 8, 28), gripMaterial));
    rib.position.set(x, 0, 0);
    rib.rotation.y = Math.PI / 2;
    group.add(rib);
  });

  const head = addShine(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.072, 0.17, 40), brassMaterial));
  head.position.set(-0.3, 0, 0);
  head.rotation.z = Math.PI / 2;
  group.add(head);

  const lens = addShine(new THREE.Mesh(new THREE.CircleGeometry(0.084, 40), glassMaterial));
  lens.position.set(-0.389, 0, 0);
  lens.rotation.y = -Math.PI / 2;
  group.add(lens);

  const switchButton = addShine(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.024, 0.036), brassMaterial));
  switchButton.position.set(0.04, 0.065, 0);
  group.add(switchButton);
  return group;
}

function createVacuumItemModel() {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x2c5f78, roughness: 0.42, metalness: 0.2 });
  const brassMaterial = new THREE.MeshStandardMaterial({ color: 0xd8a14b, roughness: 0.32, metalness: 0.38 });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x8fd7ff,
    roughness: 0.12,
    metalness: 0.02,
    transparent: true,
    opacity: 0.7,
    emissive: 0x1b6f8e,
    emissiveIntensity: 0.16,
  });

  const body = addShine(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.23, 0.54, 36), bodyMaterial));
  body.rotation.z = Math.PI / 2;
  group.add(body);

  const tank = addShine(new THREE.Mesh(new THREE.SphereGeometry(0.115, 28, 18), glassMaterial));
  tank.position.set(0.05, 0.02, 0.16);
  group.add(tank);

  const nozzle = addShine(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.068, 0.48, 28), brassMaterial));
  nozzle.position.set(-0.02, 0, -0.39);
  nozzle.rotation.x = Math.PI / 2;
  group.add(nozzle);

  const mouth = addShine(new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.011, 10, 34), brassMaterial));
  mouth.position.set(-0.02, 0, -0.64);
  mouth.rotation.x = Math.PI / 2;
  group.add(mouth);

  const handle = addShine(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 14, 40, Math.PI), bodyMaterial));
  handle.position.set(0.03, 0.2, 0.03);
  handle.rotation.z = Math.PI;
  group.add(handle);
  return group;
}

function createFolderItemModel(color = 0xd8c9a8, stripeColor = 0xa51f24) {
  const group = new THREE.Group();
  const coverMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.72 });
  const stripeMaterial = new THREE.MeshStandardMaterial({ color: stripeColor, roughness: 0.58 });

  const cover = addShine(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.034, 0.31), coverMaterial));
  cover.rotation.z = -0.04;
  group.add(cover);

  const tab = addShine(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.038, 0.052), coverMaterial));
  tab.position.set(-0.13, 0.02, -0.18);
  group.add(tab);

  const spine = addShine(new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.046, 0.33), stripeMaterial));
  spine.position.set(-0.23, 0.01, 0);
  group.add(spine);

  const paperEdge = addShine(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.012, 0.25), new THREE.MeshStandardMaterial({ color: 0xf3e6c6, roughness: 0.8 })));
  paperEdge.position.set(0.02, -0.026, 0.012);
  group.add(paperEdge);
  return group;
}

function addShelfFolders(scene: THREE.Scene) {
  for (let shelf = 0; shelf < 2; shelf += 1) {
    const baseX = shelf === 0 ? -8.15 : 6.05;
    for (let row = 0; row < 4; row += 1) {
      for (let file = 0; file < 7; file += 1) {
        const height = 0.34 + ((row + file) % 3) * 0.05;
        const color = [0x8a6a42, 0x5a3c29, 0xa51f24, 0xd8c9a8][(row + file + shelf) % 4];
        const folder = new THREE.Mesh(
          new THREE.BoxGeometry(0.085, height, 0.42),
          new THREE.MeshStandardMaterial({ color, roughness: 0.82 }),
        );
        folder.position.set(baseX + file * 0.18 + row * 0.1, 0.7 + row * 0.38, -3.93);
        folder.rotation.z = ((file % 3) - 1) * 0.035;
        folder.castShadow = true;
        folder.receiveShadow = true;
        scene.add(folder);
      }
    }
  }
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
  const papers = new THREE.Group();
  papers.position.set(-1.2, 0.9, -1.96);
  scene.add(papers);
  for (let index = 0; index < 4; index += 1) {
    const sheet = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.012, 0.28),
      new THREE.MeshStandardMaterial({ color: index % 2 ? 0xd8c9a8 : 0xf1ddb0, roughness: 0.78 }),
    );
    sheet.position.set(-0.36 + index * 0.24, index * 0.015, Math.sin(index) * 0.04);
    sheet.rotation.y = -0.18 + index * 0.12;
    papers.add(sheet);
  }
  papers.userData.baseY = papers.position.y;
  addLabel(scene, 'СТОЛ', [0.0, 1.42, 1.25]);
  return { papers };
}

function addCoffee(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.position.set(-0.62, 0.98, -1.9);
  scene.add(group);
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.15, 0.24, 40),
    new THREE.MeshStandardMaterial({ color: 0xe1d2ae, roughness: 0.55 }),
  );
  group.add(cup);
  const coffee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.02, 40),
    new THREE.MeshStandardMaterial({ color: 0x2a1510, roughness: 0.4 }),
  );
  coffee.position.set(0, 0.13, 0);
  group.add(coffee);
  const cupMaterial = new THREE.MeshStandardMaterial({ color: 0xe1d2ae, roughness: 0.55 });
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 16, 36), cupMaterial);
  handle.position.set(0.21, 0.02, 0);
  handle.scale.set(0.72, 1.22, 1);
  group.add(handle);

  const upperHandleJoint = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.05), cupMaterial);
  upperHandleJoint.position.set(0.14, 0.08, 0);
  group.add(upperHandleJoint);

  const lowerHandleJoint = upperHandleJoint.clone();
  lowerHandleJoint.position.set(0.14, -0.04, 0);
  group.add(lowerHandleJoint);
  group.userData.baseY = group.position.y;
  addLabel(scene, 'КОФЕ', [0.82, 1.48, 1.38]);
  return { group, liquid: coffee };
}

function addBoxes(scene: THREE.Scene) {
  const group = new THREE.Group();
  scene.add(group);
  box(group as unknown as THREE.Scene, [1.0, 0.55, 0.72], [-5.2, 0.28, 4.35], 0xa36e35);
  const lidPivot = new THREE.Group();
  lidPivot.position.set(-5.2, 0.552, 4.11);
  group.add(lidPivot);
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.035, 0.48),
    new THREE.MeshStandardMaterial({ color: 0xa36e35, roughness: 0.78, metalness: 0.08 }),
  );
  lid.position.set(0, 0, 0.24);
  lid.castShadow = true;
  lid.receiveShadow = true;
  lidPivot.add(lid);
  group.userData.lidPivot = lidPivot;
  addLabel(scene, 'КОРОБКИ', [-5.25, 1.45, 4.15]);
  return group;
}

function addCameraStation(scene: THREE.Scene) {
  const group = new THREE.Group();
  scene.add(group);
  box(group as unknown as THREE.Scene, [1.25, 0.78, 0.12], [5.15, 0.95, 4.25], 0x183831);
  const screen = box(group as unknown as THREE.Scene, [1.05, 0.55, 0.04], [5.15, 0.95, 4.17], 0x5bb494);
  box(group as unknown as THREE.Scene, [0.45, 0.18, 0.4], [5.15, 0.32, 4.53], 0x181615);
  const knob = box(group as unknown as THREE.Scene, [0.12, 0.5, 0.12], [5.15, 0.62, 4.47], 0x181615);
  box(scene, [0.5, 0.22, 0.32], [6.2, 1.78, -4.88], 0x111111);
  box(scene, [0.14, 0.14, 0.3], [6.2, 1.78, -4.62], 0x333333);
  group.userData.screen = screen;
  group.userData.knob = knob;
  addLabel(scene, 'КАМЕРЫ', [5.15, 1.72, 4.2]);
  return group;
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
    new THREE.CylinderGeometry(0.09, 0.09, 0.08, 28),
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
  const group = new THREE.Group();
  const folderX = 1.9;
  scene.add(group);

  box(group as unknown as THREE.Scene, [1.25, 0.12, 0.6], [folderX, 1.16, -4.8], 0x5a3c29);
  box(group as unknown as THREE.Scene, [0.08, 0.78, 0.52], [folderX - 0.58, 0.78, -4.8], 0x2f2018);
  box(group as unknown as THREE.Scene, [0.08, 0.78, 0.52], [folderX + 0.58, 0.78, -4.8], 0x2f2018);
  const cover = box(group as unknown as THREE.Scene, [0.95, 0.08, 0.55], [folderX, 1.27, -4.78], 0xa51f24);
  const seal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.035, 36),
    new THREE.MeshStandardMaterial({ color: 0xd8a14b, roughness: 0.4 }),
  );
  seal.position.set(folderX + 0.06, 1.33, -5.04);
  seal.rotation.x = Math.PI / 2;
  group.add(seal);
  for (let line = 0; line < 3; line += 1) {
    const paperLine = addShine(
      new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.012, 0.018),
        new THREE.MeshStandardMaterial({ color: 0xf2e4bd, roughness: 0.82 }),
      ),
    );
    paperLine.position.set(folderX, 1.32 + line * 0.011, -4.55 + line * 0.055);
    group.add(paperLine);
  }
  group.userData.cover = cover;
  group.userData.seal = seal;
  addLabel(scene, 'КРАСНАЯ ПАПКА', [folderX, 1.95, -4.77]);
  return group;
}

function addFlashlightModel(scene: THREE.Scene) {
  const group = createFlashlightItemModel();
  group.position.set(-1.95, 0.98, -1.9);
  group.scale.setScalar(1.15);
  scene.add(group);
  addLabel(scene, 'ФОНАРИК', [-2.12, 1.48, -3.9]);
  return group;
}

function addCase417(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.position.set(7.25, 0.35, 4.0);
  scene.add(group);

  box(group as unknown as THREE.Scene, [1.05, 0.62, 0.72], [0, 0, 0], 0x9b6a38);
  box(group as unknown as THREE.Scene, [1.12, 0.08, 0.78], [0, 0.37, 0], 0xc29b63);
  const cordMaterial = new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.66 });
  [-0.32, 0.32].forEach((x) => {
    const cord = addShine(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.82, 18), cordMaterial));
    cord.position.set(x, 0.43, 0);
    cord.rotation.x = Math.PI / 2;
    group.add(cord);
  });
  const waxSeal = addShine(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.025, 36),
      new THREE.MeshStandardMaterial({ color: 0x8b1f22, roughness: 0.5, emissive: 0x210304, emissiveIntensity: 0.16 }),
    ),
  );
  waxSeal.position.set(0, 0.455, 0.18);
  waxSeal.rotation.x = Math.PI / 2;
  group.add(waxSeal);
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 256;
  labelCanvas.height = 96;
  const context = labelCanvas.getContext('2d');
  if (context) {
    context.fillStyle = '#d8c9a8';
    context.fillRect(0, 0, labelCanvas.width, labelCanvas.height);
    context.strokeStyle = '#5a3c29';
    context.lineWidth = 10;
    context.strokeRect(5, 5, labelCanvas.width - 10, labelCanvas.height - 10);
    context.fillStyle = '#1c1510';
    context.font = '900 48px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('№417', labelCanvas.width / 2, labelCanvas.height / 2);
  }

  const labelTexture = smoothTexture(new THREE.CanvasTexture(labelCanvas));
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.66, 0.24),
    new THREE.MeshBasicMaterial({ map: labelTexture }),
  );
  label.position.set(0, 0.414, -0.05);
  label.rotation.x = -Math.PI / 2;
  label.rotation.z = Math.PI;
  group.add(label);
  group.userData.lid = group.children.find((child) => child instanceof THREE.Mesh && child.position.y > 0.3);
  return group;
}

function addSwitchAndExit(scene: THREE.Scene) {
  box(scene, [0.08, 0.5, 0.42], [10.86, 1.55, 3.25], 0xe1d2ae);
  const switchLever = box(scene, [0.1, 0.18, 0.12], [10.78, 1.57, 3.25], 0xd8a14b);
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
  doorPivot.userData.switchLever = switchLever;
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

  const insetMaterial = new THREE.MeshStandardMaterial({ color: 0x35231a, roughness: 0.86 });
  const handleMaterial = new THREE.MeshStandardMaterial({ color: 0xd8a14b, roughness: 0.38, metalness: 0.18 });
  const faceSide = opensLeft ? 1 : -1;

  [faceSide, -faceSide].forEach((side) => {
    const inset = new THREE.Mesh(new THREE.BoxGeometry(0.028, 1.72, 1.46), insetMaterial);
    inset.position.set(side * 0.06, 1.24, 1.0);
    doorPivot.add(inset);

    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), handleMaterial);
    handle.position.set(side * 0.09, 1.08, 1.58);
    doorPivot.add(handle);
  });

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
  const gateGroup = new THREE.Group();
  scene.add(gateGroup);

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
  gateGroup.add(openLeft);

  const openRight = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.55, 0.08), white);
  openRight.position.set(1.05, 1.18, 21.15);
  openRight.rotation.y = 0.72;
  gateGroup.add(openRight);
  gateGroup.userData.left = openLeft;
  gateGroup.userData.right = openRight;

  addLabel(scene, 'WHITE GATE', [0, 2.65, 21.25]);
  return gateGroup;
}

function addOutsideKeyShelf(scene: THREE.Scene) {
  const shelf = new THREE.Group();
  shelf.position.set(2.05, 0.02, 13.0);
  scene.add(shelf);

  box(shelf as unknown as THREE.Scene, [1.05, 0.1, 0.78], [0, 0.05, 0], 0x6a4b32);
  box(shelf as unknown as THREE.Scene, [0.1, 1.55, 0.82], [-0.58, 0.8, 0], 0x3a2418);
  box(shelf as unknown as THREE.Scene, [0.1, 1.55, 0.82], [0.58, 0.8, 0], 0x3a2418);
  box(shelf as unknown as THREE.Scene, [1.14, 0.1, 0.84], [0, 1.58, 0], 0x3a2418);
  box(shelf as unknown as THREE.Scene, [0.92, 0.08, 0.12], [0, 0.78, -0.36], 0x5a3c29);
  box(shelf as unknown as THREE.Scene, [0.92, 0.08, 0.12], [0, 1.2, -0.36], 0x5a3c29);

  const keyGroup = createDroppedItemModel('Ключ от стеклянной полки');
  keyGroup.position.set(-0.05, 1.03, -0.03);
  keyGroup.rotation.y = -0.4;
  shelf.add(keyGroup);

  const doorPivot = new THREE.Group();
  doorPivot.position.set(-0.54, 0.08, -0.43);
  shelf.add(doorPivot);

  const glassDoor = new THREE.Mesh(
    new THREE.BoxGeometry(1.08, 1.5, 0.055),
    new THREE.MeshStandardMaterial({
      color: 0x9fd4ff,
      roughness: 0.14,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );
  glassDoor.position.set(0.54, 0.76, 0);
  doorPivot.add(glassDoor);

  const lockMaterial = new THREE.MeshStandardMaterial({ color: 0xff8a1d, roughness: 0.35, metalness: 0.35 });
  const lockBody = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.09), lockMaterial);
  lockBody.position.set(1.03, 0.74, -0.055);
  doorPivot.add(lockBody);

  const lockShackle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 8, 18, Math.PI), lockMaterial);
  lockShackle.position.set(1.03, 0.9, -0.055);
  lockShackle.rotation.z = Math.PI;
  doorPivot.add(lockShackle);

  addLabel(scene, 'OUTDOOR GLASS KEY', [2.05, 1.95, 12.9]);
  return { key: keyGroup, door: doorPivot };
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
    new THREE.BoxGeometry(0.055, 1.6, 1.46),
    new THREE.MeshStandardMaterial({
      color: 0x9fd4ff,
      roughness: 0.14,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );
  glassDoor.position.set(0, 0.72, 0.73);
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
  if (item === 'Ключ от стеклянной полки' || item === 'Оранжевый ключ') {
    return createKeyModel(item);
  }
  if (item === 'Пылесос для привидений') return createVacuumItemModel();
  if (item === 'Фонарик') return createFlashlightItemModel();
  if (item.includes('417')) return createFolderItemModel(0xd6bf88, 0x8b1f22);
  if (item.includes('418')) return createFolderItemModel(0xd8c9a8, 0xa51f24);
  return createFolderItemModel(0xd8c9a8, 0x5a3c29);
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
  return { keyShelf: addOutsideKeyShelf(scene), gate: addWhiteGate(scene) };
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

function createPalm(material: THREE.Material, side: -1 | 1, scale = 1) {
  const group = new THREE.Group();

  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.13 * scale, 0.055 * scale, 0.17 * scale), material);
  palm.position.set(0, 0, -0.02 * scale);
  palm.castShadow = true;
  group.add(palm);

  for (let index = 0; index < 4; index += 1) {
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.014 * scale, 0.095 * scale, 5, 8), material);
    finger.position.set((-0.047 + index * 0.031) * scale, -0.006 * scale, -0.13 * scale);
    finger.rotation.x = Math.PI / 2 + 0.08;
    finger.castShadow = true;
    group.add(finger);
  }

  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.017 * scale, 0.085 * scale, 5, 8), material);
  thumb.position.set(side * 0.082 * scale, -0.006 * scale, -0.04 * scale);
  thumb.rotation.set(Math.PI / 2, 0, side * 0.75);
  thumb.castShadow = true;
  group.add(thumb);

  return group;
}

function createPerson(dark = false) {
  const group = new THREE.Group();
  const makePersonMaterial = (color: number, roughness: number, emissive = 0x000000) =>
    dark
      ? new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.52,
          depthWrite: false,
        })
      : new THREE.MeshStandardMaterial({
          color,
          roughness,
          emissive,
          transparent: false,
          opacity: 1,
          depthWrite: true,
        });
  const skin = dark ? 0x000000 : 0xc89f79;
  const coat = dark ? 0x000000 : 0x315783;
  const pants = dark ? 0x000000 : 0x2b2f3a;
  const shoes = dark ? 0x000000 : 0x0c0b0a;
  const badge = dark ? 0x000000 : 0xf1ddb0;

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 24, 18),
    makePersonMaterial(skin, 0.68),
  );
  head.position.set(0, 1.35, 0);
  head.castShadow = true;
  group.add(head);

  if (!dark) {
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.185, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      makePersonMaterial(0x21140f, 0.9),
    );
    hair.position.set(0, 1.43, -0.01);
    group.add(hair);
  }

  if (dark) {
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0018, transparent: true, opacity: 1 });
    const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x220000, transparent: true, opacity: 0.58 });

    [-1, 1].forEach((side) => {
      const eye = new THREE.Mesh(new THREE.CircleGeometry(0.046, 3), eyeMaterial);
      eye.position.set(side * 0.072, 0.04, 0.185);
      eye.rotation.z = side * 0.62;
      eye.scale.set(1.45, 0.5, 1);
      head.add(eye);
    });

    const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.034, 3), mouthMaterial);
    mouth.position.set(0, -0.08, 0.187);
    mouth.rotation.z = Math.PI;
    mouth.scale.set(0.9, 1.55, 1);
    head.add(mouth);
  }

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
  const leftPalm = createPalm(makePersonMaterial(skin, 0.7), -1, 0.78);
  const rightPalm = createPalm(makePersonMaterial(skin, 0.7), 1, 0.78);
  leftPalm.position.set(0, -0.29, 0.01);
  rightPalm.position.set(0, -0.29, 0.01);
  leftPalm.rotation.set(0.08, 0, 0.12);
  rightPalm.rotation.set(0.08, 0, -0.12);
  leftLowerArm.add(leftPalm);
  rightLowerArm.add(rightPalm);
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

  if (dark) {
    const shroudMaterial = new THREE.MeshStandardMaterial({
      color: 0xdbe7ee,
      emissive: 0x91b6c8,
      emissiveIntensity: 0.22,
      roughness: 0.9,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const shroud = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.02, 28, 1, true), shroudMaterial);
    shroud.position.set(0, 0.38, 0);
    shroud.rotation.y = Math.PI / 28;
    group.add(shroud);

    const glow = new THREE.PointLight(0xaed8e6, 0.42, 1.8);
    glow.position.set(0, 0.92, 0.04);
    group.add(glow);
  }

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

function createHeldItemModel(item: string) {
  const group = createDroppedItemModel(item);

  if (item === 'Ключ от стеклянной полки' || item === 'Оранжевый ключ') {
    group.scale.setScalar(0.72);
    group.position.set(0.02, 0.02, -0.05);
    group.rotation.set(0.25, -0.4, 0.9);
  } else if (item === 'Пылесос для привидений') {
    group.scale.setScalar(0.78);
    group.position.set(0.02, -0.02, -0.08);
    group.rotation.set(0.22, -0.45, -0.12);
  } else if (item === 'Фонарик') {
    group.scale.setScalar(0.82);
    group.position.set(0, 0, -0.04);
    group.rotation.set(0.1, -0.65, 0.12);
  } else {
    group.scale.set(0.74, 0.74, 0.74);
    group.position.set(0.01, -0.02, -0.04);
    group.rotation.set(-0.65, -0.22, 0.32);
  }

  return group;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
      else child.material.dispose();
    } else if (child instanceof THREE.Sprite) {
      const material = child.material;
      material.map?.dispose();
      material.dispose();
    }
  });
}

function createFirstPersonHands() {
  const group = new THREE.Group();
  group.visible = false;

  const sleeveMaterial = new THREE.MeshStandardMaterial({ color: 0x315783, roughness: 0.78 });
  const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xc89f79, roughness: 0.68 });

  const leftSleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.46, 8, 12), sleeveMaterial);
  const rightSleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.46, 8, 12), sleeveMaterial);
  const leftHand = createPalm(skinMaterial, -1, 1.05);
  const rightHand = createPalm(skinMaterial, 1, 1.05);
  const heldItemSlot = new THREE.Group();

  leftSleeve.position.set(-0.22, -0.28, -0.54);
  rightSleeve.position.set(0.22, -0.28, -0.54);
  leftHand.position.set(-0.25, -0.44, -0.82);
  rightHand.position.set(0.25, -0.44, -0.82);
  leftSleeve.rotation.set(1.05, 0.18, -0.25);
  rightSleeve.rotation.set(1.05, -0.18, 0.25);
  leftHand.rotation.set(-0.32, -0.22, 0.18);
  rightHand.rotation.set(-0.32, 0.22, -0.18);

  group.add(leftSleeve, rightSleeve, leftHand, rightHand, heldItemSlot);
  group.userData.parts = { leftSleeve, rightSleeve, leftHand, rightHand, heldItemSlot } satisfies FirstPersonHandsParts;
  return group;
}

function attachPalmToSleeve(sleeve: THREE.Mesh, hand: THREE.Group, side: -1 | 1, reach = 0.34) {
  const wristOffset = new THREE.Vector3(side * 0.025, -reach, 0.02).applyEuler(sleeve.rotation);
  hand.position.copy(sleeve.position).add(wristOffset);
}

function attachFirstPersonPalms(parts: FirstPersonHandsParts) {
  attachPalmToSleeve(parts.leftSleeve, parts.leftHand, -1);
  attachPalmToSleeve(parts.rightSleeve, parts.rightHand, 1);
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
  parts.leftHand.rotation.set(-0.32, -0.22, 0.18);
  parts.rightHand.rotation.set(-0.32, 0.22, -0.18);
  parts.leftHand.scale.setScalar(1);
  parts.rightHand.scale.setScalar(1);
  parts.leftSleeve.visible = true;
  parts.rightSleeve.visible = true;
  parts.leftHand.visible = true;
  parts.rightHand.visible = true;
  parts.heldItemSlot.visible = false;

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
      parts.rightHand.rotation.set(0.45, -0.5, 0.25 + beat * 0.22);
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
      parts.leftHand.rotation.set(0.18, 0.38, -0.35 + motion * 0.35);
      parts.rightHand.rotation.set(0.18, -0.38, 0.35 - motion * 0.35);
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
      parts.leftHand.rotation.set(0.05, 0.1, -0.24);
      parts.rightHand.rotation.set(0.05, -0.1, 0.24);
      break;
    case 'exitUnlock':
    case 'exit':
      parts.leftHand.position.set(-0.22, -0.48, -0.74);
      parts.rightHand.position.set(0.34 + motion * 0.06, -0.2, -0.92);
      parts.rightSleeve.rotation.set(1.86, -0.48, 0.34 + beat * 0.24);
      parts.rightHand.rotation.set(0.42, -0.72, 0.42 + motion * 0.25);
      break;
    case 'gateRun':
    case 'gate':
      group.position.set(Math.sin(motion * 2) * 0.018, beat * 0.035, 0);
      parts.leftHand.position.set(-0.34 - motion * 0.08, -0.3 + beat * 0.08, -0.96);
      parts.rightHand.position.set(0.34 + motion * 0.08, -0.3 - beat * 0.08, -0.96);
      parts.leftSleeve.rotation.set(1.72 + motion * 0.28, 0.34, -0.4);
      parts.rightSleeve.rotation.set(1.72 - motion * 0.28, -0.34, 0.4);
      break;
    case 'keyTake':
      parts.leftHand.position.set(-0.28, -0.48, -0.78);
      parts.rightHand.position.set(0.1 + motion * 0.12, -0.26 - beat * 0.06, -0.9);
      parts.rightSleeve.rotation.set(1.72, -0.1, 0.24 + beat * 0.28);
      parts.rightHand.rotation.set(0.18, -0.3, 0.58 + beat * 0.35);
      break;
    case 'orangeKeyTake':
      group.position.set(-0.04 + beat * 0.018, -0.03 - Math.abs(motion) * 0.02, 0);
      parts.leftHand.position.set(-0.26, -0.47, -0.78);
      parts.rightHand.position.set(0.38 + beat * 0.05, -0.16 + motion * 0.05, -1.05);
      parts.leftSleeve.rotation.set(1.42, 0.18, -0.2);
      parts.rightSleeve.rotation.set(2.08, -0.62, 0.72 + motion * 0.32);
      parts.rightHand.rotation.set(0.5, -0.72, 0.95 + beat * 0.4);
      break;
    case 'vacuumUnlock':
    case 'orangeKeyUnlock':
    case 'ghostKey':
      parts.leftHand.position.set(-0.22, -0.3, -0.86);
      parts.rightHand.position.set(0.24 + Math.sin(motion * 3) * 0.06, -0.24, -0.88);
      parts.rightSleeve.rotation.set(1.66, -0.28, 0.45 + Math.sin(motion * 3) * 0.35);
      parts.rightHand.rotation.set(0.18, -0.42, 0.72 + Math.sin(motion * 3) * 0.42);
      break;
    case 'ghostVacuum':
      parts.leftHand.position.set(-0.28, -0.24 + beat * 0.04, -1.0);
      parts.rightHand.position.set(0.28, -0.24 - beat * 0.04, -1.0);
      parts.leftSleeve.rotation.set(1.6, 0.26, -0.28);
      parts.rightSleeve.rotation.set(1.6, -0.26, 0.28);
      parts.leftHand.rotation.set(0.25, 0.28, -0.2);
      parts.rightHand.rotation.set(0.25, -0.28, 0.2);
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

  attachFirstPersonPalms(parts);
}

function updateHeldItemHand(group: THREE.Group, motion: number, item?: string) {
  const parts = group.userData.parts as FirstPersonHandsParts;
  const bob = Math.sin(motion * 2.4) * 0.015;
  const heavy = itemMatches(item, ['Пылесос']);
  const flashlight = itemMatches(item, ['Фонар']);
  const caseFile = itemMatches(item, ['417']);

  group.visible = true;
  group.position.set(heavy ? Math.sin(motion * 8) * 0.012 : 0, bob, 0);
  group.rotation.set(0, 0, caseFile ? Math.sin(motion * 2.6) * 0.025 : 0);

  parts.leftSleeve.visible = false;
  parts.leftHand.visible = false;
  parts.rightSleeve.visible = true;
  parts.rightHand.visible = true;
  parts.heldItemSlot.visible = true;

  parts.rightSleeve.position.set(heavy ? 0.19 : 0.27, heavy ? -0.28 + bob : -0.35 + bob, heavy ? -0.62 : -0.58);
  parts.rightSleeve.rotation.set(heavy ? 1.42 : 1.18, heavy ? -0.16 : -0.42, heavy ? 0.18 : 0.34);
  attachPalmToSleeve(parts.rightSleeve, parts.rightHand, 1);
  parts.rightHand.rotation.set(heavy ? 0.28 : 0.18, heavy ? -0.34 : -0.58, heavy ? 0.16 : 0.36);
  parts.rightHand.scale.setScalar(1);

  parts.heldItemSlot.position.set(flashlight ? 0.3 : 0.36, flashlight ? -0.38 + bob : -0.43 + bob, flashlight ? -0.98 : -0.9);
  parts.heldItemSlot.rotation.set(flashlight ? -0.05 : -0.18, flashlight ? -0.52 : -0.24, flashlight ? 0.02 : 0.18);
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

function ThreeArchiveComponent({
  player,
  lightOn,
  fear,
  coffeeDrunk,
  inventory,
  ghostCabinetUnlocked,
  orangeKeyShelfUnlocked,
  droppedItems,
  shadowPoint,
  shadowVisible,
  shadowAttacking,
  actionActive,
  actionTarget,
  currentTarget,
  objectiveHintVisible,
  onViewYawChange,
}: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<THREE.Group | null>(null);
  const doubleRef = useRef<THREE.Group | null>(null);
  const firstPersonHandsRef = useRef<THREE.Group | null>(null);
  const shadowSuctionRef = useRef<THREE.Group | null>(null);
  const targetGlowRef = useRef<THREE.Group | null>(null);
  const playerTargetRef = useRef(new THREE.Vector3(0, personGroundY, 0));
  const lampRef = useRef<THREE.PointLight | null>(null);
  const playerLightRef = useRef<THREE.PointLight | null>(null);
  const flashlightRef = useRef<THREE.SpotLight | null>(null);
  const coffeeLiquidRef = useRef<THREE.Object3D | null>(null);
  const exitDoorRef = useRef<THREE.Group | null>(null);
  const roomDoorsRef = useRef<THREE.Group[]>([]);
  const ghostCabinetDoorRef = useRef<THREE.Group | null>(null);
  const orangeKeyShelfDoorRef = useRef<THREE.Group | null>(null);
  const ghostVacuumRef = useRef<THREE.Group | null>(null);
  const sourceItemRefs = useRef<Record<string, THREE.Object3D | null>>({});
  const interactionObjectRefs = useRef<Record<string, THREE.Object3D | null>>({});
  const droppedLayerRef = useRef<THREE.Group | null>(null);
  const actionActiveRef = useRef(actionActive);
  const actionTargetRef = useRef<ActionTarget | null>(actionTarget);
  const currentTargetRef = useRef(currentTarget);
  const objectiveHintVisibleRef = useRef(objectiveHintVisible);
  const heldItemRef = useRef<string | undefined>(inventory[0]);
  const shadowPointRef = useRef(shadowPoint);
  const shadowVisibleRef = useRef(shadowVisible);
  const shadowAttackingRef = useRef(shadowAttacking);
  const hasGhostKeyRef = useRef(inventory.includes('Ключ от стеклянной полки'));
  const hasGhostVacuumRef = useRef(inventory.includes('Пылесос для привидений'));
  const ghostCabinetUnlockedRef = useRef(ghostCabinetUnlocked);
  const orangeKeyShelfUnlockedRef = useRef(orangeKeyShelfUnlocked);
  const exitDoorOpenedRef = useRef(false);
  const cameraYawRef = useRef(0.28);
  const cameraPitchRef = useRef(0);
  const draggingRef = useRef(false);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const rotateView = (dx: number, dy: number) => {
      cameraYawRef.current -= dx * 0.006;
      cameraPitchRef.current = THREE.MathUtils.clamp(cameraPitchRef.current + dy * 0.0025, -0.72, 0.72);
      onViewYawChange(cameraYawRef.current);
    };

    const onPointerDown = (event: PointerEvent) => {
      draggingRef.current = true;
      pointerRef.current = { x: event.clientX, y: event.clientY };
      mount.setPointerCapture(event.pointerId);
      if (event.pointerType === 'mouse' && document.pointerLockElement !== mount) mount.requestPointerLock();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (document.pointerLockElement === mount) return;
      if (!draggingRef.current) return;
      const dx = event.clientX - pointerRef.current.x;
      const dy = event.clientY - pointerRef.current.y;
      pointerRef.current = { x: event.clientX, y: event.clientY };
      rotateView(dx, dy);
    };

    const onLockedMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== mount) return;
      rotateView(event.movementX, event.movementY);
    };

    const onPointerUp = (event: PointerEvent) => {
      draggingRef.current = false;
      if (mount.hasPointerCapture(event.pointerId)) mount.releasePointerCapture(event.pointerId);
    };

    mount.addEventListener('pointerdown', onPointerDown);
    mount.addEventListener('pointermove', onPointerMove);
    mount.addEventListener('pointerup', onPointerUp);
    mount.addEventListener('pointercancel', onPointerUp);
    document.addEventListener('mousemove', onLockedMouseMove);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0908);
    scene.fog = new THREE.Fog(0x0a0908, 16, 34);

    const camera = new THREE.PerspectiveCamera(64, 16 / 9, 0.08, 100);
    camera.position.set(0, 1.3, 0);
    camera.lookAt(0, 0, 0);
    scene.add(camera);

    const firstPersonHands = createFirstPersonHands();
    camera.add(firstPersonHands);
    firstPersonHandsRef.current = firstPersonHands;

    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const forcePerformanceMode = false;
    const weakDeviceMode = forcePerformanceMode || deviceMemory <= 4;
    const lowPowerMode = weakDeviceMode;
    const renderer = new THREE.WebGLRenderer({
      antialias: !lowPowerMode,
      powerPreference: 'high-performance',
    });
    const devicePixelRatio = window.devicePixelRatio || 1;
    const minPixelRatio = weakDeviceMode ? 0.6 : 0.9;
    const maxPixelRatio = weakDeviceMode
      ? Math.min(devicePixelRatio, 0.85)
      : Math.min(Math.max(devicePixelRatio, 1.15), 1.5);
    let adaptivePixelRatio = maxPixelRatio;
    const setRenderPixelRatio = (value: number) => {
      const next = THREE.MathUtils.clamp(value, minPixelRatio, maxPixelRatio);
      if (Math.abs(next - adaptivePixelRatio) < 0.04) return;
      adaptivePixelRatio = next;
      renderer.setPixelRatio(adaptivePixelRatio);
      renderer.setSize(mount.clientWidth, mount.clientHeight || mount.clientWidth * 0.6, false);
    };

    renderer.setPixelRatio(adaptivePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.42;
    renderer.shadowMap.enabled = false;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    mount.appendChild(renderer.domElement);

    const outside = addOutside(scene);
    sourceItemRefs.current['Ключ от стеклянной полки'] = outside.keyShelf.key;
    orangeKeyShelfDoorRef.current = outside.keyShelf.door;
    interactionObjectRefs.current.gate = outside.gate;

    const droppedLayer = new THREE.Group();
    scene.add(droppedLayer);
    droppedLayerRef.current = droppedLayer;

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 13.2),
      new THREE.MeshStandardMaterial({ color: 0x3a2a1f, roughness: 0.84, metalness: 0.04 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    box(scene, [22, 4.2, 0.28], [0, 2.1, -6.7], 0x241b16);
    box(scene, [9.9, 4.2, 0.28], [-6.05, 2.1, 6.7], 0x241b16);
    box(scene, [9.9, 4.2, 0.28], [6.05, 2.1, 6.7], 0x241b16);
    box(scene, [2.2, 1.7, 0.28], [0, 3.35, 6.7], 0x241b16);
    box(scene, [0.28, 4.2, 13.2], [-11.1, 2.1, 0], 0x241b16);
    box(scene, [0.28, 4.2, 13.2], [11.1, 2.1, 0], 0x241b16);
    box(scene, [0.22, 4.35, 5.75], [-3.0, 2.17, -3.825], 0x1c1511);
    box(scene, [0.22, 4.35, 5.75], [-3.0, 2.17, 3.825], 0x1c1511);
    box(scene, [0.22, 2.0, 2.35], [-3.0, 3.35, 0], 0x1c1511);
    box(scene, [0.22, 4.35, 5.75], [3.0, 2.17, -3.825], 0x1c1511);
    box(scene, [0.22, 4.35, 5.75], [3.0, 2.17, 3.825], 0x1c1511);
    box(scene, [0.22, 2.0, 2.35], [3.0, 3.35, 0], 0x1c1511);
    addShelfFolders(scene);
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

    const tableParts = addTable(scene);
    interactionObjectRefs.current.deskPapers = tableParts.papers;
    const personalFolder = createFolderItemModel(0xd8c9a8, 0x5a3c29);
    personalFolder.position.set(-1.25, 0.96, -1.98);
    personalFolder.scale.setScalar(1.55);
    scene.add(personalFolder);
    const personalFolderCover = personalFolder.children.find((child) => child instanceof THREE.Mesh) ?? personalFolder;
    personalFolder.userData.cover = personalFolderCover;
    sourceItemRefs.current['Папка без номера'] = personalFolder;
    interactionObjectRefs.current.personalFolder = personalFolder;
    sourceItemRefs.current['Фонарик'] = addFlashlightModel(scene);
    interactionObjectRefs.current.flashlight = sourceItemRefs.current['Фонарик'];
    const coffee = addCoffee(scene);
    coffeeLiquidRef.current = coffee.liquid;
    interactionObjectRefs.current.coffee = coffee.group;
    interactionObjectRefs.current.redFolder = addRedFolder(scene);
    interactionObjectRefs.current.cameraStation = addCameraStation(scene);
    addSecurityCamera(scene, [-7.8, 2.65, -6.54], 0);
    addSecurityCamera(scene, [7.8, 2.65, -6.54], 0);
    addSecurityCamera(scene, [-10.94, 2.65, 4.9], Math.PI / 2);
    addSecurityCamera(scene, [10.94, 2.65, 4.9], -Math.PI / 2);
    const emptyCase418 = createFolderItemModel(0xd8c9a8, 0xa51f24);
    emptyCase418.position.set(-7.2, 1.48, -4.02);
    emptyCase418.scale.setScalar(1.45);
    emptyCase418.rotation.y = 0.08;
    scene.add(emptyCase418);
    sourceItemRefs.current['Пустое дело №418'] = emptyCase418;
    interactionObjectRefs.current.shelfCase = emptyCase418;

    sourceItemRefs.current['Личное дело №417'] = addCase417(scene);
    interactionObjectRefs.current.case417 = sourceItemRefs.current['Личное дело №417'];
    sourceItemRefs.current['Оранжевый ключ'] = createDroppedItemModel('Оранжевый ключ');
    const orangeKey = sourceItemRefs.current['Оранжевый ключ']!;
    orangeKey.position.set(-8.46, 0.08, -5.62);
    orangeKey.scale.setScalar(0.56);
    orangeKey.rotation.set(0.04, 0.2, -0.48);
    orangeKey.userData.basePosition = orangeKey.position.clone();
    orangeKey.userData.baseRotation = orangeKey.rotation.clone();
    scene.add(orangeKey);
    interactionObjectRefs.current.boxes = addBoxes(scene);
    exitDoorRef.current = addSwitchAndExit(scene);
    interactionObjectRefs.current.switchLever = exitDoorRef.current.userData.switchLever as THREE.Object3D;
    interactionObjectRefs.current.exitDoor = exitDoorRef.current;

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

    const targetGlow = createTargetGlow();
    scene.add(targetGlow);
    targetGlowRef.current = targetGlow;

    const ambient = new THREE.AmbientLight(0x9b8264, 0.95);
    scene.add(ambient);

    const hemisphere = new THREE.HemisphereLight(0xdac390, 0x18110d, 1.12);
    scene.add(hemisphere);

    const lamp = new THREE.PointLight(0xd8a14b, 5.4, 13);
    lamp.position.set(-1.8, 3.2, 1.0);
    lamp.castShadow = false;
    lamp.shadow.mapSize.set(256, 256);
    lamp.shadow.bias = -0.0006;
    scene.add(lamp);
    lampRef.current = lamp;

    const deskWarmth = new THREE.PointLight(0xffd08a, 0.72, 4.6);
    deskWarmth.position.set(-1.2, 1.7, -2.2);
    scene.add(deskWarmth);

    const cameraGlow = new THREE.PointLight(0x7bb89b, 0.62, 4.2);
    cameraGlow.position.set(6.2, 1.8, 1.2);
    scene.add(cameraGlow);

    const redFolderGlow = new THREE.PointLight(0xbf2f2f, 0.86, 3.2);
    redFolderGlow.position.set(1.9, 1.95, -4.18);
    scene.add(redFolderGlow);

    const exitGlow = new THREE.PointLight(0xd8a14b, 0.78, 3.9);
    exitGlow.position.set(0, 2.2, 4.7);
    scene.add(exitGlow);

    const moonGlow = new THREE.DirectionalLight(0x9fb8c9, 1.2);
    moonGlow.position.set(-4, 7, 12);
    moonGlow.castShadow = false;
    moonGlow.shadow.mapSize.set(256, 256);
    moonGlow.shadow.camera.left = -12;
    moonGlow.shadow.camera.right = 12;
    moonGlow.shadow.camera.top = 12;
    moonGlow.shadow.camera.bottom = -12;
    moonGlow.shadow.bias = -0.0008;
    scene.add(moonGlow);

    const pathGlow = new THREE.PointLight(0x9fb8c9, 0.82, 8.2);
    pathGlow.position.set(0, 2.4, 9.8);
    scene.add(pathGlow);

    const playerLight = new THREE.PointLight(0xf1ddb0, 2.25, 4.6);
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
    let perfWindowStartedAt = 0;
    let perfFrameCount = 0;
    let perfElapsed = 0;
    const frameInterval = 1000 / (weakDeviceMode ? 35 : 60);
    const cameraGoal = new THREE.Vector3();
    const lookGoal = new THREE.Vector3();
    const animate = (timestamp = 0) => {
      animation = requestAnimationFrame(animate);
      if (document.hidden) {
        lastFrameAt = timestamp;
        return;
      }
      const frameDelta = lastFrameAt ? timestamp - lastFrameAt : frameInterval;
      if (frameDelta < frameInterval) return;
      lastFrameAt = timestamp;
      frame += 0.022;

      perfFrameCount += 1;
      perfElapsed += frameDelta;
      if (!perfWindowStartedAt) perfWindowStartedAt = timestamp;
      if (timestamp - perfWindowStartedAt > 1000) {
        const averageFrameMs = perfElapsed / perfFrameCount;
        if (averageFrameMs > 31 && adaptivePixelRatio > minPixelRatio) {
          setRenderPixelRatio(adaptivePixelRatio - 0.14);
        } else if (averageFrameMs < 23 && adaptivePixelRatio < maxPixelRatio) {
          setRenderPixelRatio(adaptivePixelRatio + 0.05);
        }
        perfWindowStartedAt = timestamp;
        perfFrameCount = 0;
        perfElapsed = 0;
      }

      const activeTarget = actionActiveRef.current ? actionTargetRef.current : null;
      const actionBeat = Math.abs(Math.sin(frame * 7.5));
      const rememberBase = (object: THREE.Object3D) => {
        if (!object.userData.basePosition) object.userData.basePosition = object.position.clone();
        if (!object.userData.baseRotation) object.userData.baseRotation = object.rotation.clone();
      };
      Object.values(interactionObjectRefs.current).forEach((object) => {
        if (object) rememberBase(object);
      });

      const boxes = interactionObjectRefs.current.boxes as THREE.Group | undefined;
      const boxLidPivot = boxes?.userData.lidPivot as THREE.Object3D | undefined;
      if (boxLidPivot) {
        const open = activeTarget === 'boxesUnpack' || activeTarget === 'boxes';
        boxLidPivot.rotation.x = THREE.MathUtils.lerp(boxLidPivot.rotation.x, open ? -1.25 - actionBeat * 0.12 : 0, 0.16);
      }

      const papers = interactionObjectRefs.current.deskPapers as THREE.Group | undefined;
      if (papers) {
        const sorting = activeTarget === 'deskSort' || activeTarget === 'deskOpen';
        papers.children.forEach((child, index) => {
          const baseX = -0.36 + index * 0.24;
          const spread = sorting ? Math.sin(frame * 6 + index) * 0.1 : 0;
          child.position.x = THREE.MathUtils.lerp(child.position.x, baseX + spread, 0.18);
          child.position.y = THREE.MathUtils.lerp(child.position.y, index * 0.015 + (sorting ? actionBeat * 0.05 : 0), 0.18);
          child.rotation.z = THREE.MathUtils.lerp(child.rotation.z, sorting ? Math.sin(frame * 5 + index) * 0.12 : 0, 0.16);
        });
      }

      const personalFolder = interactionObjectRefs.current.personalFolder as THREE.Group | undefined;
      const personalCover = personalFolder?.userData.cover as THREE.Object3D | undefined;
      if (personalFolder && personalCover) {
        const openingPersonal = activeTarget === 'deskOpen';
        const base = personalFolder.userData.basePosition as THREE.Vector3;
        personalFolder.position.y = THREE.MathUtils.lerp(personalFolder.position.y, base.y + (openingPersonal ? 0.13 : 0), 0.16);
        personalCover.rotation.x = THREE.MathUtils.lerp(personalCover.rotation.x, openingPersonal ? -0.95 - actionBeat * 0.12 : 0, 0.16);
      }

      const coffeeCup = interactionObjectRefs.current.coffee;
      if (coffeeCup) {
        const drinking = activeTarget === 'coffeeMirror' || activeTarget === 'coffee';
        const base = coffeeCup.userData.basePosition as THREE.Vector3;
        coffeeCup.position.y = THREE.MathUtils.lerp(coffeeCup.position.y, base.y + (drinking ? 0.42 + actionBeat * 0.05 : 0), 0.14);
        coffeeCup.rotation.z = THREE.MathUtils.lerp(coffeeCup.rotation.z, drinking ? -0.35 - actionBeat * 0.08 : 0, 0.14);
      }

      const redFolder = interactionObjectRefs.current.redFolder as THREE.Group | undefined;
      const redCover = redFolder?.userData.cover as THREE.Object3D | undefined;
      const redSeal = redFolder?.userData.seal as THREE.Object3D | undefined;
      if (redCover) {
        const checking = activeTarget === 'redSeal' || activeTarget === 'redFolder';
        redCover.rotation.z = THREE.MathUtils.lerp(redCover.rotation.z, checking ? -0.32 - actionBeat * 0.12 : 0, 0.16);
        if (redSeal) redSeal.scale.setScalar(THREE.MathUtils.lerp(redSeal.scale.x, checking ? 1.22 + actionBeat * 0.18 : 1, 0.16));
      }

      const case417 = interactionObjectRefs.current.case417 as THREE.Group | undefined;
      const caseLid = case417?.userData.lid as THREE.Object3D | undefined;
      if (caseLid) {
        const reading = activeTarget === 'case417Read' || activeTarget === 'case417';
        caseLid.rotation.x = THREE.MathUtils.lerp(caseLid.rotation.x, reading ? -0.78 - actionBeat * 0.22 : 0, 0.15);
        caseLid.position.y = THREE.MathUtils.lerp(caseLid.position.y, reading ? 0.48 : 0.37, 0.15);
      }

      const shelfCase = interactionObjectRefs.current.shelfCase;
      if (shelfCase) {
        const pullingShelfCase = activeTarget === 'shelvesDust' || activeTarget === 'shelves';
        const base = shelfCase.userData.basePosition as THREE.Vector3;
        shelfCase.position.x = THREE.MathUtils.lerp(shelfCase.position.x, base.x + (pullingShelfCase ? 0.42 + actionBeat * 0.05 : 0), 0.14);
        shelfCase.position.y = THREE.MathUtils.lerp(shelfCase.position.y, base.y + (pullingShelfCase ? 0.08 : 0), 0.14);
        shelfCase.rotation.z = THREE.MathUtils.lerp(shelfCase.rotation.z, pullingShelfCase ? -0.18 : 0, 0.14);
      }

      const flashlightObject = interactionObjectRefs.current.flashlight;
      if (flashlightObject) {
        const usingFlashlight = activeTarget === 'flashlightBeam' || activeTarget === 'flashlight';
        const base = flashlightObject.userData.basePosition as THREE.Vector3;
        flashlightObject.position.y = THREE.MathUtils.lerp(flashlightObject.position.y, base.y + (usingFlashlight ? 0.22 + actionBeat * 0.05 : 0), 0.18);
        flashlightObject.rotation.y = THREE.MathUtils.lerp(flashlightObject.rotation.y, usingFlashlight ? Math.sin(frame * 7) * 0.55 : 0, 0.18);
      }

      const orangeKeyObject = sourceItemRefs.current['Оранжевый ключ'];
      if (orangeKeyObject) {
        const takingOrangeKey = activeTarget === 'orangeKeyTake';
        const base = orangeKeyObject.userData.basePosition as THREE.Vector3 | undefined;
        const baseRotation = orangeKeyObject.userData.baseRotation as THREE.Euler | undefined;
        if (base && baseRotation) {
          orangeKeyObject.position.x = THREE.MathUtils.lerp(
            orangeKeyObject.position.x,
            base.x + (takingOrangeKey ? 0.24 + actionBeat * 0.04 : 0),
            0.18,
          );
          orangeKeyObject.position.y = THREE.MathUtils.lerp(
            orangeKeyObject.position.y,
            base.y + (takingOrangeKey ? 0.16 + actionBeat * 0.08 : 0),
            0.18,
          );
          orangeKeyObject.rotation.z = THREE.MathUtils.lerp(
            orangeKeyObject.rotation.z,
            baseRotation.z + (takingOrangeKey ? Math.sin(frame * 12) * 0.45 : 0),
            0.22,
          );
        }
      }

      const switchLever = interactionObjectRefs.current.switchLever;
      if (switchLever) {
        const flipping = activeTarget === 'switch';
        switchLever.rotation.z = THREE.MathUtils.lerp(switchLever.rotation.z, flipping ? -0.78 + actionBeat * 0.22 : 0, 0.2);
      }

      const cameraStation = interactionObjectRefs.current.cameraStation as THREE.Group | undefined;
      const cameraScreen = cameraStation?.userData.screen as THREE.Mesh | undefined;
      const cameraKnob = cameraStation?.userData.knob as THREE.Object3D | undefined;
      if (cameraStation && cameraScreen && cameraKnob) {
        const tuning = activeTarget === 'cameraTune' || activeTarget === 'camera';
        cameraKnob.rotation.y = THREE.MathUtils.lerp(cameraKnob.rotation.y, tuning ? frame * 4 : 0, 0.28);
        cameraScreen.scale.y = THREE.MathUtils.lerp(cameraScreen.scale.y, tuning ? 1 + actionBeat * 0.12 : 1, 0.18);
        if (cameraScreen.material instanceof THREE.MeshStandardMaterial) {
          cameraScreen.material.emissive.setHex(tuning ? 0x1d6d55 : 0x000000);
          cameraScreen.material.emissiveIntensity = tuning ? 0.85 + actionBeat * 0.35 : 0;
        }
      }

      const gate = interactionObjectRefs.current.gate as THREE.Group | undefined;
      const gateLeft = gate?.userData.left as THREE.Object3D | undefined;
      const gateRight = gate?.userData.right as THREE.Object3D | undefined;
      if (gateLeft && gateRight) {
        const openingGate = activeTarget === 'gateRun' || activeTarget === 'gate';
        gateLeft.rotation.y = THREE.MathUtils.lerp(gateLeft.rotation.y, openingGate ? -1.18 - actionBeat * 0.12 : -0.72, 0.14);
        gateRight.rotation.y = THREE.MathUtils.lerp(gateRight.rotation.y, openingGate ? 1.18 + actionBeat * 0.12 : 0.72, 0.14);
      }

      const vacuumObject = ghostVacuumRef.current;
      if (vacuumObject) {
        const takingVacuum = activeTarget === 'ghostVacuum';
        vacuumObject.rotation.z = THREE.MathUtils.lerp(vacuumObject.rotation.z, takingVacuum ? Math.sin(frame * 8) * 0.18 : 0, 0.16);
        vacuumObject.position.y = THREE.MathUtils.lerp(vacuumObject.position.y, takingVacuum ? 1.58 + actionBeat * 0.12 : 1.48, 0.16);
      }

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
      if (orangeKeyShelfDoorRef.current) {
        const unlockingOutdoorShelf = actionActiveRef.current && actionTargetRef.current === 'orangeKeyUnlock';
        const targetRotation = unlockingOutdoorShelf || orangeKeyShelfUnlockedRef.current ? -1.18 : 0;
        orangeKeyShelfDoorRef.current.rotation.y = THREE.MathUtils.lerp(
          orangeKeyShelfDoorRef.current.rotation.y,
          targetRotation,
          0.12,
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
          const listening = activeTarget === 'hallListen' || activeTarget === 'hall';
          const sign = door.userData.opensLeft ? -1 : 1;
          const targetRotation = listening ? sign * (0.18 + Math.sin(frame * 9) * 0.05) : nearby ? sign * 1.18 : 0;
          door.rotation.y = THREE.MathUtils.lerp(door.rotation.y, targetRotation, listening ? 0.18 : 0.1);
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
          else {
            const handParts = firstPersonHandsRef.current.userData.parts as FirstPersonHandsParts;
            if (handParts.heldItemSlot.children.length > 0) {
              updateHeldItemHand(firstPersonHandsRef.current, frame, heldItemRef.current);
            }
            else firstPersonHandsRef.current.visible = false;
          }
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
      if (targetGlowRef.current) {
        targetGlowRef.current.visible = objectiveHintVisibleRef.current && !actionActiveRef.current;
        const target = hotspots[currentTargetRef.current];
        const world = target ? toWorld(target) : { x: 0, z: 0 };
        const pulse = 1 + Math.sin(frame * 3.4) * 0.08;
        targetGlowRef.current.position.set(world.x, 0.055, world.z);
        targetGlowRef.current.scale.setScalar(pulse);
        const ring = targetGlowRef.current.userData.ring as THREE.Mesh | undefined;
        const inner = targetGlowRef.current.userData.inner as THREE.Mesh | undefined;
        const light = targetGlowRef.current.userData.light as THREE.PointLight | undefined;
        if (ring?.material instanceof THREE.Material) ring.material.opacity = actionActiveRef.current ? 0.18 : 0.62;
        if (inner?.material instanceof THREE.Material) inner.material.opacity = actionActiveRef.current ? 0.05 : 0.12;
        if (light) light.intensity = actionActiveRef.current ? 0.35 : 0.9 + Math.sin(frame * 2.5) * 0.18;
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
      document.removeEventListener('mousemove', onLockedMouseMove);
      if (document.pointerLockElement === mount) document.exitPointerLock();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
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

    layer.children.forEach(disposeObject);
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
    currentTargetRef.current = currentTarget;
  }, [currentTarget]);

  useEffect(() => {
    objectiveHintVisibleRef.current = objectiveHintVisible;
  }, [objectiveHintVisible]);

  useEffect(() => {
    shadowPointRef.current = shadowPoint;
    shadowVisibleRef.current = shadowVisible;
    shadowAttackingRef.current = shadowAttacking;
  }, [shadowAttacking, shadowPoint, shadowVisible]);

  useEffect(() => {
    heldItemRef.current = inventory[0];
    hasGhostKeyRef.current = inventory.includes('Ключ от стеклянной полки');
    hasGhostVacuumRef.current =
      inventory.includes('Пылесос для привидений') ||
      droppedItems.some((item) => item.item === 'Пылесос для привидений');

    const handParts = firstPersonHandsRef.current?.userData.parts as FirstPersonHandsParts | undefined;
    if (handParts) {
      handParts.heldItemSlot.children.forEach(disposeObject);
      handParts.heldItemSlot.clear();
      if (inventory[0]) handParts.heldItemSlot.add(createHeldItemModel(inventory[0]));
    }

    const movedItems = new Set([...inventory, ...droppedItems.map((item) => item.item)]);
    Object.entries(sourceItemRefs.current).forEach(([item, object]) => {
      if (!object) return;
      const consumedOrangeKey = item === 'Оранжевый ключ' && orangeKeyShelfUnlocked;
      const consumedGlassKey = item === 'Ключ от стеклянной полки' && ghostCabinetUnlocked;
      object.visible = !movedItems.has(item) && !consumedOrangeKey && !consumedGlassKey;
    });
  }, [droppedItems, ghostCabinetUnlocked, inventory, orangeKeyShelfUnlocked]);

  useEffect(() => {
    ghostCabinetUnlockedRef.current = ghostCabinetUnlocked;
  }, [ghostCabinetUnlocked]);

  useEffect(() => {
    orangeKeyShelfUnlockedRef.current = orangeKeyShelfUnlocked;
  }, [orangeKeyShelfUnlocked]);

  useEffect(() => {
    if (lampRef.current) {
      lampRef.current.intensity = lightOn ? 5.0 + fear / 70 : 0.65;
      lampRef.current.distance = lightOn ? 12 : 4;
    }
    if (flashlightRef.current) {
      const holdingFlashlight = itemMatches(inventory[0], ['Фонар']);
      flashlightRef.current.intensity = holdingFlashlight ? (lightOn ? 1.4 : 5.2) : lightOn ? 0.12 : 3.2;
      flashlightRef.current.distance = holdingFlashlight ? (lightOn ? 7 : 13) : lightOn ? 4 : 10;
    }
  }, [fear, inventory, lightOn]);

  useEffect(() => {
    if (coffeeLiquidRef.current) coffeeLiquidRef.current.visible = !coffeeDrunk;
  }, [coffeeDrunk]);

  useEffect(() => {
    if (doubleRef.current) doubleRef.current.visible = shadowVisible;
  }, [shadowVisible]);

  return <div className="three-archive" ref={mountRef} />;
}

export const ThreeArchive = memo(ThreeArchiveComponent);

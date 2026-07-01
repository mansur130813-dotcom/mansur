import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  cameraFeeds,
  collisionRects,
  hotspots,
  objectives,
  roomSize,
  type CollisionRect,
  type Ending,
  type HotspotId,
  type Point,
} from '../gameData';
import type { SoundCue } from './useGameSound';

const startPoint: Point = { x: 450, y: 470 };
const step = 24;
const reach = 72;
const playerRadius = 14;
const moveCooldownMs = 145;
const startMessage = 'WASD или стрелки — идти. E — взаимодействовать.';
const startJournal = '00:00. Смена началась. В журнале уже стоит твоя подпись.';

type ActionState = {
  target: HotspotId | 'deskSort' | 'deskOpen';
  label: string;
  progress: number;
};

type CameraViewerState = {
  open: boolean;
  index: number;
};

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function touchesRect(point: Point, rect: CollisionRect) {
  const closestX = clamp(point.x, rect.x, rect.x + rect.width);
  const closestY = clamp(point.y, rect.y, rect.y + rect.height);
  return distance(point, { x: closestX, y: closestY }) < playerRadius;
}

function canStandAt(point: Point) {
  return !collisionRects.some((rect) => touchesRect(point, rect));
}

function actionLabel(id: HotspotId) {
  const labels: Record<HotspotId, string> = {
    boxes: 'Поднимаешь коробку, вскрываешь крышку и достаёшь свою папку',
    desk: 'Раскладываешь документы по стопкам и сверяешь номера дел',
    coffee: 'Берёшь чашку, делаешь глоток и ставишь её обратно на стол',
    switch: 'Тянешься одной рукой и щёлкаешь выключателем',
    shelves: 'Проводишь рукой по полкам и вытаскиваешь нужную папку',
    hall: 'Останавливаешься и прислушиваешься к шагам в коридоре',
    camera: 'Включаешь монитор, крутишь ручки и настраиваешь камеры',
    redFolder: 'Аккуратно берёшь красную папку и проверяешь печать',
    case417: 'Открываешь дело №417 и перелистываешь страницы',
    flashlight: 'Берёшь фонарик, проверяешь батарейку и луч света',
    incinerator: 'Открываешь урну и готовишь папку к уничтожению',
    exit: 'Дёргаешь ручку двери и проверяешь замок',
  };

  return labels[id];
}

function deskActionTarget(objectiveIndex: number) {
  return objectiveIndex === 2 ? 'deskSort' : 'deskOpen';
}

function deskActionLabel(objectiveIndex: number) {
  return objectiveIndex === 2
    ? 'Поднимаешь документы, выравниваешь их и опускаешь стопками на стол'
    : 'Одной рукой раскрываешь папку, лежащую на столе, и заглядываешь внутрь';
}

type GameOptions = {
  active: boolean;
  playSound: (cue: SoundCue) => void;
};

export function useArchiveGame({ active, playSound }: GameOptions) {
  const [player, setPlayer] = useState(startPoint);
  const viewYawRef = useRef(0.28);
  const lastMoveAtRef = useRef(0);
  const actionTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const actionIntervalRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const [objectiveIndex, setObjectiveIndex] = useState(0);
  const [lightOn, setLightOn] = useState(true);
  const [records, setRecords] = useState(0);
  const [inventory, setInventory] = useState<string[]>([]);
  const [message, setMessage] = useState(startMessage);
  const [journal, setJournal] = useState<string[]>([startJournal]);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [action, setAction] = useState<ActionState | null>(null);
  const [cameraViewer, setCameraViewer] = useState<CameraViewerState>({ open: false, index: 0 });

  const objective = objectives[objectiveIndex] ?? objectives[objectives.length - 1];
  const finalMode = objectiveIndex === objectives.length;
  const fear = useMemo(() => {
    const base = finalMode ? 100 : objective.fear;
    return clamp(base + (lightOn ? 0 : 8) + records * 2, 0, 100);
  }, [finalMode, lightOn, objective.fear, records]);

  function addJournal(entry: string) {
    setJournal((current) => [entry, ...current].slice(0, 6));
  }

  function clearActionTimers() {
    if (actionTimerRef.current) window.clearTimeout(actionTimerRef.current);
    if (actionIntervalRef.current) window.clearInterval(actionIntervalRef.current);
    actionTimerRef.current = null;
    actionIntervalRef.current = null;
  }

  function beginAction(
    target: HotspotId,
    onComplete: () => void,
    duration = 1450,
    poseTarget: ActionState['target'] = target,
    customLabel = actionLabel(target),
  ) {
    clearActionTimers();
    const startedAt = Date.now();
    const label = customLabel;
    setAction({ target: poseTarget, label, progress: 0 });
    playSound('interact');
    if (target === 'hall') playSound('voiceAaa');
    if (target === 'redFolder') playSound('voiceCheck');

    actionIntervalRef.current = window.setInterval(() => {
      const progress = Math.min(100, ((Date.now() - startedAt) / duration) * 100);
      setAction({ target: poseTarget, label, progress });
    }, 50);

    actionTimerRef.current = window.setTimeout(() => {
      clearActionTimers();
      setAction(null);
      onComplete();
    }, duration);
  }

  function move(dx: number, dy: number) {
    if (!active || action) return;
    const now = Date.now();
    if (now - lastMoveAtRef.current < moveCooldownMs) return;
    lastMoveAtRef.current = now;

    const viewYaw = viewYawRef.current;
    const worldDx = dx * Math.cos(viewYaw) + dy * Math.sin(viewYaw);
    const worldDy = -dx * Math.sin(viewYaw) + dy * Math.cos(viewYaw);

    playSound('move');
    setPlayer((current) => {
      const nextX = clamp(current.x + worldDx * step, 54, roomSize.width - 54);
      const nextY = clamp(current.y + worldDy * step, 54, roomSize.height - 54);
      const direct = { x: nextX, y: nextY };
      if (canStandAt(direct)) return direct;

      const slideX = { x: nextX, y: current.y };
      if (canStandAt(slideX)) return slideX;

      const slideY = { x: current.x, y: nextY };
      if (canStandAt(slideY)) return slideY;

      return current;
    });
  }

  function addInventory(item: string) {
    setInventory((items) => [...new Set([...items, item])]);
  }

  function finishObjective() {
    setMessage(objective.success);
    addJournal(`${objective.night}. ${objective.title}: выполнено.`);
    playSound(objective.target === 'camera' ? 'camera' : 'paper');

    if (objective.item) addInventory(objective.item);
    if (objective.record) setRecords((count) => Math.min(3, count + 1));
    if (objective.target === 'switch') setLightOn(true);
    if (objective.blackout) {
      playSound('blackout');
      setLightOn(false);
    }

    setObjectiveIndex((index) => index + 1);
  }

  function inspectFreeHotspot(id: HotspotId) {
    const lines: Record<HotspotId, string> = {
      boxes: 'Коробки пахнут мокрым картоном. На дне одной лежит пустой бейдж.',
      desk: 'На столе бумаги возвращаются к одному и тому же порядку.',
      coffee: 'Кофе холодный, хотя ты только что его налил.',
      switch: lightOn ? 'Свет гудит и держится.' : 'Лампы вспыхивают не сразу.',
      shelves: 'Между папками кто-то оставил свежий след пальца.',
      hall: 'Коридор отвечает тишиной, слишком аккуратной для тишины.',
      camera: 'На мониторе помехи складываются в твой силуэт.',
      redFolder: 'Красная печать выглядит мягкой. Ее хочется вскрыть.',
      case417: 'Дело №417 ждет, пока ты дочитаешь остальные бумаги.',
      flashlight: 'Фонарик лежит рядом со стопкой документов. Батарейки внутри уже теплые.',
      incinerator: 'Металлическая урна еще теплая.',
      exit: 'Дверь не открывается. Смена должна быть закрыта.',
    };

    if (id === 'switch') setLightOn((value) => !value);
    playSound(id === 'camera' ? 'camera' : 'interact');
    setMessage(lines[id]);
  }

  function openCameraViewer() {
    playSound('camera');
    setCameraViewer({ open: true, index: 0 });
    setMessage('Мониторы включились. Переключай камеры и ищи странности на записи.');
  }

  function closeCameraViewer() {
    setCameraViewer((current) => ({ ...current, open: false }));
  }

  function nextCamera() {
    playSound('camera');
    setCameraViewer((current) => ({
      open: true,
      index: (current.index + 1) % cameraFeeds.length,
    }));
  }

  function previousCamera() {
    playSound('camera');
    setCameraViewer((current) => ({
      open: true,
      index: (current.index - 1 + cameraFeeds.length) % cameraFeeds.length,
    }));
  }

  function confirmCameraFinding() {
    if (!cameraViewer.open) return;
    if (!finalMode && objective.target === 'camera') finishObjective();
    else setMessage('Ты отметил запись, но это пока не помогает текущему заданию.');
  }

  function chooseFinal(id: HotspotId) {
    if (id === 'redFolder') {
      playSound('ending');
      setEnding('bad');
    } else if (id === 'incinerator' && inventory.includes('Личное дело №417')) {
      playSound('ending');
      setEnding('good');
    } else if (id === 'exit' && records >= 3 && inventory.includes('Пустое дело №418')) {
      playSound('ending');
      setEnding('secret');
    } else {
      setMessage('Архив не отпускает. Нужны дело №417, записи или неправильный выбор.');
    }
  }

  function interact() {
    if (!active || action) return;
    const closest = Object.entries(hotspots).reduce(
      (best, [id, spot]) => {
        const gap = distance(player, spot);
        return gap < best.gap ? { id: id as HotspotId, gap } : best;
      },
      { id: objective.target, gap: Number.POSITIVE_INFINITY },
    );

    if (closest.gap > reach) {
      setMessage('Слишком далеко. Подойди ближе к предмету.');
      return;
    }

    if (closest.id === 'camera') {
      beginAction(closest.id, openCameraViewer, 900);
      return;
    }

    if (finalMode) beginAction(closest.id, () => chooseFinal(closest.id));
    else if (closest.id === objective.target && closest.id === 'desk') {
      beginAction(closest.id, finishObjective, 1450, deskActionTarget(objectiveIndex), deskActionLabel(objectiveIndex));
    } else if (closest.id === objective.target) beginAction(closest.id, finishObjective);
    else beginAction(closest.id, () => inspectFreeHotspot(closest.id), 950);
  }

  function restart() {
    clearActionTimers();
    setPlayer(startPoint);
    setObjectiveIndex(0);
    setLightOn(true);
    setRecords(0);
    setInventory([]);
    setMessage(startMessage);
    setJournal([startJournal]);
    setEnding(null);
    setAction(null);
    setCameraViewer({ open: false, index: 0 });
    viewYawRef.current = 0.28;
  }

  const setViewYaw = useCallback((yaw: number) => {
    viewYawRef.current = yaw;
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const keys: Record<string, [number, number]> = {
        ArrowUp: [0, -1], w: [0, -1], ц: [0, -1],
        ArrowDown: [0, 1], s: [0, 1], ы: [0, 1],
        ArrowLeft: [-1, 0], a: [-1, 0], ф: [-1, 0],
        ArrowRight: [1, 0], d: [1, 0], в: [1, 0],
      };
      if (event.key === 'e' || event.key === 'у' || event.key === 'Enter') interact();
      else if (keys[event.key]) move(...keys[event.key]);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  useEffect(() => () => clearActionTimers(), []);

  return {
    player,
    objective,
    finalMode,
    lightOn,
    records,
    inventory,
    message,
    journal,
    ending,
    fear,
    action,
    cameraFeeds,
    cameraViewer,
    move,
    setViewYaw,
    interact,
    closeCameraViewer,
    nextCamera,
    previousCamera,
    confirmCameraFinding,
    restart,
  };
}

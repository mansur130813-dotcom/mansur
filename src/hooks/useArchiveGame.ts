import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  cameraFeeds,
  collisionRects,
  hotspots,
  objectives,
  roomSize,
  type CollisionRect,
  type DroppedItem,
  type Ending,
  type HotspotId,
  type Point,
} from '../gameData';
import type { SoundCue } from './useGameSound';

const startPoint: Point = { x: 450, y: 470 };
const step = 24;
const reach = 72;
const playerRadius = 10;
const moveCooldownMs = 145;
const indoorMin = 28;
const indoorMaxX = roomSize.width - 28;
const indoorMaxY = roomSize.height - 28;
const outsideMaxY = 1340;
const exitCenterX = 450;
const exitHalfWidth = 58;
const pathHalfWidth = 92;
const startMessage = 'WASD или стрелки - идти. E - взаимодействовать.';
const startJournal = '00:00. Смена началась. В журнале уже стоит твоя подпись.';

type ActionState = {
  target:
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

function clampWalkTarget(point: Point, exitOpen: boolean, current?: Point): Point {
  const y = clamp(point.y, indoorMin, outsideMaxY);
  if (!exitOpen && y > indoorMaxY) {
    return { x: clamp(point.x, indoorMin, indoorMaxX), y: indoorMaxY };
  }
  if (current && current.y <= indoorMaxY && y > indoorMaxY && Math.abs(current.x - exitCenterX) > exitHalfWidth) {
    return { x: clamp(point.x, indoorMin, indoorMaxX), y: indoorMaxY };
  }

  const outside = y > indoorMaxY;
  const halfWidth = y < roomSize.height + 56 ? exitHalfWidth : pathHalfWidth;

  return {
    x: outside ? clamp(point.x, exitCenterX - halfWidth, exitCenterX + halfWidth) : clamp(point.x, indoorMin, indoorMaxX),
    y,
  };
}

function interactionSpots(): Array<{ id: HotspotId; spot: Point }> {
  return [
    ...Object.entries(hotspots).map(([id, spot]) => ({ id: id as HotspotId, spot })),
    { id: 'shelves' as const, spot: { x: 118, y: 204 } },
    { id: 'shelves' as const, spot: { x: 780, y: 204 } },
  ];
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
    gate: 'Толкаешь белые ворота и выбегаешь наружу',
    ghostKey: 'Открываешь уличную полку и берёшь ключ',
    ghostVacuum: 'Открываешь стеклянный шкаф и берёшь пылесос',
  };

  return labels[id];
}

function stepToward(from: Point, to: Point, amount: number): Point {
  const gap = distance(from, to);
  if (gap <= amount || gap === 0) return to;
  return {
    x: from.x + ((to.x - from.x) / gap) * amount,
    y: from.y + ((to.y - from.y) / gap) * amount,
  };
}

function objectiveAction(objectiveIndex: number, target: HotspotId): Pick<ActionState, 'target' | 'label'> {
  const actions: Partial<Record<number, Pick<ActionState, 'target' | 'label'>>> = {
    0: {
      target: 'boxesUnpack',
      label: 'Снимаешь мокрую ленту, открываешь коробку и вытаскиваешь папку со своим именем.',
    },
    1: {
      target: 'switch',
      label: 'Нащупываешь выключатель одной рукой и включаешь свет, пока лампы щёлкают по очереди.',
    },
    2: {
      target: 'deskSort',
      label: 'Поднимаешь стопку документов, выравниваешь листы и опускаешь их на стол по номерам.',
    },
    3: {
      target: 'deskOpen',
      label: 'Одной рукой раскрываешь папку на столе и придерживаешь страницу, чтобы увидеть фотографию.',
    },
    4: {
      target: 'coffeeMirror',
      label: 'Подносишь чашку к лицу и смотришь в тёмное отражение кофе, прежде чем сделать глоток.',
    },
    5: {
      target: 'hallListen',
      label: 'Замираешь у коридора, прикладываешь руку к уху и шёпотом выдыхаешь: aaa.',
    },
    6: {
      target: 'redSeal',
      label: 'Берёшь красную папку с полки, проверяешь печать и говоришь: ok, let us check it.',
    },
    7: {
      target: 'cameraTune',
      label: 'Включаешь монитор, крутишь ручки и переключаешь каналы камер по всему архиву.',
    },
    8: {
      target: 'shelvesDust',
      label: 'Проводишь пальцами по пыльным полкам, находишь свежий след и вытаскиваешь дело №418.',
    },
    9: {
      target: 'case417Read',
      label: 'Срываешь верёвку с дела №417 и листаешь страницы, пока дата смерти не совпадает с завтрашним днём.',
    },
    10: {
      target: 'flashlightBeam',
      label: 'Вставляешь батарейку, щёлкаешь кнопкой и ведёшь лучом фонарика по стеллажам.',
    },
  };

  return actions[objectiveIndex] ?? { target, label: actionLabel(target) };
}

function finalAction(id: HotspotId): Pick<ActionState, 'target' | 'label'> {
  if (id === 'incinerator') {
    return {
      target: 'incineratorBurn',
      label: 'Открываешь урну, кладёшь дело №417 внутрь и ждёшь, пока красный свет погаснет.',
    };
  }
  if (id === 'exit') {
    return {
      target: 'exitUnlock',
      label: 'Сверяешь три скрытые записи, вставляешь пустую папку №418 в щель и отпираешь дверь.',
    };
  }
  if (id === 'redFolder') {
    return {
      target: 'redSeal',
      label: 'Ломаешь красную печать, хотя архив будто задерживает твою руку.',
    };
  }
  if (id === 'gate') {
    return {
      target: 'gateRun',
      label: 'Ты толкаешь белые ворота плечом и выбегаешь на дорогу, не оглядываясь назад.',
    };
  }

  return { target: id, label: actionLabel(id) };
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
  const jumpscareTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const [objectiveIndex, setObjectiveIndex] = useState(0);
  const [lightOn, setLightOn] = useState(true);
  const [records, setRecords] = useState(0);
  const [inventory, setInventory] = useState<string[]>([]);
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([]);
  const [message, setMessage] = useState(startMessage);
  const [journal, setJournal] = useState<string[]>([startJournal]);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [action, setAction] = useState<ActionState | null>(null);
  const [cameraViewer, setCameraViewer] = useState<CameraViewerState>({ open: false, index: 0 });
  const [exitOpen, setExitOpen] = useState(false);
  const [shadowPoint, setShadowPoint] = useState<Point>({ x: 452, y: 92 });
  const [shadowAwake, setShadowAwake] = useState(false);
  const [shadowDefeated, setShadowDefeated] = useState(false);
  const [jumpscare, setJumpscare] = useState(false);

  const objective = objectives[objectiveIndex] ?? objectives[objectives.length - 1];
  const finalMode = objectiveIndex === objectives.length;
  const coffeeDrunk = objectiveIndex > 4;
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
    if (jumpscareTimerRef.current) window.clearTimeout(jumpscareTimerRef.current);
    actionTimerRef.current = null;
    actionIntervalRef.current = null;
    jumpscareTimerRef.current = null;
  }

  function beginAction(
    target: HotspotId,
    onComplete: () => void,
    duration = 3200,
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
    if (!active || action || jumpscare) return;
    const now = Date.now();
    if (now - lastMoveAtRef.current < moveCooldownMs) return;
    lastMoveAtRef.current = now;

    const viewYaw = viewYawRef.current;
    const worldDx = dx * Math.cos(viewYaw) + dy * Math.sin(viewYaw);
    const worldDy = -dx * Math.sin(viewYaw) + dy * Math.cos(viewYaw);

    playSound('move');
    setPlayer((current) => {
      const direct = clampWalkTarget(
        {
          x: current.x + worldDx * step,
          y: current.y + worldDy * step,
        },
        exitOpen,
        current,
      );
      if (canStandAt(direct)) return direct;

      const slideX = clampWalkTarget({ x: direct.x, y: current.y }, exitOpen, current);
      if (canStandAt(slideX)) return slideX;

      const slideY = clampWalkTarget({ x: current.x, y: direct.y }, exitOpen, current);
      if (canStandAt(slideY)) return slideY;

      return current;
    });
  }

  function droppedItem(item: string, point: Point): DroppedItem {
    return { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, item, point };
  }

  function itemIsInWorld(item: string) {
    return inventory.includes(item) || droppedItems.some((dropped) => dropped.item === item);
  }

  function addInventory(item: string, dropPoint = player) {
    setInventory((current) => {
      const held = current[0];
      if (held && held !== item) {
        setDroppedItems((items) => [droppedItem(held, dropPoint), ...items]);
      }
      return [item];
    });
    if (item === 'Пылесос для привидений') {
      setShadowAwake(true);
      setShadowPoint({ x: 452, y: 92 });
      setMessage('Пылесос щёлкает и оживает. Силуэт в коридоре наконец замечает тебя.');
    }
  }

  function dropInventory() {
    if (!inventory.length || action || jumpscare) return;
    const item = inventory[0];
    setInventory([]);
    setDroppedItems((items) => [droppedItem(item, player), ...items]);
    playSound('interact');
    setMessage(`${item} лежит на полу. Ты можешь снова подобрать его.`);
  }

  function pickDroppedItem(id: string) {
    const found = droppedItems.find((item) => item.id === id);
    if (!found) return;
    setDroppedItems((items) => items.filter((item) => item.id !== id));
    addInventory(found.item, found.point);
    playSound('interact');
    setMessage(`${found.item} снова у тебя.`);
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
      gate: 'Белые ворота ведут наружу. Если откроешь их, смена закончится.',
      ghostKey: itemIsInWorld('Ключ от стеклянной полки')
        ? 'Уличная полка открыта. Маленький латунный ключ уже у тебя.'
        : 'Ты открываешь уличную полку, цепляешь ключ двумя пальцами и прячешь его в ладони.',
      ghostVacuum: itemIsInWorld('Пылесос для привидений')
        ? 'Стеклянный шкаф пуст. Пылесос для привидений уже у тебя.'
        : inventory.includes('Ключ от стеклянной полки')
          ? 'Ключ дважды проворачивается. Стеклянная дверца открывается, и ты снимаешь пылесос с крюка.'
          : 'Пылесос заперт за стеклом. Нужен ключ с уличной полки.',
    };

    if (id === 'switch') setLightOn((value) => !value);
    if (id === 'ghostKey' && !itemIsInWorld('Ключ от стеклянной полки')) addInventory('Ключ от стеклянной полки');
    if (id === 'ghostVacuum' && inventory.includes('Ключ от стеклянной полки') && !itemIsInWorld('Пылесос для привидений')) {
      addInventory('Пылесос для привидений');
    }
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
    } else if (id === 'gate') {
      playSound('ending');
      setEnding('good');
    } else if (id === 'incinerator' && inventory.includes('Личное дело №417')) {
      setMessage('Урна больше не спасает. Хороший выход теперь снаружи, через белые ворота.');
    } else if (id === 'exit' && records >= 3) {
      setMessage('Выход больше не даёт другой концовки. Попробуй сделать выбор у красной папки или беги к белым воротам.');
    } else {
      setMessage('Архив не отпускает. Нужны дело №417, записи или неправильный выбор.');
    }
  }

  function defeatShadow() {
    setShadowDefeated(true);
    setShadowAwake(false);
    playSound('ending');
    setEnding('secret');
  }

  function restartAfterShadowAttack() {
    clearActionTimers();
    setAction(null);
    setJumpscare(true);
    playSound('scream');
    jumpscareTimerRef.current = window.setTimeout(() => {
      setPlayer(startPoint);
      setObjectiveIndex(0);
      setLightOn(true);
      setRecords(0);
      setInventory([]);
      setDroppedItems([]);
      setShadowPoint({ x: 452, y: 92 });
      setShadowAwake(false);
      setShadowDefeated(false);
      setJumpscare(false);
      setMessage('Силуэт поймал тебя. Архив начинает смену сначала.');
      setJournal([startJournal]);
      setEnding(null);
      setAction(null);
      setCameraViewer({ open: false, index: 0 });
      setExitOpen(false);
      viewYawRef.current = 0.28;
      jumpscareTimerRef.current = null;
    }, 1400);
  }

  function interact() {
    if (!active || action || jumpscare) return;
    const shadowGap = distance(player, shadowPoint);
    if (shadowAwake && !shadowDefeated && shadowGap <= reach) {
      if (inventory.includes('Пылесос для привидений')) {
        beginAction(
          'ghostVacuum',
          defeatShadow,
          3800,
          'vacuumSuck',
          'Ты упираешься ногами, крепко держишь пылесос и разрываешь силуэт на яркую бумажную бурю.',
        );
      } else {
        setMessage('Силуэт слишком близко. Тебе нужен пылесос в руках.');
      }
      return;
    }

    const closestDropped = droppedItems.reduce(
      (best, item) => {
        const gap = distance(player, item.point);
        return gap < best.gap ? { id: item.id, gap } : best;
      },
      { id: '', gap: Number.POSITIVE_INFINITY },
    );

    if (closestDropped.id && closestDropped.gap <= reach) {
      pickDroppedItem(closestDropped.id);
      return;
    }

    const closest = interactionSpots().reduce(
      (best, { id, spot }) => {
        const gap = distance(player, spot);
        return gap < best.gap ? { id, gap } : best;
      },
      { id: objective.target, gap: Number.POSITIVE_INFINITY } as { id: HotspotId; gap: number },
    );

    if (closest.gap > reach) {
      setMessage('Слишком далеко. Подойди ближе к предмету.');
      return;
    }

    if (closest.id === 'camera') {
      const cameraAction = objectiveAction(objectiveIndex, closest.id);
      beginAction(closest.id, openCameraViewer, 2800, cameraAction.target, cameraAction.label);
      return;
    }

    if (closest.id === 'ghostVacuum' && !inventory.includes('Ключ от стеклянной полки') && !itemIsInWorld('Пылесос для привидений')) {
      beginAction(
        closest.id,
        () => inspectFreeHotspot(closest.id),
        900,
        'ghostKey',
        'На стеклянной дверце замок. Ты тянешь её рукой, но она не открывается.',
      );
      return;
    }

    if (closest.id === 'ghostKey') {
      beginAction(
        closest.id,
        () => inspectFreeHotspot(closest.id),
        2100,
        'keyTake',
        'Ты открываешь уличную полку, снимаешь ключ с крючка и крутишь его в пальцах.',
      );
      return;
    }

    if (closest.id === 'ghostVacuum') {
      beginAction(
        closest.id,
        () => inspectFreeHotspot(closest.id),
        3300,
        inventory.includes('Ключ от стеклянной полки') ? 'vacuumUnlock' : 'ghostKey',
        inventory.includes('Ключ от стеклянной полки')
          ? 'Ты вставляешь латунный ключ в замок, открываешь стекло и снимаешь пылесос.'
          : 'На стеклянной дверце замок. Ты тянешь её рукой, но она не открывается.',
      );
      return;
    }

    if (finalMode) {
      const action = finalAction(closest.id);
      beginAction(
        closest.id,
        () => {
          if (closest.id === 'exit' && !exitOpen) {
            setExitOpen(true);
            setMessage('Финал начался. Дверь открыта: можно бежать к белым воротам или вернуться к красной папке для плохой концовки.');
            return;
          }
          chooseFinal(closest.id);
        },
        3400,
        action.target,
        action.label,
      );
    } else if (closest.id === 'exit') {
      beginAction(closest.id, () => inspectFreeHotspot(closest.id), 1300);
    } else if (closest.id === objective.target && closest.id === 'desk') {
      const action = objectiveAction(objectiveIndex, closest.id);
      beginAction(closest.id, finishObjective, 3200, action.target, action.label);
    } else if (closest.id === objective.target) {
      const action = objectiveAction(objectiveIndex, closest.id);
      beginAction(closest.id, finishObjective, 3200, action.target, action.label);
    }
    else beginAction(closest.id, () => inspectFreeHotspot(closest.id), 1300);
  }

  function restart() {
    clearActionTimers();
    setPlayer(startPoint);
    setObjectiveIndex(0);
    setLightOn(true);
    setRecords(0);
    setInventory([]);
    setDroppedItems([]);
    setMessage(startMessage);
    setJournal([startJournal]);
    setEnding(null);
    setJumpscare(false);
    setAction(null);
    setCameraViewer({ open: false, index: 0 });
    setExitOpen(false);
    viewYawRef.current = 0.28;
  }

  const setViewYaw = useCallback((yaw: number) => {
    viewYawRef.current = yaw;
  }, []);

  useEffect(() => {
    if (!active || !shadowAwake || shadowDefeated || ending || action?.target === 'vacuumSuck') return undefined;

    const attack = window.setInterval(() => {
      const gap = distance(shadowPoint, player);
      if (gap < 34) {
        restartAfterShadowAttack();
        return;
      }
      setShadowPoint((current) => stepToward(current, player, 18));
    }, 420);

    return () => window.clearInterval(attack);
  }, [action?.target, active, ending, player, shadowAwake, shadowDefeated, shadowPoint]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const keys: Record<string, [number, number]> = {
        ArrowUp: [0, -1], w: [0, -1], ц: [0, -1],
        ArrowDown: [0, 1], s: [0, 1], ы: [0, 1],
        ArrowLeft: [-1, 0], a: [-1, 0], ф: [-1, 0],
        ArrowRight: [1, 0], d: [1, 0], в: [1, 0],
      };
      if (event.key === 'e' || event.key === 'у' || event.key === 'Enter') interact();
      else if (event.key === 'q' || event.key === 'й') dropInventory();
      else if (keys[event.key]) move(...keys[event.key]);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  useEffect(() => () => clearActionTimers(), []);

  const shadowVisible =
    !shadowDefeated && (shadowAwake || objective.target === 'hall' || action?.target === 'hallListen' || finalMode);

  return {
    player,
    objective,
    finalMode,
    coffeeDrunk,
    lightOn,
    records,
    inventory,
    droppedItems,
    shadowPoint,
    shadowVisible,
    shadowAttacking: shadowAwake && !shadowDefeated,
    jumpscare,
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
    dropInventory,
    closeCameraViewer,
    nextCamera,
    previousCamera,
    confirmCameraFinding,
    restart,
  };
}

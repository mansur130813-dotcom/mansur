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
const shadowAttackStep = 34;
const shadowAttackIntervalMs = 220;
const indoorMin = 28;
const indoorMaxX = roomSize.width - 28;
const indoorMaxY = roomSize.height - 28;
const outsideMaxY = 1340;
const exitCenterX = 450;
const exitHalfWidth = 58;
const pathHalfWidth = 92;
const startMessage = 'WASD или стрелки - идти. E - взаимодействовать. Q - бросить предмет.';
const startJournal = '00:00. Смена началась. В журнале уже стоит твоя подпись.';

export type GameSettings = {
  hintsEnabled: boolean;
  randomEventsEnabled: boolean;
  reducedScares: boolean;
  aiNotesEnabled: boolean;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
};

export type GameSave = {
  player: Point;
  objectiveIndex: number;
  lightOn: boolean;
  records: number;
  inventory: string[];
  droppedItems: DroppedItem[];
  message: string;
  journal: string[];
  clues: string[];
  exitOpen: boolean;
  ghostCabinetUnlocked: boolean;
  orangeKeyShelfUnlocked: boolean;
  shadowPoint: Point;
  shadowAwake: boolean;
  shadowDefeated: boolean;
  achievements: string[];
  endingsFound: Ending[];
  aiNote: string;
};

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

type ActionState = {
  target: ActionTarget;
  label: string;
  progress: number;
};

type CameraViewerState = {
  open: boolean;
  index: number;
};

const achievementsList: Achievement[] = [
  { id: 'first-night', title: 'Первая смена', description: 'Выполни первое задание архива.' },
  { id: 'camera-truth', title: 'Камера не врёт', description: 'Найди правильную запись на мониторе.' },
  { id: 'records', title: 'Три записи', description: 'Собери все скрытые записи.' },
  { id: 'secret-tool', title: 'Необычный инвентарь', description: 'Добудь пылесос для привидений.' },
  { id: 'good-ending', title: 'Выход найден', description: 'Получи хорошую концовку.' },
  { id: 'bad-ending', title: 'Печать сломана', description: 'Получи плохую концовку.' },
  { id: 'secret-ending', title: 'Все дела закрыты', description: 'Получи секретную концовку.' },
];

const defaultSettings: GameSettings = {
  hintsEnabled: true,
  randomEventsEnabled: true,
  reducedScares: false,
  aiNotesEnabled: true,
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
  if (!exitOpen && y > indoorMaxY) return { x: clamp(point.x, indoorMin, indoorMaxX), y: indoorMaxY };
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
    exit: 'Дёргаешь ручку двери и проверяешь замок',
    gate: 'Толкаешь белые ворота и выбегаешь наружу',
    orangeKey: 'Подбираешь оранжевый ключ за стеллажом',
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

function moveShadowToward(current: Point, target: Point, amount: number): Point {
  return clampWalkTarget(stepToward(current, target, amount), true, current);
}

function isInFirstRoom(point: Point) {
  return point.x < 330 && point.y < indoorMaxY;
}

function objectiveAction(objectiveIndex: number, target: HotspotId): Pick<ActionState, 'target' | 'label'> {
  const actions: Partial<Record<number, Pick<ActionState, 'target' | 'label'>>> = {
    0: { target: 'boxesUnpack', label: 'Снимаешь мокрую ленту, открываешь коробку и вытаскиваешь папку со своим именем.' },
    1: { target: 'switch', label: 'Нащупываешь выключатель одной рукой и включаешь свет, пока лампы щёлкают по очереди.' },
    2: { target: 'deskSort', label: 'Поднимаешь стопку документов, выравниваешь листы и опускаешь их на стол по номерам.' },
    3: { target: 'deskOpen', label: 'Одной рукой раскрываешь папку на столе и придерживаешь страницу, чтобы увидеть фотографию.' },
    4: { target: 'coffeeMirror', label: 'Подносишь чашку к лицу и смотришь в тёмное отражение кофе, прежде чем сделать глоток.' },
    5: { target: 'hallListen', label: 'Замираешь у коридора, прикладываешь руку к уху и шёпотом выдыхаешь: aaa.' },
    6: { target: 'redSeal', label: 'Берёшь красную папку с полки, проверяешь печать и говоришь: ok, let us check it.' },
    7: { target: 'cameraTune', label: 'Включаешь монитор, крутишь ручки и переключаешь каналы камер по всему архиву.' },
    8: { target: 'shelvesDust', label: 'Проводишь пальцами по пыльным полкам, находишь свежий след и вытаскиваешь дело №418.' },
    9: { target: 'case417Read', label: 'Срываешь верёвку с дела №417 и листаешь страницы, пока дата смерти не совпадает с завтрашним днём.' },
    10: { target: 'flashlightBeam', label: 'Вставляешь батарейку, щёлкаешь кнопкой и ведёшь лучом фонарика по стеллажам.' },
  };
  return actions[objectiveIndex] ?? { target, label: actionLabel(target) };
}

function lockedObjectiveMessage(currentTitle: string) {
  return `Сейчас не время для этого. Текущее задание: ${currentTitle}.`;
}

function clueForObjective(index: number) {
  const clues = [
    'Улика: на мокрой ленте коробки отпечаток твоего пальца.',
    'Улика: выключатель теплый, будто его включили за минуту до тебя.',
    'Улика: в журнале один номер дела повторяется дважды.',
    'Улика: фотография в папке сделана у входа в архив.',
    'Улика: в кофе отражается плечо человека за твоей спиной.',
    'Улика: шаги в коридоре останавливаются ровно тогда, когда ты замираешь.',
    'Улика: красная печать отмечает не запрет, а выход.',
    'Улика: камера 03 показывает не место, а очередь событий.',
    'Улика: пустое дело №418 уже принято архивом.',
    'Улика: в деле №417 дата смерти стоит завтрашним днем.',
    'Улика: фонарик светит сильнее, когда свет в архиве гаснет.',
  ];
  return clues[index] ?? null;
}

function soundCueForTarget(target: HotspotId): SoundCue {
  if (target === 'switch' || target === 'flashlight') return 'hintLight';
  if (target === 'camera') return 'hintCamera';
  if (target === 'hall') return 'hintSteps';
  if (target === 'desk' || target === 'boxes' || target === 'shelves' || target === 'case417' || target === 'redFolder') return 'hintPaper';
  return 'hintObject';
}

function finalAction(id: HotspotId): Pick<ActionState, 'target' | 'label'> {
  if (id === 'exit') return { target: 'exitUnlock', label: 'Сверяешь три скрытые записи, вставляешь пустую папку №418 в щель и отпираешь дверь.' };
  if (id === 'redFolder') return { target: 'redSeal', label: 'Ломаешь красную печать, хотя архив будто задерживает твою руку.' };
  if (id === 'gate') return { target: 'gateRun', label: 'Ты толкаешь белые ворота плечом и выбегаешь на дорогу, не оглядываясь назад.' };
  return { target: id, label: actionLabel(id) };
}

function makeInitialSave(): GameSave {
  return {
    player: startPoint,
    objectiveIndex: 0,
    lightOn: true,
    records: 0,
    inventory: [],
    droppedItems: [],
    message: startMessage,
    journal: [startJournal],
    clues: [],
    exitOpen: false,
    ghostCabinetUnlocked: false,
    orangeKeyShelfUnlocked: false,
    shadowPoint: { x: 452, y: 92 },
    shadowAwake: false,
    shadowDefeated: false,
    achievements: [],
    endingsFound: [],
    aiNote: '',
  };
}

type GameOptions = {
  active: boolean;
  playSound: (cue: SoundCue) => void;
  initialSave?: Partial<GameSave> | null;
  settings?: GameSettings;
};

export function useArchiveGame({ active, playSound, initialSave, settings = defaultSettings }: GameOptions) {
  const initial = useMemo(() => ({ ...makeInitialSave(), ...initialSave }), [initialSave]);
  const [player, setPlayer] = useState(initial.player);
  const viewYawRef = useRef(0.28);
  const lastMoveAtRef = useRef(0);
  const actionTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const actionIntervalRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const jumpscareTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const objectiveHintTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const randomEventTimerRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const appliedInitialSaveRef = useRef(false);
  const [objectiveIndex, setObjectiveIndex] = useState(initial.objectiveIndex);
  const [lightOn, setLightOn] = useState(initial.lightOn);
  const [records, setRecords] = useState(initial.records);
  const [inventory, setInventory] = useState<string[]>(initial.inventory);
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>(initial.droppedItems);
  const [message, setMessage] = useState(initial.message);
  const [journal, setJournal] = useState<string[]>(initial.journal);
  const [clues, setClues] = useState<string[]>(initial.clues);
  const [objectiveHintVisible, setObjectiveHintVisible] = useState(false);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [endingsFound, setEndingsFound] = useState<Ending[]>(initial.endingsFound);
  const [achievements, setAchievements] = useState<string[]>(initial.achievements);
  const [aiNote, setAiNote] = useState(initial.aiNote);
  const [action, setAction] = useState<ActionState | null>(null);
  const [cameraViewer, setCameraViewer] = useState<CameraViewerState>({ open: false, index: 0 });
  const [exitOpen, setExitOpen] = useState(initial.exitOpen);
  const [ghostCabinetUnlocked, setGhostCabinetUnlocked] = useState(initial.ghostCabinetUnlocked);
  const [orangeKeyShelfUnlocked, setOrangeKeyShelfUnlocked] = useState(initial.orangeKeyShelfUnlocked);
  const [shadowPoint, setShadowPoint] = useState<Point>(initial.shadowPoint);
  const [shadowAwake, setShadowAwake] = useState(initial.shadowAwake);
  const [shadowDefeated, setShadowDefeated] = useState(initial.shadowDefeated);
  const [jumpscare, setJumpscare] = useState(false);
  const playerRef = useRef(player);
  const shadowPointRef = useRef(shadowPoint);
  const finalRoomOneVacuumRef = useRef(false);
  const moveRef = useRef<(dx: number, dy: number) => void>(() => {});
  const interactRef = useRef<() => void>(() => {});
  const dropInventoryRef = useRef<() => void>(() => {});

  const objective = objectives[objectiveIndex] ?? objectives[objectives.length - 1];
  const finalMode = objectiveIndex === objectives.length;
  const coffeeDrunk = objectiveIndex > 4;
  const fear = useMemo(() => {
    const base = finalMode ? 100 : objective.fear;
    const heldCaseFear = inventory.some((item) => item.includes('417')) ? 7 : 0;
    return clamp(base + (lightOn ? 0 : 8) + records * 2 + heldCaseFear, 0, 100);
  }, [finalMode, inventory, lightOn, objective.fear, records]);

  const unlockedAchievements = achievementsList.filter((item) => achievements.includes(item.id));

  function unlockAchievement(id: string) {
    setAchievements((current) => (current.includes(id) ? current : [...current, id]));
  }

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

  function clearObjectiveHintTimer() {
    if (objectiveHintTimerRef.current) window.clearTimeout(objectiveHintTimerRef.current);
    objectiveHintTimerRef.current = null;
  }

  function beginAction(
    target: HotspotId,
    onComplete: () => void,
    duration = 3200,
    poseTarget: ActionState['target'] = target,
    customLabel = actionLabel(target),
  ) {
    clearActionTimers();
    clearObjectiveHintTimer();
    const startedAt = Date.now();
    const label = customLabel;
    setObjectiveHintVisible(false);
    setAction({ target: poseTarget, label, progress: 0 });
    playSound('interact');
    if (target === 'hall') playSound('voiceAaa');
    if (target === 'redFolder') playSound('voiceCheck');

    actionIntervalRef.current = window.setInterval(() => {
      const progress = Math.min(100, ((Date.now() - startedAt) / duration) * 100);
      setAction({ target: poseTarget, label, progress });
    }, 100);

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
      const direct = clampWalkTarget({ x: current.x + worldDx * step, y: current.y + worldDy * step }, exitOpen, current);
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

  function addInventory(item: string) {
    if (inventory.includes(item)) return true;
    if (inventory.length > 0) {
      setMessage(`Сначала выброси "${inventory[0]}", потом возьми "${item}".`);
      return false;
    }

    setInventory([item]);
    if (item === 'Пылесос для привидений') {
      unlockAchievement('secret-tool');
      setShadowPoint({ x: 452, y: 92 });
      setMessage('Пылесос щёлкает и оживает. Теперь у тебя есть шанс остановить силуэт.');
    }
    return true;
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
    if (!addInventory(found.item)) return;
    setDroppedItems((items) => items.filter((item) => item.id !== id));
    playSound('interact');
    setMessage(`${found.item} снова у тебя.`);
  }

  function finishObjective() {
    setMessage(objective.success);
    addJournal(`${objective.night}. ${objective.title}: выполнено.`);
    const clue = clueForObjective(objectiveIndex);
    if (clue) setClues((current) => [clue, ...current.filter((item) => item !== clue)].slice(0, 6));
    playSound(objective.target === 'camera' ? 'camera' : 'paper');

    if (objectiveIndex === 0) unlockAchievement('first-night');
    if (objective.item) addInventory(objective.item);
    if (objective.record) {
      setRecords((count) => {
        const next = Math.min(3, count + 1);
        if (next >= 3) unlockAchievement('records');
        return next;
      });
    }
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
      exit: 'Дверь не открывается. Смена должна быть закрыта.',
      gate: 'Белые ворота ведут наружу. Если откроешь их, смена закончится.',
      orangeKey: orangeKeyShelfUnlocked
        ? 'За правым стеллажом пусто. Оранжевый ключ уже исчез в замке.'
        : itemIsInWorld('Оранжевый ключ')
        ? 'За правым стеллажом пусто. Оранжевый ключ уже у тебя.'
        : 'За правым стеллажом лежит маленький оранжевый ключ.',
      ghostKey: ghostCabinetUnlocked
        ? 'Уличная стеклянная полка пустая. Ключ уже исчез в замке шкафа.'
        : itemIsInWorld('Ключ от стеклянной полки')
        ? 'Уличная полка открыта. Маленький латунный ключ уже у тебя.'
        : orangeKeyShelfUnlocked
          ? 'Уличная стеклянная полка открыта. Ключ от стеклянной полки можно забрать.'
          : inventory.includes('Оранжевый ключ')
            ? 'Оранжевый ключ подходит к оранжевому замку на уличной стеклянной полке.'
            : 'Ключ от стеклянной полки заперт в уличной стеклянной полке. Нужен оранжевый ключ.',
      ghostVacuum: itemIsInWorld('Пылесос для привидений')
        ? 'Стеклянный шкаф пуст. Пылесос для привидений уже у тебя.'
        : ghostCabinetUnlocked
          ? 'Стеклянная дверца открыта. Можно снять пылесос, если руки свободны.'
          : inventory.includes('Ключ от стеклянной полки')
            ? 'Ключ дважды проворачивается. Стеклянная дверца открывается.'
            : 'Пылесос заперт за стеклом. Нужен ключ с уличной полки.',
    };

    if (id === 'switch') setLightOn((value) => !value);
    if (id === 'orangeKey' && orangeKeyShelfUnlocked) return;
    if (id === 'orangeKey' && !itemIsInWorld('Оранжевый ключ') && !addInventory('Оранжевый ключ')) return;
    if (id === 'ghostVacuum' && ghostCabinetUnlocked && !itemIsInWorld('Пылесос для привидений')) {
      if (inventory.length > 0 && !inventory.includes('Пылесос для привидений')) {
        setMessage(`Сначала выброси "${inventory[0]}", потом возьми пылесос.`);
        return;
      }
      addInventory('Пылесос для привидений');
    }
    playSound(id === 'camera' ? 'camera' : 'interact');
    setMessage(lines[id]);
  }

  function openCameraViewer() {
    unlockAchievement('camera-truth');
    finishObjective();
    return;
    playSound('camera');
    setCameraViewer({ open: true, index: 0 });
    setMessage('Мониторы включились. Найди запись, где камера показывает не место, а очередь событий.');
  }

  function closeCameraViewer() {
    setCameraViewer((current) => ({ ...current, open: false }));
  }

  function nextCamera() {
    playSound('camera');
    setCameraViewer((current) => ({ open: true, index: (current.index + 1) % cameraFeeds.length }));
  }

  function previousCamera() {
    playSound('camera');
    setCameraViewer((current) => ({ open: true, index: (current.index - 1 + cameraFeeds.length) % cameraFeeds.length }));
  }

  function confirmCameraFinding() {
    if (!cameraViewer.open) return;
    const feed = cameraFeeds[cameraViewer.index];
    setCameraViewer((current) => ({ ...current, open: false }));
    if (!finalMode && objective.target === 'camera') {
      if (feed?.id === 'cam-03') {
        unlockAchievement('camera-truth');
        finishObjective();
      } else {
        setMessage('Это странно, но не главное. Ищи запись с человеком у твоего стола.');
      }
    } else {
      setMessage('Ты отметил запись, но это пока не помогает текущему заданию.');
    }
  }

  function recordEnding(found: Ending) {
    setEndingsFound((current) => (current.includes(found) ? current : [...current, found]));
    if (found === 'good') unlockAchievement('good-ending');
    if (found === 'bad') unlockAchievement('bad-ending');
    if (found === 'secret') unlockAchievement('secret-ending');
  }

  function chooseFinal(id: HotspotId) {
    if (id === 'redFolder') {
      playSound('ending');
      recordEnding('bad');
      setEnding('bad');
    } else if (id === 'gate') {
      playSound('ending');
      recordEnding('good');
      setEnding('good');
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
    recordEnding('secret');
    setEnding('secret');
  }

  function restartAfterShadowAttack() {
    clearActionTimers();
    setAction(null);
    if (!settings.reducedScares) {
      setJumpscare(true);
      playSound('scream');
    }
    jumpscareTimerRef.current = window.setTimeout(() => {
      const clean = makeInitialSave();
      setPlayer(clean.player);
      setObjectiveIndex(clean.objectiveIndex);
      setLightOn(clean.lightOn);
      setRecords(clean.records);
      setInventory(clean.inventory);
      setDroppedItems(clean.droppedItems);
      setShadowPoint(clean.shadowPoint);
      setShadowAwake(clean.shadowAwake);
      setShadowDefeated(clean.shadowDefeated);
      setJumpscare(false);
      setMessage(settings.reducedScares ? 'Силуэт догнал тебя. Архив мягко возвращает смену к началу.' : 'Силуэт поймал тебя. Архив начинает смену сначала.');
      setJournal(clean.journal);
      setClues(clean.clues);
      setObjectiveHintVisible(false);
      setEnding(null);
      setAction(null);
      setCameraViewer({ open: false, index: 0 });
      setExitOpen(clean.exitOpen);
      setGhostCabinetUnlocked(clean.ghostCabinetUnlocked);
      setOrangeKeyShelfUnlocked(clean.orangeKeyShelfUnlocked);
      finalRoomOneVacuumRef.current = false;
      viewYawRef.current = 0.28;
      jumpscareTimerRef.current = null;
    }, settings.reducedScares ? 300 : 1400);
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

    const allowedSecretTarget =
      closest.id === 'orangeKey' ||
      closest.id === 'ghostKey' ||
      closest.id === 'ghostVacuum';
    if (!finalMode && closest.id !== objective.target && !allowedSecretTarget) {
      setMessage(lockedObjectiveMessage(objective.title));
      return;
    }
    if (finalMode && !allowedSecretTarget && !['redFolder', 'exit', 'gate'].includes(closest.id)) {
      setMessage('Финальное время пришло только для выхода, красной папки и секретных предметов.');
      return;
    }

    const canUseKeyOnGlassShelf =
      closest.id === 'ghostVacuum' &&
      !ghostCabinetUnlocked &&
      inventory.includes('Ключ от стеклянной полки') &&
      !itemIsInWorld('Пылесос для привидений');
    const canUseOrangeKeyOnOutdoorShelf =
      closest.id === 'ghostKey' &&
      !orangeKeyShelfUnlocked &&
      inventory.includes('Оранжевый ключ') &&
      !itemIsInWorld('Ключ от стеклянной полки');

    if (inventory.length > 0 && !canUseKeyOnGlassShelf && !canUseOrangeKeyOnOutdoorShelf) {
      setMessage(`Сначала выброси "${inventory[0]}" клавишей Q, потом делай задание.`);
      return;
    }

    if (closest.id === 'camera') {
      const cameraAction = objectiveAction(objectiveIndex, closest.id);
      beginAction(closest.id, openCameraViewer, 2800, cameraAction.target, cameraAction.label);
      return;
    }

    if (
      closest.id === 'ghostVacuum' &&
      !ghostCabinetUnlocked &&
      !inventory.includes('Ключ от стеклянной полки') &&
      !itemIsInWorld('Пылесос для привидений')
    ) {
      beginAction(closest.id, () => inspectFreeHotspot(closest.id), 900, 'ghostKey', 'На стеклянной дверце замок. Ты тянешь её рукой, но она не открывается.');
      return;
    }

    if (closest.id === 'orangeKey') {
      beginAction(
        closest.id,
        () => inspectFreeHotspot(closest.id),
        1800,
        'orangeKeyTake',
        'Ты просовываешь руку за правый стеллаж и поднимаешь оранжевый ключ.',
      );
      return;
    }

    if (closest.id === 'ghostKey') {
      if (ghostCabinetUnlocked) {
        setMessage('Уличная стеклянная полка пустая. Ключ уже исчез в замке шкафа.');
        return;
      }

      if (itemIsInWorld('Ключ от стеклянной полки')) {
        setMessage('Уличная стеклянная полка пустая. Ключ уже не внутри.');
        return;
      }

      if (!orangeKeyShelfUnlocked && inventory.includes('Оранжевый ключ')) {
        beginAction(
          closest.id,
          () => {
            setOrangeKeyShelfUnlocked(true);
            setInventory((items) => items.filter((item) => item !== 'Оранжевый ключ'));
            setMessage('Оранжевый ключ исчез в замке. Уличная стеклянная полка открыта.');
          },
          2400,
          'orangeKeyUnlock',
          'Ты вставляешь оранжевый ключ в оранжевый замок и открываешь уличную стеклянную полку.',
        );
        return;
      }

      if (!orangeKeyShelfUnlocked) {
        setMessage('Уличная стеклянная полка заперта. Нужен оранжевый ключ из второй комнаты.');
        return;
      }

      beginAction(closest.id, () => inspectFreeHotspot(closest.id), 2100, 'keyTake', 'Ты открываешь уличную стеклянную полку, снимаешь ключ с крючка и крутишь его в пальцах.');
      return;
    }

    if (closest.id === 'ghostVacuum') {
      if (itemIsInWorld('Пылесос для привидений')) {
        setMessage('Стеклянный шкаф пуст. Пылесос уже не внутри.');
        return;
      }

      if (!ghostCabinetUnlocked && inventory.includes('Ключ от стеклянной полки')) {
        beginAction(
          closest.id,
          () => {
            setGhostCabinetUnlocked(true);
            setInventory((items) => items.filter((item) => item !== 'Ключ от стеклянной полки'));
            setMessage('Ключ щёлкнул в замке. Стеклянная дверца открыта, теперь можно снять пылесос.');
          },
          2600,
          'vacuumUnlock',
          'Ты вставляешь латунный ключ, проворачиваешь его и открываешь стеклянную дверцу.',
        );
        return;
      }

      if (!ghostCabinetUnlocked) {
        setMessage('Стеклянная полка заперта. Сначала нужен ключ с улицы.');
        return;
      }

      beginAction(
        closest.id,
        () => addInventory('Пылесос для привидений'),
        2100,
        'ghostVacuum',
        'Ты просовываешь руки в открытый шкаф и снимаешь пылесос с крюка.',
      );
      return;
    }

    if (finalMode) {
      const actionState = finalAction(closest.id);
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
        actionState.target,
        actionState.label,
      );
    } else if (closest.id === 'exit') {
      beginAction(closest.id, () => inspectFreeHotspot(closest.id), 1300);
    } else if (closest.id === objective.target) {
      const actionState = objectiveAction(objectiveIndex, closest.id);
      beginAction(closest.id, finishObjective, 3200, actionState.target, actionState.label);
    } else {
      beginAction(closest.id, () => inspectFreeHotspot(closest.id), 1300);
    }
  }

  function restart() {
    clearActionTimers();
    const clean = makeInitialSave();
    setPlayer(clean.player);
    setObjectiveIndex(clean.objectiveIndex);
    setLightOn(clean.lightOn);
    setRecords(clean.records);
    setInventory(clean.inventory);
    setDroppedItems(clean.droppedItems);
    setMessage(clean.message);
    setJournal(clean.journal);
    setClues(clean.clues);
    setObjectiveHintVisible(false);
    setEnding(null);
    setJumpscare(false);
    setAction(null);
    setCameraViewer({ open: false, index: 0 });
    setExitOpen(clean.exitOpen);
    setGhostCabinetUnlocked(clean.ghostCabinetUnlocked);
    setOrangeKeyShelfUnlocked(clean.orangeKeyShelfUnlocked);
    setShadowPoint(clean.shadowPoint);
    setShadowAwake(clean.shadowAwake);
    setShadowDefeated(clean.shadowDefeated);
    setAiNote('');
    finalRoomOneVacuumRef.current =
      save.objectiveIndex === objectives.length &&
      save.inventory.includes('Пылесос для привидений') &&
      isInFirstRoom(save.player);
    viewYawRef.current = 0.28;
  }

  function applySave(next: Partial<GameSave>) {
    const save = { ...makeInitialSave(), ...next };
    clearActionTimers();
    setPlayer(save.player);
    setObjectiveIndex(save.objectiveIndex);
    setLightOn(save.lightOn);
    setRecords(save.records);
    setInventory(save.inventory);
    setDroppedItems(save.droppedItems);
    setMessage(save.message);
    setJournal(save.journal);
    setClues(save.clues);
    setObjectiveHintVisible(false);
    setEnding(null);
    setJumpscare(false);
    setAction(null);
    setCameraViewer({ open: false, index: 0 });
    setExitOpen(save.exitOpen);
    setGhostCabinetUnlocked(save.ghostCabinetUnlocked);
    setOrangeKeyShelfUnlocked(save.orangeKeyShelfUnlocked);
    setShadowPoint(save.shadowPoint);
    setShadowAwake(save.shadowAwake);
    setShadowDefeated(save.shadowDefeated);
    setAchievements(save.achievements);
    setEndingsFound(save.endingsFound);
    setAiNote(save.aiNote);
    finalRoomOneVacuumRef.current = false;
    viewYawRef.current = 0.28;
  }

  const setViewYaw = useCallback((yaw: number) => {
    viewYawRef.current = yaw;
  }, []);

  const save = useMemo<GameSave>(
    () => ({
      player,
      objectiveIndex,
      lightOn,
      records,
      inventory,
      droppedItems,
      message,
      journal,
      clues,
      exitOpen,
      ghostCabinetUnlocked,
      orangeKeyShelfUnlocked,
      shadowPoint,
      shadowAwake,
      shadowDefeated,
      achievements,
      endingsFound,
      aiNote,
    }),
    [
      achievements,
      aiNote,
      clues,
      droppedItems,
      endingsFound,
      exitOpen,
      ghostCabinetUnlocked,
      orangeKeyShelfUnlocked,
      inventory,
      journal,
      lightOn,
      message,
      objectiveIndex,
      player,
      records,
      shadowAwake,
      shadowDefeated,
      shadowPoint,
    ],
  );

  useEffect(() => {
    if (active && initialSave && !appliedInitialSaveRef.current) {
      appliedInitialSaveRef.current = true;
      applySave(initialSave);
    }
    if (!active) appliedInitialSaveRef.current = false;
  }, [active, initialSave]);

  useEffect(() => {
    playerRef.current = player;
    if (!active || shadowAwake || shadowDefeated || ending) return;

    const holdingVacuum = inventory.includes('Пылесос для привидений');
    if (!finalMode || !holdingVacuum) {
      finalRoomOneVacuumRef.current = false;
      return;
    }

    if (isInFirstRoom(player)) {
      finalRoomOneVacuumRef.current = true;
      return;
    }

    if (finalRoomOneVacuumRef.current) {
      setShadowAwake(true);
      setShadowPoint({ x: 452, y: 92 });
      shadowPointRef.current = { x: 452, y: 92 };
      setMessage('Ты выходишь из первой комнаты с пылесосом. Силуэт бросается за тобой.');
    }
  }, [active, ending, finalMode, inventory, player, shadowAwake, shadowDefeated]);

  useEffect(() => {
    shadowPointRef.current = shadowPoint;
  }, [shadowPoint]);

  useEffect(() => {
    clearObjectiveHintTimer();
    setObjectiveHintVisible(false);
    if (!settings.hintsEnabled || !active || ending || action || jumpscare) return undefined;

    objectiveHintTimerRef.current = window.setTimeout(() => {
      setObjectiveHintVisible(true);
      playSound(finalMode ? 'hintSteps' : soundCueForTarget(objective.target));
      objectiveHintTimerRef.current = null;
    }, 20000);

    return clearObjectiveHintTimer;
  }, [action, active, ending, finalMode, jumpscare, objective.target, objectiveIndex, playSound, settings.hintsEnabled]);

  useEffect(() => {
    if (!active || !settings.randomEventsEnabled || ending) return undefined;
    const events = [
      'Где-то щёлкнул замок, хотя все двери на месте.',
      'На мониторе вспыхнуло твоё имя и сразу исчезло.',
      'Одна папка на стеллаже выдвинулась ровно на ширину пальца.',
      'Лампа над столом моргнула три раза, как будто отвечала.',
    ];
    randomEventTimerRef.current = window.setInterval(() => {
      const event = events[Math.floor(Math.random() * events.length)];
      setMessage(event);
      addJournal(`Помеха: ${event}`);
      if (Math.random() > 0.55) {
        setLightOn((value) => !value);
        window.setTimeout(() => setLightOn((value) => !value), 520);
      }
      playSound('hintObject');
    }, 28000);

    return () => {
      if (randomEventTimerRef.current) window.clearInterval(randomEventTimerRef.current);
      randomEventTimerRef.current = null;
    };
  }, [active, ending, playSound, settings.randomEventsEnabled]);

  useEffect(() => {
    if (!active || !shadowAwake || shadowDefeated || ending || action?.target === 'vacuumSuck') return undefined;

    const attack = window.setInterval(() => {
      const current = shadowPointRef.current;
      const target = playerRef.current;
      const gap = distance(current, target);
      if (gap < 34) {
        restartAfterShadowAttack();
        return;
      }
      const next = moveShadowToward(current, target, shadowAttackStep);
      shadowPointRef.current = next;
      setShadowPoint(next);
    }, shadowAttackIntervalMs);

    return () => window.clearInterval(attack);
  }, [action?.target, active, ending, shadowAwake, shadowDefeated, settings.reducedScares]);

  useEffect(() => {
    moveRef.current = move;
    interactRef.current = interact;
    dropInventoryRef.current = dropInventory;
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const keys: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        w: [0, -1],
        ц: [0, -1],
        ArrowDown: [0, 1],
        s: [0, 1],
        ы: [0, 1],
        ArrowLeft: [-1, 0],
        a: [-1, 0],
        ф: [-1, 0],
        ArrowRight: [1, 0],
        d: [1, 0],
        в: [1, 0],
      };
      if (event.key === 'e' || event.key === 'у' || event.key === 'Enter') interactRef.current();
      else if (event.key === 'q' || event.key === 'й') dropInventoryRef.current();
      else if (keys[event.key]) moveRef.current(...keys[event.key]);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(
    () => () => {
      clearActionTimers();
      clearObjectiveHintTimer();
      if (randomEventTimerRef.current) window.clearInterval(randomEventTimerRef.current);
    },
    [],
  );

  const shadowVisible = !shadowDefeated && (shadowAwake || objective.target === 'hall' || action?.target === 'hallListen' || finalMode);

  return {
    player,
    objective,
    finalMode,
    coffeeDrunk,
    lightOn,
    records,
    inventory,
    ghostCabinetUnlocked,
    orangeKeyShelfUnlocked,
    droppedItems,
    shadowPoint,
    shadowVisible,
    shadowAttacking: shadowAwake && !shadowDefeated,
    jumpscare,
    message,
    journal,
    clues,
    objectiveHintVisible,
    ending,
    endingsFound,
    fear,
    action,
    cameraFeeds,
    cameraViewer,
    achievements: unlockedAchievements,
    allAchievements: achievementsList,
    aiNote,
    setAiNote,
    save,
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

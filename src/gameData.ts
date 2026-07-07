export type Point = { x: number; y: number };
export type DroppedItem = { id: string; item: string; point: Point };
export type CollisionRect = { x: number; y: number; width: number; height: number };
export type CameraFeed = {
  id: string;
  label: string;
  status: string;
  body: string;
};
export type HotspotId =
  | 'boxes'
  | 'desk'
  | 'coffee'
  | 'switch'
  | 'shelves'
  | 'hall'
  | 'camera'
  | 'redFolder'
  | 'case417'
  | 'flashlight'
  | 'exit'
  | 'gate'
  | 'ghostKey'
  | 'ghostVacuum';

export type Ending = 'bad' | 'good' | 'secret';

export type Objective = {
  night: string;
  title: string;
  hint: string;
  target: HotspotId;
  success: string;
  item?: string;
  record?: string;
  fear: number;
  blackout?: boolean;
};

export const roomSize = { width: 900, height: 540 };

export const collisionRects: CollisionRect[] = [
  { x: 122, y: 48, width: 10, height: 88 },
  { x: 153, y: 48, width: 10, height: 88 },
  { x: 183, y: 48, width: 10, height: 88 },
  { x: 214, y: 48, width: 10, height: 88 },
  { x: 700, y: 48, width: 10, height: 88 },
  { x: 731, y: 48, width: 10, height: 88 },
  { x: 761, y: 48, width: 10, height: 88 },
  { x: 792, y: 48, width: 10, height: 88 },
  { x: 342, y: 166, width: 116, height: 50 },
  { x: 202, y: 420, width: 92, height: 62 },
  { x: 648, y: 426, width: 36, height: 22 },
  { x: 662, y: 450, width: 12, height: 20 },
  { x: 735, y: 426, width: 34, height: 20 },
  { x: 424, y: 66, width: 58, height: 28 },
  { x: 504, y: 66, width: 48, height: 24 },
  { x: 323, y: 28, width: 8, height: 204 },
  { x: 323, y: 308, width: 8, height: 204 },
  { x: 569, y: 28, width: 8, height: 204 },
  { x: 569, y: 308, width: 8, height: 204 },
  { x: 516, y: 793, width: 38, height: 18 },
  { x: 386, y: 1158, width: 128, height: 8 },
  { x: 0, y: 1176, width: 900, height: 164 },
];

export const cameraFeeds: CameraFeed[] = [
  {
    id: 'cam-01',
    label: 'КАМ 01 / Вход',
    status: 'Сигнал стабильный',
    body: 'Пустой коридор у входа. На полу видны свежие следы, хотя дверь не открывалась.',
  },
  {
    id: 'cam-02',
    label: 'КАМ 02 / Стеллажи',
    status: 'Помехи 12%',
    body: 'Между стеллажами мелькает силуэт. Когда камера фокусируется, там остаётся только ряд папок.',
  },
  {
    id: 'cam-03',
    label: 'КАМ 03 / Рабочий стол',
    status: 'Запись активна',
    body: 'У стола стоит человек с твоим бейджем. Он смотрит прямо в объектив и не двигается.',
  },
  {
    id: 'cam-04',
    label: 'КАМ 04 / Выход',
    status: 'Дверь закрыта',
    body: 'Выходная дверь целая и закрытая. За ней видно только тёмную стену архива.',
  },
];

export const hotspots: Record<HotspotId, Point & { label: string }> = {
  boxes: { x: 236, y: 448, label: 'Коробки' },
  desk: { x: 400, y: 190, label: 'Стол' },
  coffee: { x: 425, y: 190, label: 'Кофе' },
  switch: { x: 872, y: 408, label: 'Свет' },
  shelves: { x: 116, y: 150, label: 'Левый стеллаж' },
  hall: { x: 452, y: 92, label: 'Дальний коридор' },
  camera: { x: 666, y: 440, label: 'Камеры' },
  redFolder: { x: 528, y: 82, label: 'Красная папка' },
  case417: { x: 770, y: 430, label: 'Дело №417' },
  flashlight: { x: 370, y: 190, label: 'Фонарик' },
  exit: { x: 450, y: 502, label: 'Выход' },
  gate: { x: 450, y: 1165, label: 'Белые ворота' },
  ghostKey: { x: 530, y: 790, label: 'Ключ от стеклянной полки' },
  ghostVacuum: { x: 70, y: 270, label: 'Пылесос для привидений' },
};

export const objectives: Objective[] = [
  {
    night: 'Ночь 1',
    title: 'Принять коробки',
    hint: 'Подойди к коробкам в первой комнате и нажми E.',
    target: 'boxes',
    success: 'Коробки приняты. В журнале доставки нет твоей подписи, но строка уже заполнена.',
    fear: 3,
  },
  {
    night: 'Ночь 1',
    title: 'Включить свет',
    hint: 'Найди выключатель во второй комнате и нажми E.',
    target: 'switch',
    success: 'Лампы загораются одна за другой. Архив становится понятнее, но не теплее.',
    fear: 5,
  },
  {
    night: 'Ночь 1',
    title: 'Разложить документы',
    hint: 'Вернись к столу и разложи дела по номерам.',
    target: 'desk',
    success: 'Документы сложены по номерам. Между ними появляется папка без номера.',
    fear: 12,
  },
  {
    night: 'Ночь 1',
    title: 'Открыть папку без номера',
    hint: 'Осмотри стол ещё раз. Папка лежит поверх аккуратной стопки.',
    target: 'desk',
    success: 'Внутри фотография: ты у входа в архив. Снимок сделан сегодня, но ты никого не видел.',
    item: 'Папка без номера',
    record: 'Запись 1: архив сначала узнаёт лицо, потом имя.',
    fear: 20,
  },
  {
    night: 'Ночь 1',
    title: 'Выпить кофе',
    hint: 'Кофе на столе остыл. Закрой первую смену обычным действием.',
    target: 'coffee',
    success: 'Кофе горчит. В отражении чашки на секунду видно плечо человека за твоей спиной.',
    fear: 24,
  },
  {
    night: 'Ночь 2',
    title: 'Проверить шаги',
    hint: 'В дальнем коридоре слышатся медленные шаги.',
    target: 'hall',
    success: 'Коридор пуст. Когда ты возвращаешься, документы на столе лежат уже в другом порядке.',
    fear: 38,
  },
  {
    night: 'Ночь 2',
    title: 'Осмотреть красную папку',
    hint: 'Красная папка стоит в конце коридора. Осмотри её, но не вскрывай печать.',
    target: 'redFolder',
    success: 'Печать тёплая. На полях чужим почерком написано: «Не завтра. Сегодня».',
    record: 'Запись 2: красная печать не запрещает вход. Она отмечает выход.',
    fear: 48,
  },
  {
    night: 'Ночь 3',
    title: 'Проверить камеры',
    hint: 'Один монитор показывает человека между стеллажами. Только один.',
    target: 'camera',
    success: 'Камера 03 показывает человека у твоего стола. На записи у него твой бейдж.',
    record: 'Запись 3: камера показывает не место. Камера показывает очередь.',
    fear: 62,
  },
  {
    night: 'Ночь 3',
    title: 'Проверить стеллажи',
    hint: 'Силуэт исчез возле левых стеллажей. Там должно быть пусто.',
    target: 'shelves',
    success: 'На полке стоит пустая папка с номером 418. Внутри только лист: «Принято».',
    item: 'Пустое дело №418',
    fear: 72,
  },
  {
    night: 'Ночь 4',
    title: 'Открыть дело №417',
    hint: 'Последняя коробка появилась во второй комнате. На крышке написано: «Личное дело №417».',
    target: 'case417',
    success: 'Внутри свидетельство о смерти, фотографии, записи разговоров и расписание твоих смен. Дата смерти: завтра.',
    item: 'Личное дело №417',
    fear: 88,
    blackout: true,
  },
  {
    night: 'Ночь 4',
    title: 'Включить фонарик',
    hint: 'Свет погас. Возьми фонарик со стола, пока шаги приближаются.',
    target: 'flashlight',
    success: 'Луч фонарика дрожит. В узком свете стоит человек с твоим лицом.',
    item: 'Фонарик',
    fear: 96,
  },
];

export const endings: Record<Ending, { title: string; body: string }> = {
  bad: {
    title: 'Дело №418 принято',
    body: 'Ты вскрываешь красную печать. Архив становится тихим. Утром на полке появляется новое личное дело с твоей фотографией.',
  },
  good: {
    title: 'Побег через белые ворота',
    body: 'Ты распахиваешь выходную дверь, выбегаешь по тропе между деревьями и прорываешься через белые ворота. Архив остаётся позади.',
  },
  secret: {
    title: 'Все дела закрыты',
    body: 'Ты направляешь пылесос на силуэт. Он рассыпается в чёрную пыль и пронумерованные страницы, исчезая внутри бака. Все дела, связанные с этими документами, закрываются навсегда.',
  },
};

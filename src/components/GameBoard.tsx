import { roomSize, type DroppedItem, type HotspotId, type Point } from '../gameData';
import { ThreeArchive } from './ThreeArchive';

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
  records: number;
  fear: number;
  coffeeDrunk: boolean;
  inventory: string[];
  droppedItems: DroppedItem[];
  shadowPoint: Point;
  shadowVisible: boolean;
  shadowAttacking: boolean;
  actionActive: boolean;
  actionTarget: ActionTarget | null;
  onMove: (dx: number, dy: number) => void;
  onInteract: () => void;
  onViewYawChange: (yaw: number) => void;
};

export function GameBoard({
  player,
  lightOn,
  records,
  fear,
  coffeeDrunk,
  inventory,
  droppedItems,
  shadowPoint,
  shadowVisible,
  shadowAttacking,
  actionActive,
  actionTarget,
  onMove,
  onInteract,
  onViewYawChange,
}: Props) {
  const dangerClass = fear > 78 ? 'panic' : fear > 48 ? 'uneasy' : 'calm';

  return (
    <section className={`board ${lightOn ? 'lit' : 'dark'} ${dangerClass}`}>
      <div className="room" style={{ aspectRatio: `${roomSize.width} / ${roomSize.height}` }}>
        <ThreeArchive
          player={player}
          lightOn={lightOn}
          fear={fear}
          coffeeDrunk={coffeeDrunk}
          inventory={inventory}
          droppedItems={droppedItems}
          shadowPoint={shadowPoint}
          shadowVisible={shadowVisible}
          shadowAttacking={shadowAttacking}
          actionActive={actionActive}
          actionTarget={actionTarget}
          onViewYawChange={onViewYawChange}
        />
        {fear > 35 && <div className="footstep-trail" />}
        <div className="static-noise" />
      </div>
      <div className="touch-controls">
        <button type="button" onClick={() => onMove(0, -1)}>↑</button>
        <button type="button" onClick={() => onMove(-1, 0)}>←</button>
        <button type="button" onClick={onInteract}>E</button>
        <button type="button" onClick={() => onMove(1, 0)}>→</button>
        <button type="button" onClick={() => onMove(0, 1)}>↓</button>
      </div>
      <p className="record-counter">Скрытые записи: {records}/3</p>
    </section>
  );
}

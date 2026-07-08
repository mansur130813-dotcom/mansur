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

export function GameBoard({
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
          ghostCabinetUnlocked={ghostCabinetUnlocked}
          orangeKeyShelfUnlocked={orangeKeyShelfUnlocked}
          droppedItems={droppedItems}
          shadowPoint={shadowPoint}
          shadowVisible={shadowVisible}
          shadowAttacking={shadowAttacking}
          actionActive={actionActive}
          actionTarget={actionTarget}
          currentTarget={currentTarget}
          objectiveHintVisible={objectiveHintVisible}
          onViewYawChange={onViewYawChange}
        />
        {fear > 35 && <div className="footstep-trail" />}
        <div className="static-noise" />
      </div>
    </section>
  );
}

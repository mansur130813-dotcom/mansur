import { roomSize, type HotspotId, type Point } from '../gameData';
import { ThreeArchive } from './ThreeArchive';

type ActionTarget = HotspotId | 'deskSort' | 'deskOpen';

type Props = {
  player: Point;
  lightOn: boolean;
  finalMode: boolean;
  records: number;
  fear: number;
  actionActive: boolean;
  actionTarget: ActionTarget | null;
  onMove: (dx: number, dy: number) => void;
  onInteract: () => void;
  onViewYawChange: (yaw: number) => void;
};

export function GameBoard({
  player,
  lightOn,
  finalMode,
  records,
  fear,
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
          finalMode={finalMode}
          fear={fear}
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

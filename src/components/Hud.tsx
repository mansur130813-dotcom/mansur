import type { CameraFeed, Objective } from '../gameData';

type Props = {
  objective: Objective;
  fear: number;
  inventory: string[];
  message: string;
  journal: string[];
  action: { label: string; progress: number } | null;
  cameraFeeds: CameraFeed[];
  cameraViewer: { open: boolean; index: number };
  onPreviousCamera: () => void;
  onNextCamera: () => void;
  onCloseCamera: () => void;
  onConfirmCamera: () => void;
};

export function Hud({
  objective,
  fear,
  inventory,
  message,
  journal,
  action,
  cameraFeeds,
  cameraViewer,
  onPreviousCamera,
  onNextCamera,
  onCloseCamera,
  onConfirmCamera,
}: Props) {
  const feed = cameraFeeds[cameraViewer.index] ?? cameraFeeds[0];

  return (
    <aside className="hud">
      <section className="panel">
        <p className="eyebrow">{objective.night}</p>
        <h2>{objective.title}</h2>
        <p>{objective.hint}</p>
        <div className="fear-meter"><span style={{ width: `${fear}%` }} /></div>
      </section>

      {action && (
        <section className="panel action-panel">
          <h2>Действие</h2>
          <p>{action.label}</p>
          <div className="action-meter"><span style={{ width: `${action.progress}%` }} /></div>
        </section>
      )}

      {cameraViewer.open && feed && (
        <section className="panel camera-viewer">
          <p className="eyebrow">{feed.label}</p>
          <h2>Монитор камер</h2>
          <div className="camera-feed">
            <div className="camera-scanline" />
            <strong>{feed.status}</strong>
            <p>{feed.body}</p>
          </div>
          <div className="camera-actions">
            <button type="button" className="quiet-button" onClick={onPreviousCamera}>Назад</button>
            <button type="button" onClick={onConfirmCamera}>Отметить</button>
            <button type="button" className="quiet-button" onClick={onNextCamera}>Дальше</button>
            <button type="button" className="quiet-button" onClick={onCloseCamera}>Закрыть</button>
          </div>
        </section>
      )}

      <section className="panel">
        <h2>Инвентарь</h2>
        {inventory.length ? inventory.map((item) => <p key={item}>{item}</p>) : <p>Пусто</p>}
      </section>

      <section className="panel message-panel">
        <h2>Событие</h2>
        <p>{message}</p>
      </section>

      <section className="panel journal">
        <h2>Журнал</h2>
        {journal.map((entry) => <p key={entry}>{entry}</p>)}
      </section>
    </aside>
  );
}

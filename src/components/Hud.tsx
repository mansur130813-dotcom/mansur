import type { CameraFeed, Objective } from '../gameData';

type Props = {
  objective: Objective;
  fear: number;
  action: { label: string; progress: number } | null;
  cameraFeeds: CameraFeed[];
  cameraViewer: { open: boolean; index: number };
  onPreviousCamera: () => void;
  onNextCamera: () => void;
  onSelectCamera: (index: number) => void;
  onCloseCamera: () => void;
  onConfirmCamera: (index?: number) => void;
};

export function Hud({
  objective,
  fear,
  action,
  cameraFeeds,
  cameraViewer,
  onPreviousCamera,
  onNextCamera,
  onSelectCamera,
  onCloseCamera,
  onConfirmCamera,
}: Props) {
  const feed = cameraFeeds[cameraViewer.index] ?? cameraFeeds[0];

  return (
    <>
      <p className="night-label">{objective.night}</p>

      <section className="objective-toast">
        <strong>{objective.title}</strong>
        <span>{objective.hint}</span>
        <div className="fear-meter"><span style={{ width: `${fear}%` }} /></div>
      </section>

      {(action || (cameraViewer.open && feed)) && (
        <aside className="hud camera-hud">
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
                <div className="camera-mark-buttons" aria-label="Отметить запись камеры">
                  {cameraFeeds.map((cameraFeed, index) => (
                    <button
                      type="button"
                      key={cameraFeed.id}
                      className={index === cameraViewer.index ? 'camera-mark-button active' : 'camera-mark-button'}
                      onClick={() => {
                        onSelectCamera(index);
                        onConfirmCamera(index);
                      }}
                    >
                      {cameraFeed.label.split(' / ')[0]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="camera-actions">
                <button type="button" className="quiet-button" onClick={onPreviousCamera}>Назад</button>
                <button type="button" className="quiet-button" onClick={onNextCamera}>Дальше</button>
                <button type="button" className="quiet-button" onClick={onCloseCamera}>Закрыть</button>
              </div>
            </section>
          )}
        </aside>
      )}
    </>
  );
}

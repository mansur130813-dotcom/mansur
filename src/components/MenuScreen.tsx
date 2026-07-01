type Props = {
  soundEnabled: boolean;
  onStart: () => void;
  onToggleSound: () => void;
};

export function MenuScreen({ soundEnabled, onStart, onToggleSound }: Props) {
  return (
    <main className="menu-screen">
      <section className="menu-panel">
        <p className="eyebrow">Психологический 3D-хоррор</p>
        <h1>Последняя папка</h1>
        <p>
          Ночная смена в архиве. Начальник сказал только одно:
          «Не открывай папки с красной печатью». Прими коробки, переживи
          камеры и реши, что делать с личным делом №417.
        </p>
        <div className="menu-actions">
          <button type="button" onClick={onStart}>Начать смену</button>
          <button type="button" className="quiet-button" onClick={onToggleSound}>
            Звук: {soundEnabled ? 'вкл' : 'выкл'}
          </button>
        </div>
      </section>
    </main>
  );
}

import { useState } from 'react';
import { Auth } from './Auth';

type Props = {
  soundEnabled: boolean;
  onGuestStart: () => void;
  onAuthenticated: () => void;
  onToggleSound: () => void;
};

export function MenuScreen({
  soundEnabled,
  onGuestStart,
  onAuthenticated,
  onToggleSound,
}: Props) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <main className="menu-screen">
      <section className="menu-panel">
        <p className="eyebrow">Психологический 3D-хоррор</p>
        <h1>Последняя папка</h1>
        <p>
          Ночная смена в архиве проверяет не только документы. На самом деле игра покажет, какой ты человек,
          когда вокруг темно, камеры молчат, а силуэт уже рядом.
        </p>

        <div className="menu-layout">
          <Auth onAuthenticated={onAuthenticated} />

          <section className="guest-panel">
            <h2>Быстрый вход</h2>
            <p>Можно играть без аккаунта. Прогресс гостя не привязан к email.</p>
            <div className="menu-actions">
              <button type="button" onClick={onGuestStart}>Играть как гость</button>
              <button type="button" className="quiet-button" onClick={onToggleSound}>
                Звук: {soundEnabled ? 'вкл' : 'выкл'}
              </button>
              <button type="button" className="quiet-button" onClick={() => setShowInfo((value) => !value)}>
                Сведения об игре
              </button>
            </div>
          </section>
        </div>

        {showInfo && (
          <section className="game-info">
            <h2>Сведения об игре</h2>
            <p>
              Управление: WASD или стрелки для движения, мышь для поворота камеры, E для действия.
              Подходи к предметам, выполняй задания, смотри мониторы камер и следи за страхом.
            </p>
            <p>
              Концовки: плохая концовка связана с красной папкой. Хорошая концовка - побег
              через белые ворота.
            </p>
            <p>
              Правило инвентаря: в руках можно держать только один предмет. Нажми Q, чтобы выбросить
              предмет, потом подойди к нему и нажми E, чтобы снова взять.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}

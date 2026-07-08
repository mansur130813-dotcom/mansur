import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Achievement } from '../hooks/useArchiveGame';
import { Auth } from './Auth';

type Props = {
  soundEnabled: boolean;
  saveStatus: string;
  achievements: Achievement[];
  allAchievements: Achievement[];
  onGuestStart: () => void;
  onAuthenticated: (auto?: boolean, user?: User | null) => void;
  onToggleSound: () => void;
};

export function MenuScreen({
  soundEnabled,
  saveStatus,
  achievements,
  allAchievements,
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
            <p className="save-note">{saveStatus}</p>
            <div className="menu-actions">
              <button type="button" onClick={onGuestStart}>
                Играть как гость
              </button>
              <button type="button" className="quiet-button" onClick={onToggleSound}>
                Звук: {soundEnabled ? 'вкл' : 'выкл'}
              </button>
              <button type="button" className="quiet-button" onClick={() => setShowInfo((value) => !value)}>
                Сведения об игре
              </button>
            </div>
          </section>
        </div>

        <section className="menu-achievements">
          <div className="menu-achievements-head">
            <h2>Достижения</h2>
            <p>
              {achievements.length}/{allAchievements.length}
            </p>
          </div>
          <div className="badge-grid">
            {allAchievements.map((achievement) => {
              const unlocked = achievements.some((item) => item.id === achievement.id);
              return (
                <span key={achievement.id} className={unlocked ? 'badge unlocked' : 'badge'} title={achievement.description}>
                  {unlocked ? achievement.title : '???'}
                </span>
              );
            })}
          </div>
        </section>

        {showInfo && (
          <section className="game-info">
            <h2>Сведения об игре</h2>
            <p>
              Управление: WASD для движения, мышь для поворота камеры, E для действия.
              Подходи к предметам, выполняй задания, смотри мониторы камер и следи за страхом.
            </p>
            <p>
              Телефон: слева виртуальный стик для движения, свайп по экрану поворачивает камеру. Справа большая кнопка
              «Взять» для действия и маленькая «Бросить» для предмета в руке.
            </p>
            <p>Камеры: проверь все варианты на мониторе. Только одна камера показывает правильную запись.</p>
            <p>Концовки: плохая концовка связана с красной папкой. Хорошая концовка - побег через белые ворота.</p>
            <p>
              Правило инвентаря: в руках можно держать только один предмет. Нажми Q, чтобы выбросить предмет,
              потом подойди к нему и нажми E, чтобы снова взять. Если предмет уже в руке, большинство действий не
              выполняются, пока ты не освободишь руки.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}

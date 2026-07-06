import { useState } from 'react';
import { EndingScreen } from './components/EndingScreen';
import { GameBoard } from './components/GameBoard';
import { Hud } from './components/Hud';
import { MenuScreen } from './components/MenuScreen';
import { useArchiveGame } from './hooks/useArchiveGame';
import { useGameSound } from './hooks/useGameSound';

const finalObjective = {
  night: 'Финал',
  title: 'Выбери, чем закончится архив',
  hint: 'Хорошая концовка: открой выходную дверь и выбеги через белые ворота. Плохая концовка: вскрой красную папку и останься в архиве.',
  target: 'gate' as const,
  success: '',
  fear: 100,
};

export default function App() {
  const [started, setStarted] = useState(false);
  const sound = useGameSound();
  const game = useArchiveGame({ active: started, playSound: sound.play });

  function startGame() {
    sound.start();
    setStarted(true);
  }

  function toggleSound() {
    if (sound.enabled) sound.stop();
    else sound.start();
  }

  if (!started) {
    return (
      <MenuScreen
        soundEnabled={sound.enabled}
        onGuestStart={startGame}
        onAuthenticated={startGame}
        onToggleSound={toggleSound}
      />
    );
  }

  if (game.ending) {
    return <EndingScreen ending={game.ending} onRestart={game.restart} />;
  }

  return (
    <main className="game-shell">
      <GameBoard
        player={game.player}
        lightOn={game.lightOn}
        fear={game.fear}
        coffeeDrunk={game.coffeeDrunk}
        inventory={game.inventory}
        ghostCabinetUnlocked={game.ghostCabinetUnlocked}
        droppedItems={game.droppedItems}
        shadowPoint={game.shadowPoint}
        shadowVisible={game.shadowVisible}
        shadowAttacking={game.shadowAttacking}
        actionActive={Boolean(game.action)}
        actionTarget={game.action?.target ?? null}
        onViewYawChange={game.setViewYaw}
      />

      <Hud
        objective={game.finalMode ? finalObjective : game.objective}
        fear={game.fear}
        action={game.action}
        cameraFeeds={game.cameraFeeds}
        cameraViewer={game.cameraViewer}
        onPreviousCamera={game.previousCamera}
        onNextCamera={game.nextCamera}
        onCloseCamera={game.closeCameraViewer}
        onConfirmCamera={game.confirmCameraFinding}
      />

      {game.jumpscare && (
        <div className="jumpscare" aria-live="assertive">
          <div className="jumpscare-face">
            <span className="jumpscare-eye" />
            <span className="jumpscare-eye" />
            <span className="jumpscare-mouth" />
          </div>
          <p>СИЛУЭТ ПОЙМАЛ ТЕБЯ</p>
        </div>
      )}
    </main>
  );
}

import { useState } from 'react';
import { EndingScreen } from './components/EndingScreen';
import { GameBoard } from './components/GameBoard';
import { Hud } from './components/Hud';
import { MenuScreen } from './components/MenuScreen';
import { useArchiveGame } from './hooks/useArchiveGame';
import { useGameSound } from './hooks/useGameSound';

const finalObjective = {
  night: 'Финал',
  title: 'Закрыть смену',
  hint: 'Красная папка — плохой финал. Урна — хороший. Выход откроется только с тремя скрытыми записями.',
  target: 'exit' as const,
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
        onStart={startGame}
        onToggleSound={toggleSound}
      />
    );
  }

  if (game.ending) {
    return <EndingScreen ending={game.ending} onRestart={game.restart} />;
  }

  return (
    <main className="game-shell">
      <header className="game-title">
        <p className="eyebrow">Психологический 3D-хоррор</p>
        <h1>Последняя папка</h1>
      </header>

      <GameBoard
        player={game.player}
        lightOn={game.lightOn}
        finalMode={game.finalMode}
        records={game.records}
        fear={game.fear}
        actionActive={Boolean(game.action)}
        actionTarget={game.action?.target ?? null}
        onMove={game.move}
        onInteract={game.interact}
        onViewYawChange={game.setViewYaw}
      />

      <Hud
        objective={game.finalMode ? finalObjective : game.objective}
        fear={game.fear}
        inventory={game.inventory}
        message={game.message}
        journal={game.journal}
        action={game.action}
        cameraFeeds={game.cameraFeeds}
        cameraViewer={game.cameraViewer}
        onPreviousCamera={game.previousCamera}
        onNextCamera={game.nextCamera}
        onCloseCamera={game.closeCameraViewer}
        onConfirmCamera={game.confirmCameraFinding}
      />
    </main>
  );
}

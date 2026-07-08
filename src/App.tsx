import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { EndingScreen } from './components/EndingScreen';
import { GameBoard } from './components/GameBoard';
import { Hud } from './components/Hud';
import { MenuScreen } from './components/MenuScreen';
import { MobileControls } from './components/MobileControls';
import { useArchiveGame, type GameSave, type GameSettings } from './hooks/useArchiveGame';
import { useGameSound } from './hooks/useGameSound';
import { supabase } from './lib/supabase';

const GOOGLE_LOGIN_PENDING_KEY = 'archive_google_login_pending';

const finalObjective = {
  night: 'Финал',
  title: 'Выбери, чем закончится архив',
  hint: 'Хорошая концовка: открой выходную дверь и выбеги через белые ворота. Плохая концовка: вскрой красную папку и останься в архиве.',
  target: 'gate' as const,
  success: '',
  fear: 100,
};

const defaultSettings: GameSettings = {
  hintsEnabled: true,
  randomEventsEnabled: true,
  reducedScares: false,
  aiNotesEnabled: true,
};

function isGoogleUser(user: User | null) {
  return Boolean(
    user?.app_metadata?.provider === 'google' ||
      user?.identities?.some((identity) => identity.provider === 'google'),
  );
}

export default function App() {
  const [started, setStarted] = useState(false);
  const startedRef = useRef(false);
  const [user, setUser] = useState<User | null>(null);
  const [initialSave, setInitialSave] = useState<GameSave | null>(null);
  const [saveStatus, setSaveStatus] = useState('Гость: прогресс хранится только до перезапуска.');
  const sound = useGameSound();
  const googleSaveEnabled = isGoogleUser(user);
  const game = useArchiveGame({
    active: started,
    playSound: sound.play,
    initialSave,
    settings: defaultSettings,
  });

  const loadGoogleSave = useCallback(async (currentUser: User) => {
    const { data, error } = await supabase
      .from('game_saves')
      .select('save_data')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (error) {
      setSaveStatus(`Не удалось загрузить сохранение: ${error.message}`);
      return null;
    }

    setSaveStatus(data?.save_data ? 'Google-сохранение загружено.' : 'Google-сохранение будет создано автоматически.');
    return (data?.save_data as GameSave | null) ?? null;
  }, []);

  const startGame = useCallback(
    async (nextUser: User | null = user, options: { startSound?: boolean } = {}) => {
      if (startedRef.current) return;
      startedRef.current = true;

      if (options.startSound !== false) sound.start();

      if (isGoogleUser(nextUser) && nextUser) {
        const save = await loadGoogleSave(nextUser);
        setInitialSave(save);
      } else if (nextUser) {
        setInitialSave(null);
        setSaveStatus('Вход выполнен. Можно играть.');
      } else {
        setInitialSave(null);
        setSaveStatus('Гость: прогресс хранится только до перезапуска.');
      }

      setStarted(true);
    },
    [loadGoogleSave, sound, user],
  );

  const startAuthenticated = useCallback(
    async (auto = false, knownUser?: User | null) => {
      const nextUser =
        knownUser ??
        (await supabase.auth.getSession()).data.session?.user ??
        null;

      setUser(nextUser);

      if (!nextUser) {
        setSaveStatus('Вход не завершился. Попробуй email или Google ещё раз.');
        return;
      }

      sessionStorage.removeItem(GOOGLE_LOGIN_PENDING_KEY);
      await startGame(nextUser, { startSound: !auto });
    },
    [startGame],
  );

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser && sessionStorage.getItem(GOOGLE_LOGIN_PENDING_KEY) === '1') {
        void startAuthenticated(true, sessionUser);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        void startAuthenticated(true, sessionUser);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [startAuthenticated]);

  function toggleSound() {
    if (sound.enabled) sound.stop();
    else sound.start();
  }

  useEffect(() => {
    if (!started || !googleSaveEnabled || !user) return undefined;

    setSaveStatus('Сохраняю прогресс...');
    const timer = window.setTimeout(async () => {
      const { error } = await supabase.from('game_saves').upsert({
        user_id: user.id,
        save_data: game.save,
        updated_at: new Date().toISOString(),
      });

      setSaveStatus(error ? `Ошибка сохранения: ${error.message}` : 'Прогресс сохранён в Google-аккаунте.');
    }, 700);

    return () => window.clearTimeout(timer);
  }, [game.save, googleSaveEnabled, started, user]);

  if (!started) {
    return (
      <MenuScreen
        soundEnabled={sound.enabled}
        saveStatus={saveStatus}
        achievements={game.achievements}
        allAchievements={game.allAchievements}
        onGuestStart={() => void startGame(null, { startSound: true })}
        onAuthenticated={(auto, nextUser) => void startAuthenticated(Boolean(auto), nextUser)}
        onToggleSound={toggleSound}
      />
    );
  }

  if (game.ending) {
    return <EndingScreen ending={game.ending} onRestart={game.restart} endingsFound={game.endingsFound} />;
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
        orangeKeyShelfUnlocked={game.orangeKeyShelfUnlocked}
        droppedItems={game.droppedItems}
        shadowPoint={game.shadowPoint}
        shadowVisible={game.shadowVisible}
        shadowAttacking={game.shadowAttacking}
        actionActive={Boolean(game.action)}
        actionTarget={game.action?.target ?? null}
        currentTarget={(game.finalMode ? finalObjective : game.objective).target}
        objectiveHintVisible={game.objectiveHintVisible}
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

      <MobileControls onMove={game.move} onInteract={game.interact} onDrop={game.dropInventory} />

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

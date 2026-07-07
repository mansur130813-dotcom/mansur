import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Props = {
  onAuthenticated: (auto?: boolean) => void;
};

export function Auth({ onAuthenticated }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) onAuthenticated(true);
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) onAuthenticated(true);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [onAuthenticated]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    try {
      const { data, error } =
        mode === 'signup'
          ? await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
              },
            })
          : await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.session) {
        onAuthenticated(false);
        return;
      }

      if (mode === 'signin') {
        setMessage('Вход не завершился. Проверь email/пароль или подтверди почту.');
        return;
      }

      setMessage('Аккаунт создан. Проверь почту, если Supabase попросит подтвердить email.');
    } catch {
      setMessage('Что-то пошло не так. Попробуй ещё раз.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setBusy(true);
    setMessage('');

    const { data: current } = await supabase.auth.getSession();
    if (current.session) {
      onAuthenticated(false);
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${window.location.pathname}`,
      },
    });

    if (error) {
      setMessage(error.message);
      setBusy(false);
    }
  }

  return (
    <section className="auth-panel">
      <h2>{mode === 'signin' ? 'Вход по email' : 'Регистрация'}</h2>
      <button type="button" className="google-button" onClick={handleGoogleSignIn} disabled={busy}>
        {busy ? '...' : 'Войти через Google'}
      </button>
      <form onSubmit={handleSubmit} className="form">
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="пароль (6+ символов)"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={6}
          required
        />
        <button type="submit" disabled={busy}>
          {busy ? '...' : mode === 'signin' ? 'Войти и играть' : 'Создать аккаунт'}
        </button>
      </form>
      {message && <p className="message">{message}</p>}
      <button
        type="button"
        className="quiet-button auth-switch"
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
      >
        {mode === 'signin' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
      </button>
    </section>
  );
}

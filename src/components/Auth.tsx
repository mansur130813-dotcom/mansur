import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  clearGoogleLoginPending,
  getAuthRedirectUrl,
  getOAuthErrorFromUrl,
  markGoogleLoginPending,
} from '../lib/authRedirect';
import { supabase } from '../lib/supabase';

type Props = {
  onAuthenticated: (auto?: boolean, user?: User | null) => void;
};

export function Auth({ onAuthenticated }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    const authError = getOAuthErrorFromUrl();

    if (authError) {
      clearGoogleLoginPending();
      setMessage(authError);
    }

    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) onAuthenticated(true, data.session.user);
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        onAuthenticated(true, session.user);
      }
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
      const signUpWithEmail = () =>
        supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getAuthRedirectUrl(),
          },
        });

      let result =
        mode === 'signup'
          ? await signUpWithEmail()
          : await supabase.auth.signInWithPassword({ email, password });

      if (mode === 'signin' && result.error?.message.toLowerCase().includes('invalid login credentials')) {
        result = await signUpWithEmail();
      }

      if (result.error) {
        setMessage(result.error.message);
        return;
      }

      if (result.data.session) {
        onAuthenticated(false, result.data.session.user);
        return;
      }

      if (result.data.user) {
        onAuthenticated(false, result.data.user);
        return;
      }

      setMessage('Вход не завершился. Проверь email, пароль или подтверждение почты.');
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
      onAuthenticated(false, current.session.user);
      setBusy(false);
      return;
    }

    markGoogleLoginPending();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectUrl(),
      },
    });

    if (error) {
      clearGoogleLoginPending();
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

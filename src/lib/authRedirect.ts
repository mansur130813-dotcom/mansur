export const GOOGLE_LOGIN_PENDING_KEY = 'archive_google_login_pending';

const AUTH_CALLBACK_PATH = '/auth/callback';

function getAuthParams() {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

  return { searchParams, hashParams };
}

export function getAuthRedirectUrl() {
  return `${window.location.origin}/`;
}

export function markGoogleLoginPending() {
  sessionStorage.setItem(GOOGLE_LOGIN_PENDING_KEY, '1');
  localStorage.setItem(GOOGLE_LOGIN_PENDING_KEY, '1');
}

export function isGoogleLoginPending() {
  return (
    sessionStorage.getItem(GOOGLE_LOGIN_PENDING_KEY) === '1' ||
    localStorage.getItem(GOOGLE_LOGIN_PENDING_KEY) === '1'
  );
}

export function clearGoogleLoginPending() {
  sessionStorage.removeItem(GOOGLE_LOGIN_PENDING_KEY);
  localStorage.removeItem(GOOGLE_LOGIN_PENDING_KEY);
}

export function getOAuthErrorFromUrl() {
  const { searchParams, hashParams } = getAuthParams();
  const error =
    searchParams.get('error_description') ||
    hashParams.get('error_description') ||
    searchParams.get('error') ||
    hashParams.get('error');

  return error ? `Google не завершил вход: ${error}` : '';
}

export function isAuthCallbackUrl() {
  if (window.location.pathname === AUTH_CALLBACK_PATH) return true;

  const { searchParams, hashParams } = getAuthParams();
  return (
    searchParams.has('code') ||
    searchParams.has('error') ||
    searchParams.has('error_description') ||
    hashParams.has('access_token') ||
    hashParams.has('refresh_token') ||
    hashParams.has('error') ||
    hashParams.has('error_description')
  );
}

export function clearAuthCallbackUrl() {
  if (!isAuthCallbackUrl()) return;

  window.history.replaceState({}, document.title, `${window.location.origin}/`);
}

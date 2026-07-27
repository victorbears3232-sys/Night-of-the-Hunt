// auth-errors.js — extract a clear, human-readable message from a Base44 SDK
// auth error so login/register failures are surfaced to the user instead of
// failing silently with a generic "Request failed" string.

export function getAuthErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;
  const status = err.status || (err.response && err.response.status);
  const data = err.data || (err.response && err.response.data) || {};
  const nested = data.message || data.error || data.detail || data.reason;
  if (err.code === 'ERR_NETWORK') {
    return 'Cannot reach the server. Check your connection and try again.';
  }
  if (status === 400) return nested || 'Please check your details and try again.';
  if (status === 401) return nested || 'Invalid email or password.';
  if (status === 403) return nested || 'You do not have access to this app.';
  if (status === 404) return nested || 'Account not found.';
  if (status === 409) return nested || 'An account with this email already exists.';
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (status >= 500) return 'The server is having trouble. Please try again shortly.';
  if (typeof err.message === 'string' && err.message.trim()) return err.message;
  if (typeof nested === 'string' && nested.trim()) return nested;
  return fallback;
}
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';

export default function PasswordReset() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [contactEmail, setContactEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Ein Fehler ist aufgetreten. Bitte versuche es später erneut. Wenn das Problem bestehen bleibt, wende dich an einen Systemadministrator.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || password !== confirmPassword) {
      setMessage('Passwörter stimmen nicht überein.');
      return;
    }
    if (password.length < 6) {
      setMessage('Mindestens 6 Zeichen.');
      return;
    }
    setMessage('');
    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      setStatus('success');
    } catch (err: unknown) {
      const res = err as { response?: { data?: { error?: string; contactEmail?: string } } };
      setMessage(res.response?.data?.error || 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut. Wenn das Problem bestehen bleibt, wende dich an einen Systemadministrator.');
      setContactEmail(res.response?.data?.contactEmail || '');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Passwort geändert
          </h2>
          <p className="text-green-600 dark:text-green-400 mb-6">
            Dein Passwort wurde geändert. Du kannst dich jetzt einloggen.
          </p>
          <Link to="/login">
            <Button fullWidth>Zum Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (status === 'error' && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Fehler
          </h2>
          <p className="text-red-600 dark:text-red-400 mb-2">{message}</p>
          {contactEmail && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Kontakt: <a href={`mailto:${contactEmail}`} className="text-primary-600 hover:underline">{contactEmail}</a>
            </p>
          )}
          {!contactEmail && <div className="mb-6" />}
          <Link to="/password-reset-request">
            <Button fullWidth>Neuen Link anfordern</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          Neues Passwort setzen
        </h2>
        {message && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded text-sm">
            <p>{message}</p>
            {contactEmail && (
              <p className="mt-2 text-xs">Kontakt: <a href={`mailto:${contactEmail}`} className="underline">{contactEmail}</a></p>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Neues Passwort (min. 6 Zeichen)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Passwort bestätigen
            </label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Wird gespeichert...' : 'Passwort setzen'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <Link to="/login" className="text-primary-600 hover:text-primary-700">
            Zurück zum Login
          </Link>
        </p>
      </Card>
    </div>
  );
}

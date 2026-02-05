import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';

export default function PasswordResetRequest() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.requestPasswordReset(email.trim());
      setSent(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Fehler beim Senden');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            E-Mail gesendet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Link zum Zurücksetzen des Passworts gesendet. Bitte prüfe dein Postfach.
          </p>
          <Link to="/login">
            <Button fullWidth>Zurück zum Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          Passwort vergessen
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4 text-sm">
          Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen des Passworts.
        </p>
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Wird gesendet...' : 'Link anfordern'}
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

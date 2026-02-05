import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';

export default function ConfirmEmailChange() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Kein gültiger Link.');
      return;
    }
    authAPI
      .confirmEmailChange(token)
      .then(() => {
        setStatus('success');
        setMessage('Deine E-Mail-Adresse wurde geändert. Du kannst dich mit der neuen Adresse einloggen.');
      })
      .catch((err: { response?: { data?: { error?: string } } }) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Link ungültig oder abgelaufen.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          E-Mail-Adresse bestätigen
        </h2>
        {status === 'loading' && <p className="text-gray-600 dark:text-gray-400">Bitte warte...</p>}
        {status === 'success' && (
          <>
            <p className="text-green-600 dark:text-green-400 mb-6">{message}</p>
            <Link to="/login">
              <Button fullWidth>Zum Login</Button>
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-red-600 dark:text-red-400 mb-6">{message}</p>
            <Link to="/einstellungen">
              <Button fullWidth>Zu den Einstellungen</Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}

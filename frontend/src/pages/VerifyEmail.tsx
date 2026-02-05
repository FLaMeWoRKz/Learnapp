import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Ein Fehler ist aufgetreten. Bitte versuche es später erneut. Wenn das Problem bestehen bleibt, wende dich an einen Systemadministrator.');
      return;
    }
    authAPI
      .verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Deine E-Mail wurde bestätigt. Du kannst dich jetzt einloggen.');
      })
      .catch((err: { response?: { data?: { error?: string; contactEmail?: string } } }) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut. Wenn das Problem bestehen bleibt, wende dich an einen Systemadministrator.');
        setContactEmail(err.response?.data?.contactEmail || '');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          E-Mail bestätigen
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
            <p className="text-red-600 dark:text-red-400 mb-2">{message}</p>
            {contactEmail && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Kontakt: <a href={`mailto:${contactEmail}`} className="text-primary-600 hover:underline">{contactEmail}</a>
              </p>
            )}
            {!contactEmail && <div className="mb-6" />}
            <Link to="/register">
              <Button variant="secondary" fullWidth className="mb-2">
                Erneut registrieren
              </Button>
            </Link>
            <Link to="/login">
              <Button fullWidth>Zum Login</Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { authAPI } from '../services/api';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';

export default function Einstellungen() {
  const { user, updateUser } = useAuth();
  const { vocabDirection, setVocabDirection } = useSettings();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setProfileMessage('');
    setProfileError('');
    try {
      await authAPI.updateProfile({ username: username.trim(), email: email.trim() });
      setProfileMessage('Profil gespeichert.');
      updateUser({ username: username.trim(), email: email.trim() });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setProfileError(e.response?.data?.error || 'Fehler beim Speichern');
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage('');
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Neues Passwort stimmt nicht überein');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Mindestens 6 Zeichen');
      return;
    }
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setPasswordMessage('Passwort geändert.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setPasswordError(e.response?.data?.error || 'Fehler');
    }
  };

  const isGuest = (user as { isGuest?: boolean })?.isGuest;

  return (
    <div className="min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary-600">
              VocabMaster
            </Link>
            <Link to="/">
              <Button variant="secondary" size="sm">
                Zurück
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Einstellungen
        </h2>

        <Card className="mb-8">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Vokabel-Richtung
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Leg fest, ob die Frage auf Deutsch oder Englisch angezeigt wird.
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="vocabDir"
                checked={vocabDirection === 'de-en'}
                onChange={() => setVocabDirection('de-en')}
                className="rounded-full"
              />
              <span className="text-gray-900 dark:text-white">Deutsch → Englisch</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="vocabDir"
                checked={vocabDirection === 'en-de'}
                onChange={() => setVocabDirection('en-de')}
                className="rounded-full"
              />
              <span className="text-gray-900 dark:text-white">Englisch → Deutsch</span>
            </label>
          </div>
        </Card>

        {!isGuest && (
          <>
            <Card className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Profil
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Benutzername (wird von anderen gesehen)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    E-Mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                {profileMessage && <p className="text-green-600">{profileMessage}</p>}
                {profileError && <p className="text-red-600">{profileError}</p>}
                <Button onClick={handleSaveProfile}>Profil speichern</Button>
              </div>
            </Card>

            <Card>
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Passwort ändern
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Aktuelles Passwort
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Neues Passwort
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Neues Passwort bestätigen
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                {passwordMessage && <p className="text-green-600">{passwordMessage}</p>}
                {passwordError && <p className="text-red-600">{passwordError}</p>}
                <Button onClick={handleChangePassword}>Passwort ändern</Button>
              </div>
            </Card>
          </>
        )}

        {isGuest && (
          <Card>
            <p className="text-gray-600 dark:text-gray-300">
              Als Gast kannst du Profil und Passwort nicht ändern. Registriere dich für volle Funktionen.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}

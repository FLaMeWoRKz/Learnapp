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
  const [newUsername, setNewUsername] = useState('');
  const [usernamePassword, setUsernamePassword] = useState('');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChangeUsername = async () => {
    setUsernameMessage('');
    setUsernameError('');
    if (!newUsername.trim()) {
      setUsernameError('Neuer Benutzername eingeben');
      return;
    }
    if (!usernamePassword) {
      setUsernameError('Aktuelles Passwort eingeben');
      return;
    }
    try {
      const { username: updated } = await authAPI.changeUsername(newUsername.trim(), usernamePassword);
      setUsernameMessage('Benutzername wurde geändert.');
      updateUser({ username: updated });
      setNewUsername('');
      setUsernamePassword('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setUsernameError(e.response?.data?.error || 'Fehler');
    }
  };

  const handleChangeEmail = async () => {
    setEmailMessage('');
    setEmailError('');
    if (!newEmail.trim()) {
      setEmailError('Neue E-Mail eingeben');
      return;
    }
    if (!emailPassword) {
      setEmailError('Aktuelles Passwort eingeben');
      return;
    }
    try {
      await authAPI.changeEmail(newEmail.trim(), emailPassword);
      setEmailMessage('Wir haben dir eine E-Mail an deine neue Adresse geschickt. Bitte bestätige sie.');
      setNewEmail('');
      setEmailPassword('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setEmailError(e.response?.data?.error || 'Fehler');
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
              <div className="space-y-2 text-gray-600 dark:text-gray-300">
                <p><span className="font-medium text-gray-700 dark:text-gray-200">Benutzername:</span> {user?.username}</p>
                <p><span className="font-medium text-gray-700 dark:text-gray-200">E-Mail:</span> {user?.email}</p>
              </div>
            </Card>

            <Card className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Benutzername ändern
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Nach der Änderung erhältst du eine Bestätigungs-E-Mail. Der neue Name muss noch frei sein.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Neuer Benutzername</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Neuer Name"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aktuelles Passwort</label>
                  <input
                    type="password"
                    value={usernamePassword}
                    onChange={(e) => setUsernamePassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                {usernameMessage && <p className="text-green-600">{usernameMessage}</p>}
                {usernameError && <p className="text-red-600">{usernameError}</p>}
                <Button onClick={handleChangeUsername}>Benutzername ändern</Button>
              </div>
            </Card>

            <Card className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                E-Mail-Adresse ändern
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Wir senden einen Bestätigungslink an deine neue E-Mail-Adresse. Die neue Adresse darf noch nicht vergeben sein.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Neue E-Mail</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="neue@email.de"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aktuelles Passwort</label>
                  <input
                    type="password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                {emailMessage && <p className="text-green-600">{emailMessage}</p>}
                {emailError && <p className="text-red-600">{emailError}</p>}
                <Button onClick={handleChangeEmail}>E-Mail ändern (Link wird gesendet)</Button>
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

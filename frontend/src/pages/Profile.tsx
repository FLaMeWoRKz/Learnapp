import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';

export default function Profile() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary-600">
              VocabMaster
            </Link>
            <div className="flex gap-4">
              <Link to="/singleplayer">
                <Button variant="secondary" size="sm">
                  Lernen
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={logout}>
                Abmelden
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Profil</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Benutzername
              </label>
              <p className="mt-1 text-lg text-gray-900 dark:text-white">{user?.username}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                E-Mail
              </label>
              <p className="mt-1 text-lg text-gray-900 dark:text-white">{user?.email}</p>
            </div>

            {user?.stats && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Statistiken</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Gelernte Wörter</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {user.stats.totalWordsLearned}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Joker-Punkte</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {user.stats.totalJokerPoints}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Spiele gespielt</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {user.stats.gamesPlayed}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Spiele gewonnen</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {user.stats.gamesWon}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}

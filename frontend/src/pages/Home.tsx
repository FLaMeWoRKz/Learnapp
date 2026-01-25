import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-600">VocabMaster</h1>
            <div className="flex gap-4">
              {isAuthenticated ? (
                <>
                  <Link to="/profile">
                    <Button variant="secondary" size="sm">
                      {user?.username}
                    </Button>
                  </Link>
                  <Link to="/singleplayer">
                    <Button size="sm">Lernen</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="secondary" size="sm">
                      Anmelden
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm">Registrieren</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Willkommen bei VocabMaster
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Dein Multiplayer-Vokabeltrainer für FOS/BOS (B2/C1)
          </p>
        </div>

        {isAuthenticated ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Singleplayer
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Lerne Vokabeln in drei verschiedenen Modi: Level-Modus, Karteikasten oder Freies Üben.
              </p>
              <Link to="/singleplayer">
                <Button fullWidth>Jetzt lernen</Button>
              </Link>
            </Card>

            <Card>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Multiplayer
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Spiele gegen deine Mitschüler im Klassenzimmer. Ähnlich wie Kahoot!
              </p>
              <Link to="/multiplayer">
                <Button fullWidth variant="secondary">
                  Raum erstellen
                </Button>
              </Link>
            </Card>
          </div>
        ) : (
          <Card className="max-w-md mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-white">
              Los geht's!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
              Registriere dich kostenlos und starte mit dem Lernen.
            </p>
            <div className="flex gap-4">
              <Link to="/register" className="flex-1">
                <Button fullWidth>Registrieren</Button>
              </Link>
              <Link to="/login" className="flex-1">
                <Button fullWidth variant="secondary">
                  Anmelden
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

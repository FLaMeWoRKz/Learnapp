import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';
import LevelMode from '../components/singleplayer/LevelMode';
import FlashcardBox from '../components/singleplayer/FlashcardBox';
import FreePractice from '../components/singleplayer/FreePractice';

type Mode = 'select' | 'level' | 'flashcard' | 'free';

export default function SinglePlayer() {
  const [mode, setMode] = useState<Mode>('select');

  if (mode === 'select') {
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

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">
            Lern-Modus wählen
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setMode('level')}>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Level-Modus</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Arbeite dich durch die Packs. Ein Pack gilt als geschafft, wenn &gt;80% richtig beantwortet wurden.
              </p>
              <Button fullWidth>Starten</Button>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setMode('flashcard')}>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Karteikasten</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Leitner-System mit 5 Boxen. Verdiene Joker-Punkte für den Multiplayer-Modus!
              </p>
              <Button fullWidth variant="secondary">Starten</Button>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setMode('free')}>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Freies Üben</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Übe ohne Einfluss auf Statistiken. Wähle manuell Packs/Levels aus.
              </p>
              <Button fullWidth variant="secondary">Starten</Button>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary-600">
              VocabMaster
            </Link>
            <Button variant="secondary" size="sm" onClick={() => setMode('select')}>
              Zurück
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {mode === 'level' && <LevelMode />}
        {mode === 'flashcard' && <FlashcardBox />}
        {mode === 'free' && <FreePractice />}
      </main>
    </div>
  );
}

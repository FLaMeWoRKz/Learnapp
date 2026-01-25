import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { connectSocket, disconnectSocket, socketEvents } from '../services/socket';
import { multiplayerAPI, vocabAPI } from '../services/api';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';
import Lobby from '../components/multiplayer/Lobby';
import GameRoom from '../components/multiplayer/GameRoom';
import type { GameRoom as GameRoomType } from '../types';

type LevelCount = { level: number; count: number };

export default function Multiplayer() {
  const { user } = useAuth();
  const [view, setView] = useState<'menu' | 'settings' | 'lobby' | 'game'>('menu');
  const [room, setRoom] = useState<GameRoomType | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  
  // Settings state
  const [rounds, setRounds] = useState(10);
  const [levelCounts, setLevelCounts] = useState<LevelCount[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<number[]>([1]);
  const [levelSelectionExpanded, setLevelSelectionExpanded] = useState(true);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timerDuration, setTimerDuration] = useState(20);
  const [botCount, setBotCount] = useState(0);

  useEffect(() => {
    if (view === 'settings') {
      vocabAPI.getLevelCounts().then((d) => setLevelCounts(d.levels || []));
    }
  }, [view]);

  useEffect(() => {
    if (user && view !== 'menu' && view !== 'settings') {
      const socket = connectSocket(user.id, user.username);
      
      // Wait for socket to connect
      const setupListeners = () => {
        socketEvents.onRoomUpdated(socket, (roomData) => {
          console.log('Room updated:', roomData);
          setRoom(roomData.room);
        });

        socketEvents.onGameStarted(socket, () => {
          console.log('Game started event received');
          setView('game');
        });

        socketEvents.onQuestion(socket, (data) => {
          console.log('Question event received:', data);
          setCurrentQuestion(data.question);
          // Update room with current round info
          setRoom((prevRoom) => {
            if (prevRoom) {
              return {
                ...prevRoom,
                currentRound: data.round - 1,
                currentQuestion: data.question
              };
            }
            return prevRoom;
          });
          setView('game');
        });

        socketEvents.onGameFinished(socket, (data) => {
          console.log('Game finished:', data);
        });

        socketEvents.onError(socket, (error) => {
          console.error('Socket error:', error);
          alert(`Fehler: ${error.message}`);
        });
      };

      if (socket.connected) {
        setupListeners();
      } else {
        socket.on('connect', () => {
          console.log('Socket connected, setting up listeners');
          setupListeners();
        });
      }

      return () => {
        socketEvents.offRoomUpdated(socket);
        socketEvents.offGameStarted(socket);
        socketEvents.offQuestion(socket);
        socketEvents.offGameFinished(socket);
        socketEvents.offError(socket);
        // Don't disconnect socket here, as it might be needed for other views
      };
    }
  }, [user, view]);

  const toggleLevel = (level: number) => {
    setSelectedLevels((prev) => {
      const next = prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level].sort((a, b) => a - b);
      return next.length > 0 ? next : [level];
    });
  };

  const handleCreateRoom = async () => {
    if (!user || selectedLevels.length === 0) return;

    try {
      const settings = {
        rounds,
        selectedPacks: selectedLevels,
        timerEnabled,
        timerDuration,
        botCount,
      };

      const data = await multiplayerAPI.createRoom(settings);
      setRoom(data.room);
      setRoomCode(data.code);
      setView('lobby');
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleJoinRoom = async () => {
    if (!user || !roomCode) return;

    try {
      const data = await multiplayerAPI.joinRoom(roomCode);
      setRoom(data.room);
      setView('lobby');
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const countByLevel = Object.fromEntries(levelCounts.map((l) => [l.level, l.count]));
  const totalSelected = selectedLevels.reduce((s, l) => s + (countByLevel[l] ?? 0), 0);

  if (view === 'menu') {
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
            Multiplayer
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Raum erstellen</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Erstelle einen neuen Spielraum und lade andere Spieler ein.
              </p>
              <Button fullWidth onClick={() => setView('settings')}>
                Raum erstellen
              </Button>
            </Card>

            <Card>
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Raum beitreten</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Tritt mit einem Code einem bestehenden Raum bei.
              </p>
              <div className="space-y-4">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Raum-Code eingeben"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <Button fullWidth onClick={handleJoinRoom} disabled={!roomCode}>
                  Beitreten
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (view === 'settings') {
    return (
      <div className="min-h-screen">
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="text-2xl font-bold text-primary-600">
                VocabMaster
              </Link>
              <Button variant="secondary" size="sm" onClick={() => setView('menu')}>
                Zurück
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              Raumeinstellungen
            </h2>

            {/* Runden */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Anzahl der Runden
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={rounds}
                onChange={(e) => setRounds(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Level-Auswahl */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Level (mehrfach wählbar)
                </label>
                <button
                  onClick={() => setLevelSelectionExpanded(!levelSelectionExpanded)}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {levelSelectionExpanded ? '▼ Minimieren' : '▶ Erweitern'}
                </button>
              </div>
              {levelSelectionExpanded && (
                <>
                  <div className="flex flex-wrap gap-3">
                    {levelCounts.map(({ level, count }) => {
                      const checked = selectedLevels.includes(level);
                      return (
                        <label
                          key={level}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                            checked
                              ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500 text-primary-800 dark:text-primary-200'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleLevel(level)}
                            className="rounded border-gray-300 dark:border-gray-600"
                          />
                          <span className="font-medium">
                            Level {level} ({count})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {levelCounts.length > 0 && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {selectedLevels.length} Level ausgewählt · {totalSelected} Vokabeln gesamt
                    </p>
                  )}
                  {levelCounts.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400">Keine Level vorhanden. Importiere zuerst Vokabeln.</p>
                  )}
                </>
              )}
              {!levelSelectionExpanded && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedLevels.length} Level ausgewählt · {totalSelected} Vokabeln gesamt
                </p>
              )}
            </div>

            {/* Timer */}
            <div className="mb-6">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={timerEnabled}
                  onChange={(e) => setTimerEnabled(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Timer aktivieren
                </span>
              </label>
              {timerEnabled && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Timer-Dauer (Sekunden)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={timerDuration}
                    onChange={(e) => setTimerDuration(parseInt(e.target.value) || 20)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Bot-Auswahl (zum Testen) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bots hinzufügen (zum Testen)
              </label>
              <select
                value={botCount}
                onChange={(e) => setBotCount(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value={0}>Keine Bots</option>
                <option value={1}>1 Bot</option>
                <option value={2}>2 Bots</option>
                <option value={3}>3 Bots</option>
                <option value={4}>4 Bots</option>
                <option value={5}>5 Bots</option>
              </select>
            </div>

            {/* Erstellen Button */}
            <div className="flex gap-4">
              <Button fullWidth onClick={handleCreateRoom} disabled={selectedLevels.length === 0}>
                Raum erstellen
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const handleLeaveRoom = () => {
    setView('menu');
    setRoom(null);
    setRoomCode('');
  };

  if (view === 'lobby' && room) {
    return (
      <div className="min-h-screen">
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="text-2xl font-bold text-primary-600">
                VocabMaster
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Lobby room={room} roomCode={roomCode} onStart={() => setView('game')} onLeave={handleLeaveRoom} />
        </main>
      </div>
    );
  }

  if (view === 'game' && room) {
    return <GameRoom room={room} roomCode={roomCode} onLeave={handleLeaveRoom} initialQuestion={currentQuestion} />;
  }

  return null;
}

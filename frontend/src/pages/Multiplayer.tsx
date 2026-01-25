import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { connectSocket, disconnectSocket, socketEvents } from '../services/socket';
import { multiplayerAPI } from '../services/api';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';
import Lobby from '../components/multiplayer/Lobby';
import GameRoom from '../components/multiplayer/GameRoom';
import type { GameRoom as GameRoomType } from '../types';

export default function Multiplayer() {
  const { user } = useAuth();
  const [view, setView] = useState<'menu' | 'lobby' | 'game'>('menu');
  const [room, setRoom] = useState<GameRoomType | null>(null);
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    if (user && view !== 'menu') {
      const socket = connectSocket(user.id, user.username);
      
      socketEvents.onRoomUpdated(socket, (roomData) => {
        setRoom(roomData.room);
      });

      socketEvents.onGameStarted(socket, () => {
        setView('game');
      });

      socketEvents.onQuestion(socket, (_data) => {
        setView('game');
      });

      socketEvents.onGameFinished(socket, (data) => {
        // Show leaderboard
        console.log('Game finished:', data);
      });

      return () => {
        socketEvents.offRoomUpdated(socket);
        socketEvents.offGameStarted(socket);
        socketEvents.offQuestion(socket);
        socketEvents.offGameFinished(socket);
        disconnectSocket();
      };
    }
  }, [user, view]);

  const handleCreateRoom = async () => {
    if (!user) return;

    try {
      const settings = {
        rounds: 10,
        selectedPacks: [1, 2, 3], // Default packs
        timerEnabled: true,
        timerDuration: 20,
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
              <Button fullWidth onClick={handleCreateRoom}>
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

  if (view === 'lobby' && room) {
    return <Lobby room={room} roomCode={roomCode} onStart={() => setView('game')} />;
  }

  if (view === 'game' && room) {
    return <GameRoom room={room} roomCode={roomCode} />;
  }

  return null;
}

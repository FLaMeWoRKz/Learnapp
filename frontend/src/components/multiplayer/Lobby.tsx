import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getSocket, socketEvents } from '../../services/socket';
import Button from '../shared/Button';
import Card from '../shared/Card';
import type { GameRoom } from '../../types';

interface LobbyProps {
  room: GameRoom;
  roomCode: string;
  onStart: () => void;
}

export default function Lobby({ room, roomCode, onStart }: LobbyProps) {
  const { user } = useAuth();
  const socket = getSocket();

  useEffect(() => {
    if (socket && user) {
      socketEvents.joinRoom(socket, roomCode, user.id, user.username, false);

      socketEvents.onRoomUpdated(socket, (data) => {
        // Room updated
      });

      return () => {
        socketEvents.offRoomUpdated(socket);
      };
    }
  }, [socket, user, roomCode]);

  const handleStart = () => {
    if (socket && user && room.hostId === user.id) {
      socketEvents.startGame(socket, roomCode, user.id);
      onStart();
    }
  };

  const isHost = room.hostId === user?.id;

  return (
    <Card>
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Lobby</h3>
        <p className="text-lg font-mono text-primary-600">Raum-Code: {roomCode}</p>
      </div>

      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Spieler</h4>
        <div className="space-y-2">
          {room.players.map((player) => (
            <div
              key={player.userId}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <span className="text-gray-900 dark:text-white">
                {player.username}
                {player.userId === room.hostId && (
                  <span className="ml-2 text-sm text-primary-600">(Host)</span>
                )}
                {player.isSpectator && (
                  <span className="ml-2 text-sm text-gray-500">(Zuschauer)</span>
                )}
              </span>
              <span className="text-gray-600 dark:text-gray-400">Punkte: {player.score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Einstellungen</h4>
        <div className="space-y-2 text-gray-600 dark:text-gray-300">
          <p>Runden: {room.settings.rounds}</p>
          <p>Packs: {room.settings.selectedPacks.join(', ')}</p>
          <p>Timer: {room.settings.timerEnabled ? `${room.settings.timerDuration}s` : 'Aus'}</p>
        </div>
      </div>

      {isHost && (
        <Button fullWidth size="lg" onClick={handleStart}>
          Spiel starten
        </Button>
      )}

      {!isHost && (
        <p className="text-center text-gray-600 dark:text-gray-400">
          Warte auf Host zum Starten...
        </p>
      )}
    </Card>
  );
}

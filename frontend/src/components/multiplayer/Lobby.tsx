import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getSocket, socketEvents } from '../../services/socket';
import Button from '../shared/Button';
import Card from '../shared/Card';
import type { GameRoom } from '../../types';

interface LobbyProps {
  room: GameRoom;
  roomCode: string;
  onStart: () => void;
  onLeave?: () => void;
}

export default function Lobby({ room, roomCode, onStart, onLeave }: LobbyProps) {
  const { user } = useAuth();
  const socket = getSocket();
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);

  useEffect(() => {
    if (socket && user) {
      setHasJoinedRoom(false);
      const setupListeners = () => {
        socketEvents.joinRoom(socket, roomCode, user.id, user.username, false);

        socketEvents.onRoomUpdated(socket, (data) => {
          console.log('Lobby: Room updated', data);
          setHasJoinedRoom(true); // Socket hat room-updated empfangen = wir sind im Raum
        });

        socketEvents.onError(socket, (error) => {
          console.error('Lobby: Socket error', error);
          alert(`Fehler: ${error.message}`);
        });
      };

      if (socket.connected) {
        setupListeners();
      } else {
        socket.once('connect', () => {
          console.log('Lobby: Socket connected');
          setupListeners();
        });
      }

      return () => {
        socketEvents.offRoomUpdated(socket);
        socketEvents.offError(socket);
      };
    }
  }, [socket, user, roomCode]);

  const handleStart = () => {
    if (socket && user && room.hostId === user.id) {
      console.log('Starting game...', { roomCode, userId: user.id });
      socketEvents.startGame(socket, roomCode, user.id);
      // onStart wird durch das 'question' Event ausgelöst
    } else {
      console.error('Cannot start game:', { socket: !!socket, user: !!user, isHost: room.hostId === user?.id });
    }
  };

  const handleLeave = () => {
    if (socket && user) {
      socketEvents.leaveRoom(socket, roomCode, user.id);
    }
    if (onLeave) {
      onLeave();
    }
  };

  const isHost = room.hostId === user?.id;

  return (
    <Card>
      {showLeaveWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Raum verlassen?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Möchtest du den Raum wirklich verlassen? Du musst den Raum-Code erneut eingeben, um beizutreten.
            </p>
            <div className="flex gap-4">
              <Button
                variant="danger"
                fullWidth
                onClick={handleLeave}
              >
                Verlassen
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowLeaveWarning(false)}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowLeaveWarning(true)}
        >
          ← Zurück
        </Button>
      </div>
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
                {(player.userId as string)?.startsWith('bot-') && (
                  <span className="ml-2 text-sm text-blue-600">(Bot)</span>
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
          <p>Packs: {[
            ...(room.settings.selectedPacks || []).map((l: number) => `L${l}`),
            ...((room.settings.selectedCustomPacks as string[]) || []).map(() => 'Custom')
          ].join(', ') || '–'}</p>
          <p>Timer: {room.settings.timerEnabled ? `${room.settings.timerDuration}s` : 'Aus'}</p>
          {room.settings.botCount && room.settings.botCount > 0 && (
            <p>Bots: {room.settings.botCount}</p>
          )}
        </div>
      </div>

      {isHost && (
        <Button
          fullWidth
          size="lg"
          onClick={handleStart}
          disabled={!hasJoinedRoom}
          title={!hasJoinedRoom ? 'Warte auf Verbindung zum Spielraum...' : undefined}
        >
          {hasJoinedRoom ? 'Spiel starten' : 'Verbinde...'}
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

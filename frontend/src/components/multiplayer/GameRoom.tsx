import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getSocket, socketEvents } from '../../services/socket';
import Button from '../shared/Button';
import Card from '../shared/Card';
import Timer from '../shared/Timer';
import type { GameRoom as GameRoomType } from '../../types';

interface GameRoomProps {
  room: GameRoomType;
  roomCode: string;
}

export default function GameRoom({ room, roomCode }: GameRoomProps) {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [roundResult, setRoundResult] = useState<any>(null);
  const socket = getSocket();

  useEffect(() => {
    if (socket) {
      socketEvents.onQuestion(socket, (data) => {
        setCurrentQuestion(data.question);
        setSelectedAnswer(null);
        setRoundResult(null);
      });

      socketEvents.onRoundResult(socket, (data) => {
        setRoundResult(data);
        setLeaderboard(
          data.players.sort((a: any, b: any) => b.score - a.score)
        );
      });

      socketEvents.onGameFinished(socket, (data) => {
        setLeaderboard(data.leaderboard);
      });

      return () => {
        socketEvents.offQuestion(socket);
        socketEvents.offRoundResult(socket);
        socketEvents.offGameFinished(socket);
      };
    }
  }, [socket]);

  const handleAnswer = (answer: string) => {
    if (!socket || !user || !currentQuestion || selectedAnswer) return;

    const timeSpent = Math.floor((Date.now() - currentQuestion.startTime) / 1000);
    socketEvents.submitAnswer(socket, roomCode, user.id, currentQuestion.vocabId, answer, timeSpent);
    setSelectedAnswer(answer);
  };

  const handleUseJoker = () => {
    if (!socket || !user) return;
    socketEvents.useJoker(socket, roomCode, user.id);
  };

  const player = room.players.find(p => p.userId === user?.id);
  const isSpectator = player?.isSpectator || false;

  if (roundResult) {
    return (
      <Card>
        <h3 className="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-white">
          Runden-Ergebnis
        </h3>
        <p className="text-center text-lg mb-6 text-gray-600 dark:text-gray-300">
          Richtige Antwort: <span className="font-bold text-primary-600">{roundResult.correctAnswer}</span>
        </p>
        <div className="space-y-2">
          {roundResult.players.map((p: any, index: number) => (
            <div
              key={p.userId}
              className={`flex items-center justify-between p-3 rounded-lg ${
                p.isCorrect
                  ? 'bg-green-100 dark:bg-green-900'
                  : 'bg-gray-50 dark:bg-gray-700'
              }`}
            >
              <span className="text-gray-900 dark:text-white">
                {index + 1}. {p.username}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {p.isCorrect ? '✓' : '✗'} {p.score} Punkte
              </span>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card>
        <p className="text-center text-gray-600 dark:text-gray-300">Warte auf nächste Frage...</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Runde {room.currentRound + 1} / {room.settings.rounds}
          </h3>
          {player && (
            <p className="text-lg font-semibold text-primary-600">
              Deine Punkte: {player.score}
            </p>
          )}
        </div>

        {room.settings.timerEnabled && (
          <Timer
            duration={room.settings.timerDuration}
            onComplete={() => {
              if (!selectedAnswer && !isSpectator) {
                handleAnswer(''); // Timeout
              }
            }}
          />
        )}
      </div>

      <div className="text-center mb-8">
        <h4 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          {currentQuestion.question}
        </h4>
      </div>

      {isSpectator ? (
        <p className="text-center text-gray-600 dark:text-gray-300">
          Du bist Zuschauer. Du kannst keine Antworten abgeben.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {currentQuestion.options.map((option: string, index: number) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.correctAnswer;
              let variant: 'primary' | 'secondary' | 'success' | 'danger' = 'secondary';

              if (isSelected) {
                variant = isCorrect ? 'success' : 'danger';
              }

              return (
                <Button
                  key={index}
                  variant={variant}
                  size="lg"
                  onClick={() => handleAnswer(option)}
                  disabled={!!selectedAnswer}
                >
                  {option}
                </Button>
              );
            })}
          </div>

          {player && player.score >= 5 && (
            <Button
              variant="secondary"
              fullWidth
              onClick={handleUseJoker}
              disabled={!!selectedAnswer}
            >
              50/50 Joker verwenden (5 Joker-Punkte)
            </Button>
          )}
        </>
      )}

      {leaderboard.length > 0 && (
        <div className="mt-8">
          <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Leaderboard</h4>
          <div className="space-y-2">
            {leaderboard.map((p, index) => (
              <div
                key={p.userId}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <span className="text-gray-900 dark:text-white">
                  {index + 1}. {p.username}
                </span>
                <span className="text-gray-600 dark:text-gray-400">{p.score} Punkte</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

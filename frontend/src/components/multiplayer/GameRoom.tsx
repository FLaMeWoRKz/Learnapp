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
  onLeave?: () => void;
  initialQuestion?: any;
}

export default function GameRoom({ room, roomCode, onLeave, initialQuestion }: GameRoomProps) {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState<any>(initialQuestion || null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [roundResult, setRoundResult] = useState<any>(null);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [roundInfo, setRoundInfo] = useState<{ round: number; totalRounds: number } | null>(null);
  const [gameFinished, setGameFinished] = useState(false);
  const [pointsEarned, setPointsEarned] = useState<{ points: number; isCorrect: boolean; x: number; y: number } | null>(null);
  const [timerKey, setTimerKey] = useState(0); // Key to force timer reset
  const socket = getSocket();

  // Set initial question if provided
  useEffect(() => {
    if (initialQuestion) {
      setCurrentQuestion(initialQuestion);
    }
  }, [initialQuestion]);

  useEffect(() => {
    if (socket && user && roomCode) {
      socketEvents.joinRoom(socket, roomCode, user.id, user.username, false);
      const onConnect = () => {
        socketEvents.joinRoom(socket!, roomCode, user!.id, user!.username, false);
      };
      socket.on('connect', onConnect);
      return () => socket.off('connect', onConnect);
    }
  }, [socket, user, roomCode]);

  useEffect(() => {
    if (socket) {
      const handleQuestion = (data: any) => {
        console.log('GameRoom: Question event received', data);
        setCurrentQuestion(data.question);
        setSelectedAnswer(null);
        setRoundResult(null);
        setRoundInfo({ round: data.round, totalRounds: data.totalRounds });
        setTimerKey(prev => prev + 1); // Force timer reset
      };

      const handleRoundResult = (data: any) => {
        console.log('GameRoom: Round result received', data);
        setRoundResult(data);
        setLeaderboard(
          data.players.sort((a: any, b: any) => b.score - a.score)
        );
        // Update roundInfo if provided in round-result (server now sends this)
        if (data.round !== undefined && data.totalRounds !== undefined) {
          setRoundInfo({ round: data.round, totalRounds: data.totalRounds });
        }
        // Ensure we're still in the room to receive the next question
        if (socket && user && roomCode) {
          socketEvents.joinRoom(socket, roomCode, user.id, user.username, false);
        }
      };

      const handleGameFinished = (data: any) => {
        console.log('GameRoom: Game finished', data);
        setLeaderboard(data.leaderboard);
        setRoundResult(null);
        setCurrentQuestion(null);
        setGameFinished(true);
      };

      socketEvents.onQuestion(socket, handleQuestion);
      socketEvents.onRoundResult(socket, handleRoundResult);
      socketEvents.onGameFinished(socket, handleGameFinished);

      return () => {
        socketEvents.offQuestion(socket);
        socketEvents.offRoundResult(socket);
        socketEvents.offGameFinished(socket);
      };
    }
  }, [socket]);

  const handleAnswer = (answer: string, event?: React.MouseEvent<HTMLButtonElement>) => {
    if (!socket || !user || !currentQuestion || selectedAnswer) return;

    const timeSpent = Math.floor((Date.now() - currentQuestion.startTime) / 1000);
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    // Calculate points (same logic as backend)
    let points = 0;
    if (isCorrect) {
      points = 500; // Base points
      const maxTime = 20;
      const speedBonus = Math.max(0, 500 * (1 - timeSpent / maxTime));
      points += Math.round(speedBonus);
    }

    // Get button position for points animation
    if (event) {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      setPointsEarned({
        points,
        isCorrect,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
      
      // Remove points display after animation
      setTimeout(() => {
        setPointsEarned(null);
      }, 2000);
    }

    // Stop timer by setting selectedAnswer first
    setSelectedAnswer(answer);
    
    // Re-join room to ensure we're connected before submitting
    socketEvents.joinRoom(socket, roomCode, user.id, user.username, false);
    
    // Store the question ID to check if we're still on this question later
    const questionId = currentQuestion.vocabId;
    
    // Submit answer after brief delay to ensure join is processed
    setTimeout(() => {
      if (socket && user) {
        console.log('📤 Submitting answer:', { 
          roomCode, 
          userId: user.id, 
          vocabId: questionId, 
          answer, 
          timeSpent,
          socketConnected: socket.connected,
          socketId: socket.id
        });
        socketEvents.submitAnswer(socket, roomCode, user.id, questionId, answer, timeSpent);
      } else {
        console.log('❌ Cannot submit answer: socket or user missing', { socket: !!socket, user: !!user });
      }
    }, 100);
    
    // Fallback: If no round-result received within 5 seconds, create local result
    // Calculate round info at the time of answering (roundInfo should be set from the question event)
    const currentRoundNum = roundInfo?.round || (typeof room.currentRound === 'number' ? room.currentRound + 1 : 1);
    const totalRoundsNum = roundInfo?.totalRounds || room.settings?.rounds || 10;
    
    console.log('🔄 Fallback setup - Round:', currentRoundNum, '/', totalRoundsNum);
    
    const fallbackResult = {
      correctAnswer: currentQuestion.correctAnswer,
      round: currentRoundNum,
      totalRounds: totalRoundsNum,
      players: room.players.map(p => ({
        userId: p.userId,
        username: p.username,
        score: p.userId === user.id ? (player?.score || 0) + (isCorrect ? points : 0) : p.score,
        isCorrect: p.userId === user.id ? isCorrect : false
      }))
    };
    
    setTimeout(() => {
      setRoundResult((current: any) => {
        if (!current) {
          console.log('⚠️ No round-result received after 5s, using local fallback');
          console.log('   Fallback round info:', currentRoundNum, '/', totalRoundsNum);
          // Also update roundInfo to ensure "Weiter" button shows correctly
          setRoundInfo({ round: currentRoundNum, totalRounds: totalRoundsNum });
          return fallbackResult;
        }
        return current;
      });
    }, 5000);
  };

  const handleUseJoker = () => {
    if (!socket || !user) return;
    socketEvents.useJoker(socket, roomCode, user.id);
  };

  const handleNextRound = () => {
    if (!socket) {
      console.log('❌ handleNextRound: No socket');
      return;
    }
    if (!user) {
      console.log('❌ handleNextRound: No user');
      return;
    }
    if (room.hostId !== user.id) {
      console.log('❌ handleNextRound: Not host. Host:', room.hostId, 'User:', user.id);
      return;
    }
    console.log('⏭️ handleNextRound: Requesting next round...', { roomCode, userId: user.id, socketConnected: socket.connected });
    socketEvents.nextRound(socket, roomCode, user.id);
  };

  const handleLeave = () => {
    if (socket && user) {
      socketEvents.leaveRoom(socket, roomCode, user.id);
    }
    if (onLeave) {
      onLeave();
    }
  };

  const player = room.players.find(p => p.userId === user?.id);
  const isSpectator = player?.isSpectator || false;
  const isHost = room.hostId === user?.id;

  if (gameFinished && leaderboard.length > 0) {
    return (
      <Card>
        {showLeaveWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md mx-4">
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                Spiel verlassen?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Möchtest du das Spiel wirklich verlassen?
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

        <h3 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          Spiel beendet!
        </h3>
        <h4 className="text-xl font-semibold mb-6 text-center text-gray-700 dark:text-gray-300">
          Finales Ranking
        </h4>
        <div className="space-y-3 mb-6">
          {leaderboard.map((p, index) => (
            <div
              key={p.userId}
              className={`flex items-center justify-between p-4 rounded-lg ${
                index === 0
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500'
                  : index === 1
                  ? 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-400'
                  : index === 2
                  ? 'bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500'
                  : 'bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-gray-600 dark:text-gray-400 w-8">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {p.username}
                </span>
              </div>
              <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                {p.score} Punkte
              </span>
            </div>
          ))}
        </div>
        <Button fullWidth size="lg" onClick={handleLeave}>
          Zurück zum Menü
        </Button>
      </Card>
    );
  }

  if (roundResult) {
    return (
      <Card>
        {showLeaveWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md mx-4">
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                Spiel verlassen?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Möchtest du das Spiel wirklich verlassen? Du kannst danach nicht mehr zurückkehren.
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

        <h3 className="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-white">
          Runden-Ergebnis
        </h3>
        {(() => {
          // Use roundResult.round if available (from server), otherwise fallback to roundInfo or room data
          const currentRound = roundResult.round || roundInfo?.round || (room.currentRound || 0) + 1;
          const totalRounds = roundResult.totalRounds || roundInfo?.totalRounds || room.settings?.rounds || 10;
          return (
            <p className="text-center text-sm mb-4 text-gray-500 dark:text-gray-400">
              Runde {currentRound} von {totalRounds}
            </p>
          );
        })()}
        <p className="text-center text-lg mb-6 text-gray-600 dark:text-gray-300">
          Richtige Antwort: <span className="font-bold text-primary-600">{roundResult.correctAnswer}</span>
        </p>
        <div className="space-y-2 mb-6">
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
        {(() => {
          // Calculate if there are more rounds using all available sources
          const currentRound = roundResult.round || roundInfo?.round || (room.currentRound || 0) + 1;
          const totalRounds = roundResult.totalRounds || roundInfo?.totalRounds || room.settings?.rounds || 10;
          const hasMoreRounds = currentRound < totalRounds;
          
          if (isHost && hasMoreRounds) {
            return (
              <Button fullWidth size="lg" onClick={handleNextRound}>
                Weiter zur nächsten Frage
              </Button>
            );
          } else if (!isHost && hasMoreRounds) {
            return (
              <p className="text-center text-gray-600 dark:text-gray-400">
                Warte auf Host zum Fortfahren...
              </p>
            );
          }
          return null;
        })()}
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
      {showLeaveWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Spiel verlassen?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Möchtest du das Spiel wirklich verlassen? Du kannst danach nicht mehr zurückkehren.
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Runde {roundInfo ? roundInfo.round : room.currentRound + 1} / {roundInfo ? roundInfo.totalRounds : room.settings.rounds}
          </h3>
          {player && (
            <p className="text-lg font-semibold text-primary-600">
              Deine Punkte: {player.score}
            </p>
          )}
        </div>

        {room.settings.timerEnabled && currentQuestion && !selectedAnswer && (
          <Timer
            key={`${currentQuestion.vocabId}-${timerKey}`} // Reset timer when question changes or key changes
            duration={room.settings.timerDuration}
            onComplete={() => {
              if (!selectedAnswer && !isSpectator && currentQuestion) {
                // Only submit timeout answer if question is still current and no answer selected
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

      {/* Points animation overlay - Kahoot style */}
      {pointsEarned && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: `${pointsEarned.x}px`,
            top: `${pointsEarned.y}px`,
            transform: 'translate(-50%, -50%)',
            animation: 'pointsFloat 2s ease-out forwards'
          }}
        >
          <div
            className={`text-5xl font-extrabold ${
              pointsEarned.isCorrect 
                ? 'text-green-500 drop-shadow-lg' 
                : 'text-red-500 drop-shadow-lg'
            }`}
            style={{
              textShadow: '3px 3px 6px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.5)',
              WebkitTextStroke: '2px white'
            }}
          >
            {pointsEarned.isCorrect ? (
              <span className="inline-block animate-pulse">+{pointsEarned.points}</span>
            ) : (
              <span>✗ Falsch</span>
            )}
          </div>
        </div>
      )}

      {isSpectator ? (
        <p className="text-center text-gray-600 dark:text-gray-300">
          Du bist Zuschauer. Du kannst keine Antworten abgeben.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {currentQuestion.options.map((option: string, index: number) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.correctAnswer;

              // Color mapping for Kahoot-like appearance
              const colors = [
                { bg: 'bg-blue-500 hover:bg-blue-600', selected: 'bg-blue-700' },
                { bg: 'bg-red-500 hover:bg-red-600', selected: 'bg-red-700' },
                { bg: 'bg-yellow-500 hover:bg-yellow-600', selected: 'bg-yellow-700' },
                { bg: 'bg-green-500 hover:bg-green-600', selected: 'bg-green-700' }
              ];
              const colorScheme = colors[index % 4];

              return (
                <button
                  key={index}
                  onClick={(e) => !selectedAnswer && handleAnswer(option, e)}
                  disabled={!!selectedAnswer}
                  className={`
                    ${colorScheme.bg} dark:${colorScheme.selected}
                    text-white font-bold text-xl py-8 px-6 rounded-2xl
                    transition-all duration-200 transform relative
                    ${!selectedAnswer ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-not-allowed opacity-80'}
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-lg hover:shadow-xl
                    ${isSelected 
                      ? isCorrect 
                        ? 'ring-4 ring-green-400 ring-offset-2' 
                        : 'ring-4 ring-red-400 ring-offset-2'
                      : ''
                    }
                  `}
                >
                  {option}
                  {isSelected && (
                    <span className="absolute top-2 right-2 text-2xl font-bold">
                      {isCorrect ? '✓' : '✗'}
                    </span>
                  )}
                </button>
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

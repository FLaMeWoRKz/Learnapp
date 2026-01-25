import { io, Socket } from 'socket.io-client';
import type { GameRoom } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export function connectSocket(userId: string, username: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      userId,
      username,
    },
  });

  socket.on('connect', () => {
    console.log('✅ Connected to server');
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}

// Socket event handlers for multiplayer
export const socketEvents = {
  joinRoom: (socket: Socket, roomCode: string, userId: string, username: string, isSpectator: boolean = false) => {
    socket.emit('join-room', { roomCode, userId, username, isSpectator });
  },

  leaveRoom: (socket: Socket, roomCode: string, userId: string) => {
    socket.emit('leave-room', { roomCode, userId });
  },

  startGame: (socket: Socket, roomCode: string, userId: string) => {
    socket.emit('start-game', { roomCode, userId });
  },

  submitAnswer: (socket: Socket, roomCode: string, userId: string, vocabId: string, answer: string, timeSpent: number) => {
    socket.emit('submit-answer', { roomCode, userId, vocabId, answer, timeSpent });
  },

  useJoker: (socket: Socket, roomCode: string, userId: string) => {
    socket.emit('use-joker', { roomCode, userId });
  },

  nextRound: (socket: Socket, roomCode: string, userId: string) => {
    socket.emit('next-round', { roomCode, userId });
  },

  // Listeners
  onRoomUpdated: (socket: Socket, callback: (data: { room: GameRoom }) => void) => {
    socket.on('room-updated', callback);
  },

  onGameStarted: (socket: Socket, callback: () => void) => {
    socket.on('game-started', callback);
  },

  onQuestion: (socket: Socket, callback: (data: any) => void) => {
    socket.on('question', callback);
  },

  onRoundResult: (socket: Socket, callback: (data: any) => void) => {
    socket.on('round-result', callback);
  },

  onGameFinished: (socket: Socket, callback: (data: { leaderboard: any[] }) => void) => {
    socket.on('game-finished', callback);
  },

  onJokerUsed: (socket: Socket, callback: (data: any) => void) => {
    socket.on('joker-used', callback);
  },

  onError: (socket: Socket, callback: (error: { message: string }) => void) => {
    socket.on('error', callback);
  },

  // Remove listeners
  offRoomUpdated: (socket: Socket) => {
    socket.off('room-updated');
  },

  offGameStarted: (socket: Socket) => {
    socket.off('game-started');
  },

  offQuestion: (socket: Socket) => {
    socket.off('question');
  },

  offRoundResult: (socket: Socket) => {
    socket.off('round-result');
  },

  offGameFinished: (socket: Socket) => {
    socket.off('game-finished');
  },

  offJokerUsed: (socket: Socket) => {
    socket.off('joker-used');
  },

  offError: (socket: Socket) => {
    socket.off('error');
  },
};

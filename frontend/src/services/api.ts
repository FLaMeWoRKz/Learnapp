import axios from 'axios';
import type { User, Vocabulary, UserProgress, FlashcardProgress, GameSession, GameRoom } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (email: string, username: string, password: string) => {
    const response = await api.post('/auth/register', { email, username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },
};

// Vocabulary API
export const vocabAPI = {
  getVocabularies: async (filters?: { level?: number; cefr?: string }): Promise<{ count: number; vocabularies: Vocabulary[] }> => {
    const response = await api.get('/vocab', { params: filters });
    return response.data;
  },

  getVocabularyById: async (id: string): Promise<Vocabulary> => {
    const response = await api.get(`/vocab/${id}`);
    return response.data;
  },
};

// Progress API
export const progressAPI = {
  getUserProgress: async (): Promise<{ count: number; progress: UserProgress[] }> => {
    const response = await api.get('/progress');
    return response.data;
  },

  updateProgress: async (vocabId: string, isCorrect: boolean, level?: number): Promise<UserProgress> => {
    const response = await api.post('/progress', { vocabId, isCorrect, level });
    return response.data;
  },

  getCompletedPacks: async (): Promise<{ completedPacks: number[]; levelStats: any }> => {
    const response = await api.get('/progress/packs');
    return response.data;
  },

  getFlashcardStatus: async (): Promise<FlashcardProgress> => {
    const response = await api.get('/progress/flashcards');
    return response.data;
  },
};

// Game API
export const gameAPI = {
  startGame: async (mode: 'level' | 'flashcard' | 'free', level?: number, packId?: number): Promise<{
    sessionId: string;
    mode: string;
    questionCount: number;
    questions: any[];
  }> => {
    const response = await api.post('/game/start', { mode, level, packId });
    return response.data;
  },

  submitAnswer: async (sessionId: string, vocabId: string, answer: string, timeSpent: number): Promise<{
    correct: boolean;
    correctAnswer: string;
    score: number;
  }> => {
    const response = await api.post(`/game/${sessionId}/answer`, { vocabId, answer, timeSpent });
    return response.data;
  },

  getGameStatus: async (sessionId: string): Promise<GameSession> => {
    const response = await api.get(`/game/${sessionId}`);
    return response.data;
  },
};

// Multiplayer API
export const multiplayerAPI = {
  createRoom: async (settings: {
    rounds: number;
    selectedPacks: number[];
    timerEnabled?: boolean;
    timerDuration?: number;
  }): Promise<{ roomId: string; code: string; room: GameRoom }> => {
    const response = await api.post('/multiplayer/create', { settings });
    return response.data;
  },

  joinRoom: async (code: string): Promise<{ room: GameRoom }> => {
    const response = await api.post('/multiplayer/join', { code });
    return response.data;
  },

  getRoomInfo: async (code: string): Promise<{ room: GameRoom }> => {
    const response = await api.get(`/multiplayer/room/${code}`);
    return response.data;
  },
};

export default api;

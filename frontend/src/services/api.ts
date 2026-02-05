import axios from 'axios';
import type { User, Vocabulary, UserProgress, FlashcardProgress, GameSession, GameRoom } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Debug: Zeige die verwendete API URL
console.log('🔍 API_BASE_URL:', API_BASE_URL);
console.log('🔍 VITE_API_URL env:', import.meta.env.VITE_API_URL);
console.log('🔍 PROD mode:', import.meta.env.PROD);

// Warnung in der Konsole, wenn API_URL nicht gesetzt ist (in Produktion)
if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.error('⚠️ VITE_API_URL ist nicht gesetzt! API-Anfragen werden fehlschlagen.');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // 45 Sekunden (Railway Cold Start kann 30+ Sek dauern)
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    // Bessere Fehlermeldung für Netzwerkfehler
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('❌ Backend nicht erreichbar. Prüfe VITE_API_URL:', API_BASE_URL);
      error.message = 'Backend-Server nicht erreichbar. Bitte prüfe die Konfiguration.';
    }
    // Timeout-Fehler
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('❌ Request timeout. Backend antwortet nicht:', API_BASE_URL);
      error.message = 'Server antwortet nicht. Bitte prüfe, ob das Backend läuft.';
    }
    // Detailliertes Logging für Debugging
    console.error('API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });
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

  guestLogin: async () => {
    const response = await api.post('/auth/guest');
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

  updateProfile: async (data: { username?: string; email?: string }) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put('/auth/password', { currentPassword, newPassword });
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  requestPasswordReset: async (email: string) => {
    const response = await api.post('/auth/request-password-reset', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  changeEmail: async (newEmail: string, currentPassword: string) => {
    const response = await api.post('/auth/change-email', { newEmail, currentPassword });
    return response.data;
  },

  confirmEmailChange: async (token: string) => {
    const response = await api.post('/auth/confirm-email-change', { token });
    return response.data;
  },

  changeUsername: async (newUsername: string, currentPassword: string) => {
    const response = await api.post('/auth/change-username', { newUsername, currentPassword });
    return response.data;
  },
};

// Vocabulary API
export const vocabAPI = {
  getVocabularies: async (filters?: { level?: number; levels?: number[]; cefr?: string; customPackId?: string }): Promise<{ count: number; vocabularies: Vocabulary[] }> => {
    if (filters?.customPackId) {
      const res = await api.get(`/custom-vocab/packs/${filters.customPackId}/vocabularies`);
      return { count: res.data.vocabularies?.length || 0, vocabularies: res.data.vocabularies || [] };
    }
    const params: Record<string, string | number> = {};
    if (filters?.level != null) params.level = filters.level;
    if (filters?.levels?.length) params.levels = filters.levels.join(',');
    if (filters?.cefr) params.cefr = filters.cefr;
    const response = await api.get('/vocab', { params });
    return response.data;
  },

  getVocabularyById: async (id: string): Promise<Vocabulary> => {
    const response = await api.get(`/vocab/${id}`);
    return response.data;
  },

  getLevelCounts: async (): Promise<{ levels: { level: number | string; count: number; custom?: boolean; name?: string }[] }> => {
    const response = await api.get('/vocab/level-counts');
    return response.data;
  },


  importVocabularies: async (): Promise<{ message: string; imported: number; updated: number; total: number }> => {
    const response = await api.post('/vocab/import');
    return response.data;
  },
};

// Custom Vocabulary API
export const customVocabAPI = {
  getPacks: async (): Promise<{ packs: { id: string; name: string; userId: string; createdAt: number }[] }> => {
    const response = await api.get('/custom-vocab/packs');
    return response.data;
  },

  createPack: async (name: string): Promise<{ id: string; name: string; userId: string; createdAt: number }> => {
    const response = await api.post('/custom-vocab/packs', { name });
    return response.data;
  },

  updatePack: async (packId: string, name: string): Promise<{ id: string; name: string }> => {
    const response = await api.put(`/custom-vocab/packs/${packId}`, { name });
    return response.data;
  },

  deletePack: async (packId: string): Promise<void> => {
    await api.delete(`/custom-vocab/packs/${packId}`);
  },

  getVocabularies: async (packId: string): Promise<{ vocabularies: Vocabulary[] }> => {
    const response = await api.get(`/custom-vocab/packs/${packId}/vocabularies`);
    return response.data;
  },

  createVocabulary: async (packId: string, german: string, english: string): Promise<Vocabulary> => {
    const response = await api.post(`/custom-vocab/packs/${packId}/vocabularies`, { german, english });
    return response.data;
  },

  deleteVocabulary: async (vocabId: string): Promise<void> => {
    await api.delete(`/custom-vocab/vocabularies/${vocabId}`);
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

  completeLevel: async (level: number): Promise<{ completedPacks: number[] }> => {
    const response = await api.post('/progress/complete-level', { level });
    return response.data;
  },

  getFlashcardStatus: async (): Promise<FlashcardProgress & { levelCounts?: { level: number; count: number }[]; levelBoxCounts?: Record<number, Record<number, number>> }> => {
    const response = await api.get('/progress/flashcards');
    return response.data;
  },

  updateFlashcardProgress: async (boxes: Record<number, string[]>, jokerPoints?: number): Promise<FlashcardProgress> => {
    const response = await api.post('/progress/flashcards', { boxes, jokerPoints });
    return response.data;
  },
};

// Game API
export const gameAPI = {
  startGame: async (mode: 'level' | 'flashcard' | 'free', level?: number, packId?: string | number): Promise<{
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
    selectedCustomPacks?: string[];
    timerEnabled?: boolean;
    timerDuration?: number;
    botCount?: number;
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

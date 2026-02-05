export interface User {
  id: string;
  email: string;
  username: string;
  stats?: {
    totalWordsLearned: number;
    totalJokerPoints: number;
    gamesPlayed: number;
    gamesWon: number;
  };
}

export interface Vocabulary {
  id: string;
  vocabId: string;
  level: number;
  german: string;
  english: string;
  cefr: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  vocabId: string;
  level: number;
  learned: boolean;
  correctCount: number;
  wrongCount: number;
  lastReviewed?: number;
  currentBox: number;
  packCompleted: boolean;
}

export interface FlashcardProgress {
  id: string;
  userId: string;
  boxes: {
    [boxNumber: number]: string[];
  };
  jokerPoints: number;
  updatedAt: number;
}

export interface GameSession {
  id: string;
  userId: string;
  mode: 'level' | 'flashcard' | 'free';
  level?: number;
  packId?: number;
  questions: {
    vocabId: string;
    answered: boolean;
    correct: boolean;
    timeSpent: number;
  }[];
  score: number;
  completed: boolean;
  createdAt: number;
}

export interface GameRoom {
  id: string;
  code: string;
  hostId: string;
  players: {
    userId: string;
    username: string;
    score: number;
    isSpectator: boolean;
    socketId?: string;
    isBot?: boolean;
  }[];
  settings: {
    rounds: number;
    selectedPacks: number[];
    selectedCustomPacks?: string[];
    timerEnabled: boolean;
    timerDuration: number;
    botCount?: number;
  };
  currentRound: number;
  currentQuestion: {
    vocabId: string;
    question: string;
    options: string[];
    correctAnswer: string;
    startTime: number;
  } | null;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
  updatedAt: number;
}

export interface Question {
  id: string;
  german: string;
  level: number;
}

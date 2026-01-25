import { init } from '@instantdb/admin';
import { localDbHelpers } from './localStorage.js';

// Storage mode: 'local' for testing, 'instantdb' for production
const STORAGE_MODE = process.env.STORAGE_MODE || (process.env.INSTANTDB_APP_ID ? 'instantdb' : 'local');

// InstantDB Configuration
// In production, these should come from environment variables
const APP_ID = process.env.INSTANTDB_APP_ID || '';
const ADMIN_TOKEN = process.env.INSTANTDB_ADMIN_TOKEN || '';

// Initialize InstantDB (only if not using local storage)
let db = null;
if (STORAGE_MODE === 'instantdb') {
  if (!APP_ID) {
    console.warn('⚠️  INSTANTDB_APP_ID not set. Falling back to local storage.');
  } else {
    db = init({
      appId: APP_ID,
      adminToken: ADMIN_TOKEN
    });
    console.log('✅ Using InstantDB for storage');
  }
}

if (STORAGE_MODE === 'local' || !db) {
  console.log('📁 Using local file storage for testing (backend/data/)');
}

// Schema definition (for reference - InstantDB uses schema from dashboard)
export const schema = {
  users: {
    id: { type: 'string', default: 'uuid' },
    email: { type: 'string', indexed: true },
    username: { type: 'string', indexed: true },
    passwordHash: { type: 'string' },
    createdAt: { type: 'number' },
    updatedAt: { type: 'number' },
    stats: {
      totalWordsLearned: { type: 'number', default: 0 },
      totalJokerPoints: { type: 'number', default: 0 },
      gamesPlayed: { type: 'number', default: 0 },
      gamesWon: { type: 'number', default: 0 }
    }
  },
  vocabularies: {
    id: { type: 'string', default: 'uuid' },
    vocabId: { type: 'string', indexed: true },
    level: { type: 'number', indexed: true },
    german: { type: 'string' },
    english: { type: 'string' },
    cefr: { type: 'string', indexed: true },
    createdAt: { type: 'number' }
  },
  userProgress: {
    id: { type: 'string', default: 'uuid' },
    userId: { type: 'string', indexed: true },
    vocabId: { type: 'string', indexed: true },
    level: { type: 'number' },
    learned: { type: 'boolean', default: false },
    correctCount: { type: 'number', default: 0 },
    wrongCount: { type: 'number', default: 0 },
    lastReviewed: { type: 'number' },
    currentBox: { type: 'number', default: 1 },
    packCompleted: { type: 'boolean', default: false },
    createdAt: { type: 'number' },
    updatedAt: { type: 'number' }
  },
  flashcardProgress: {
    id: { type: 'string', default: 'uuid' },
    userId: { type: 'string', indexed: true },
    boxes: { type: 'json' },
    jokerPoints: { type: 'number', default: 0 },
    updatedAt: { type: 'number' }
  },
  gameRooms: {
    id: { type: 'string', default: 'uuid' },
    code: { type: 'string', indexed: true },
    hostId: { type: 'string', indexed: true },
    players: { type: 'json' },
    settings: { type: 'json' },
    currentRound: { type: 'number', default: 0 },
    currentQuestion: { type: 'json' },
    status: { type: 'string', default: 'waiting' },
    createdAt: { type: 'number' },
    updatedAt: { type: 'number' }
  },
  gameSessions: {
    id: { type: 'string', default: 'uuid' },
    userId: { type: 'string', indexed: true },
    mode: { type: 'string' },
    level: { type: 'number' },
    packId: { type: 'number' },
    questions: { type: 'json' },
    score: { type: 'number', default: 0 },
    completed: { type: 'boolean', default: false },
    createdAt: { type: 'number' }
  }
};

// Helper functions - automatically switch between InstantDB and local storage
export const dbHelpers = {
  // User operations
  async createUser(userData) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.createUser(userData);
    }
    return await db.transact(db.tx.users[db.id()].update(userData));
  },

  async getUserByEmail(email) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.getUserByEmail(email);
    }
    const result = await db.query({ users: { $: { where: { email } } } });
    return result?.users?.[0] || null;
  },

  async getUserByUsername(username) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.getUserByUsername(username);
    }
    const result = await db.query({ users: { $: { where: { username } } } });
    return result?.users?.[0] || null;
  },

  async getUserById(userId) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.getUserById(userId);
    }
    const result = await db.query({ users: { $: { where: { id: userId } } } });
    return result?.users?.[0] || null;
  },

  // Vocabulary operations
  async createVocabulary(vocabData) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.createVocabulary(vocabData);
    }
    return await db.transact(db.tx.vocabularies[db.id()].update(vocabData));
  },

  async getVocabularies(filters = {}) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.getVocabularies(filters);
    }
    let query = { vocabularies: {} };
    
    if (filters.level) {
      query.vocabularies.$ = { where: { level: filters.level } };
    }
    if (filters.cefr) {
      query.vocabularies.$ = { where: { cefr: filters.cefr } };
    }
    
    const result = await db.query(query);
    return result?.vocabularies || [];
  },

  async getVocabularyById(vocabId) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.getVocabularyById(vocabId);
    }
    const result = await db.query({ 
      vocabularies: { $: { where: { vocabId } } } 
    });
    return result?.vocabularies?.[0] || null;
  },

  // User Progress operations
  async getUserProgress(userId, vocabId) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.getUserProgress(userId, vocabId);
    }
    const result = await db.query({
      userProgress: {
        $: {
          where: { userId, vocabId }
        }
      }
    });
    return result?.userProgress?.[0] || null;
  },

  async getAllUserProgress(userId) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.getAllUserProgress(userId);
    }
    const result = await db.query({
      userProgress: {
        $: {
          where: { userId }
        }
      }
    });
    return result?.userProgress || [];
  },

  async updateUserProgress(progressData) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.updateUserProgress(progressData);
    }
    // Check if progress exists
    const existing = await this.getUserProgress(progressData.userId, progressData.vocabId);
    if (existing) {
      return await db.transact(db.tx.userProgress[existing.id].update(progressData));
    } else {
      return await db.transact(db.tx.userProgress[db.id()].update(progressData));
    }
  },

  // Flashcard Progress operations
  async getFlashcardProgress(userId) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.getFlashcardProgress(userId);
    }
    const result = await db.query({
      flashcardProgress: {
        $: {
          where: { userId }
        }
      }
    });
    return result?.flashcardProgress?.[0] || null;
  },

  async updateFlashcardProgress(progressData) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.updateFlashcardProgress(progressData);
    }
    // Check if progress exists
    const existing = await this.getFlashcardProgress(progressData.userId);
    if (existing) {
      return await db.transact(db.tx.flashcardProgress[existing.id].update(progressData));
    } else {
      return await db.transact(db.tx.flashcardProgress[db.id()].update(progressData));
    }
  },

  // Game Room operations
  async createGameRoom(roomData) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.createGameRoom(roomData);
    }
    return await db.transact(db.tx.gameRooms[db.id()].update(roomData));
  },

  async getGameRoomByCode(code) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.getGameRoomByCode(code);
    }
    const result = await db.query({
      gameRooms: {
        $: {
          where: { code }
        }
      }
    });
    return result?.gameRooms?.[0] || null;
  },

  async updateGameRoom(roomId, roomData) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.updateGameRoom(roomId, roomData);
    }
    return await db.transact(db.tx.gameRooms[roomId].update({
      ...roomData,
      updatedAt: Date.now()
    }));
  },

  // Game Session operations
  async createGameSession(sessionData) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.createGameSession(sessionData);
    }
    return await db.transact(db.tx.gameSessions[db.id()].update(sessionData));
  },

  async getGameSession(sessionId) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.getGameSession(sessionId);
    }
    const result = await db.query({
      gameSessions: {
        $: {
          where: { id: sessionId }
        }
      }
    });
    return result?.gameSessions?.[0] || null;
  },

  async updateGameSession(sessionId, sessionData) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.updateGameSession(sessionId, sessionData);
    }
    return await db.transact(db.tx.gameSessions[sessionId].update(sessionData));
  }
};

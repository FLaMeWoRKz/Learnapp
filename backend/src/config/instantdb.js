import { init, id } from '@instantdb/admin';
import { i } from '@instantdb/core';
import { localDbHelpers } from './localStorage.js';

// Storage mode: 'local' for testing, 'instantdb' for production
const STORAGE_MODE = process.env.STORAGE_MODE || (process.env.INSTANTDB_APP_ID ? 'instantdb' : 'local');

// InstantDB Configuration
// In production, these should come from environment variables
const APP_ID = process.env.INSTANTDB_APP_ID || '';
const ADMIN_TOKEN = process.env.INSTANTDB_ADMIN_TOKEN || '';

// Define schema inline for InstantDB Admin API
// This schema matches the one in instant.schema.ts
const schema = i.schema({
  entities: {
    "$files": i.entity({
      "path": i.string().unique().indexed(),
      "url": i.string().optional(),
    }),
    "$users": i.entity({
      "email": i.string().unique().indexed().optional(),
      "imageURL": i.string().optional(),
      "type": i.string().optional(),
    }),
    "flashcardProgress": i.entity({
      "boxes": i.string(),
      "jokerPoints": i.number(),
      "updatedAt": i.number(),
      "userId": i.string().indexed(),
    }),
    "gameRooms": i.entity({
      "code": i.string().unique().indexed(),
      "createdAt": i.number(),
      "currentQuestion": i.string().optional(),
      "currentRound": i.number(),
      "hostId": i.string().indexed(),
      "players": i.string(),
      "settings": i.string(),
      "status": i.string(),
      "updatedAt": i.number(),
    }),
    "gameSessions": i.entity({
      "completed": i.boolean(),
      "createdAt": i.number(),
      "level": i.number(),
      "mode": i.string(),
      "packId": i.number(),
      "questions": i.string(),
      "score": i.number(),
      "userId": i.string().indexed(),
    }),
    "userProgress": i.entity({
      "correctCount": i.number(),
      "createdAt": i.number(),
      "currentBox": i.number(),
      "lastReviewed": i.number().optional(),
      "learned": i.boolean(),
      "level": i.number(),
      "packCompleted": i.boolean(),
      "updatedAt": i.number(),
      "userId": i.string().indexed(),
      "vocabId": i.string().indexed(),
      "wrongCount": i.number(),
    }),
    "users": i.entity({
      "createdAt": i.number(),
      "email": i.string().unique().indexed(),
      "passwordHash": i.string(),
      "stats": i.string(),
      "updatedAt": i.number(),
      "username": i.string().unique().indexed(),
    }),
    "vocabularies": i.entity({
      "cefr": i.string().indexed(),
      "createdAt": i.number(),
      "english": i.string(),
      "german": i.string(),
      "level": i.number().indexed(),
      "vocabId": i.string().indexed(),
    }),
  },
  links: {
    "$usersLinkedPrimaryUser": {
      "forward": {
        "on": "$users",
        "has": "one",
        "label": "linkedPrimaryUser",
        "onDelete": "cascade"
      },
      "reverse": {
        "on": "$users",
        "has": "many",
        "label": "linkedGuestUsers"
      }
    }
  },
  rooms: {}
});

// Initialize InstantDB (only if not using local storage)
let db = null;
if (STORAGE_MODE === 'instantdb') {
  if (!APP_ID) {
    console.warn('⚠️  INSTANTDB_APP_ID not set. Falling back to local storage.');
  } else if (!ADMIN_TOKEN) {
    console.warn('⚠️  INSTANTDB_ADMIN_TOKEN not set. Falling back to local storage.');
  } else {
    try {
      db = init({
        appId: APP_ID,
        adminToken: ADMIN_TOKEN,
        schema: schema  // Pass schema to enable db.tx
      });
      console.log('✅ Using InstantDB for storage');
      console.log(`📡 App ID: ${APP_ID.substring(0, 8)}...`);
      console.log(`🔍 db.tx available: ${db && db.tx ? 'yes' : 'no'}`);
      if (db && db.tx) {
        console.log(`🔍 db.tx.users available: ${db.tx.users ? 'yes' : 'no'}`);
      }
    } catch (error) {
      console.error('❌ Failed to initialize InstantDB:', error.message);
      console.error('Stack:', error.stack);
      console.warn('⚠️  Falling back to local storage.');
      db = null;
    }
  }
}

if (STORAGE_MODE === 'local' || !db) {
  console.log('📁 Using local file storage for testing (backend/data/)');
  console.log(`🔍 STORAGE_MODE: ${STORAGE_MODE}, db: ${db ? 'initialized' : 'null'}`);
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
    if (!db || !db.tx || !db.tx.users) {
      console.error('❌ InstantDB not properly initialized. db.tx.users is undefined');
      throw new Error('Database not initialized. Please check INSTANTDB_APP_ID and INSTANTDB_ADMIN_TOKEN.');
    }
    // InstantDB Admin API: transact expects an array
    const newId = id();
    await db.transact([db.tx.users[newId].update(userData)]);
    return newId;
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

  async updateUser(userId, userData) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.updateUser(userId, userData);
    }
    const user = await this.getUserById(userId);
    if (!user) return null;
    await db.transact([db.tx.users[user.id].update({ ...userData, updatedAt: Date.now() })]);
    return user;
  },

  // Vocabulary operations
  async createVocabulary(vocabData) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.createVocabulary(vocabData);
    }
    const newId = id();
    await db.transact([db.tx.vocabularies[newId].update(vocabData)]);
    return newId;
  },

  async getVocabularies(filters = {}) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.getVocabularies(filters);
    }
    const result = await db.query({ vocabularies: {} });
    let list = result?.vocabularies || [];
    if (filters.level) list = list.filter(v => v.level === filters.level);
    if (filters.levels?.length) {
      const set = new Set(filters.levels);
      list = list.filter(v => set.has(v.level));
    }
    if (filters.cefr) list = list.filter(v => v.cefr === filters.cefr);
    return list;
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

  async updateVocabulary(vocabId, vocabData) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.updateVocabulary(vocabId, vocabData);
    }
    const existing = await this.getVocabularyById(vocabId);
    if (!existing) return null;
    await db.transact([db.tx.vocabularies[existing.id].update(vocabData)]);
    return existing;
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
      await db.transact([db.tx.userProgress[existing.id].update(progressData)]);
      return true;
    } else {
      const newId = id();
      await db.transact([db.tx.userProgress[newId].update(progressData)]);
      return true;
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
      await db.transact([db.tx.flashcardProgress[existing.id].update(progressData)]);
      return true;
    } else {
      const newId = id();
      await db.transact([db.tx.flashcardProgress[newId].update(progressData)]);
      return true;
    }
  },

  // Game Room operations
  async createGameRoom(roomData) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.createGameRoom(roomData);
    }
    return await db.transact([db.tx.gameRooms[id()].update(roomData)]);
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
    return await db.transact([db.tx.gameRooms[roomId].update({
      ...roomData,
      updatedAt: Date.now()
    })]);
  },

  // Game Session operations
  async createGameSession(sessionData) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.createGameSession(sessionData);
    }
    return await db.transact([db.tx.gameSessions[id()].update(sessionData)]);
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
    return await db.transact([db.tx.gameSessions[sessionId].update(sessionData)]);
  },

  async getUserGameSession(userId, mode, level) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.getUserGameSession(userId, mode, level);
    }
    const result = await db.query({
      gameSessions: {
        $: {
          where: { 
            userId,
            mode,
            level,
            completed: false
          }
        }
      }
    });
    return result?.gameSessions?.[0] || null;
  }
};

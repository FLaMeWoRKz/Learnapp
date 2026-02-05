import { init, id } from '@instantdb/admin';
import { localDbHelpers } from './localStorage.js';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Storage mode: 'local' for testing, 'instantdb' for production
const STORAGE_MODE = process.env.STORAGE_MODE || (process.env.INSTANTDB_APP_ID ? 'instantdb' : 'local');

// InstantDB Configuration
// In production, these should come from environment variables
const APP_ID = process.env.INSTANTDB_APP_ID || '';
const ADMIN_TOKEN = process.env.INSTANTDB_ADMIN_TOKEN || '';

// Use createRequire to import CommonJS module in ESM
const require = createRequire(import.meta.url);

// Load schema - try importing from JavaScript file
let schema;
try {
  // Import JavaScript version of schema (in same directory as backend)
  // __dirname is /app/src/config
  // instant.schema.js is at /app/instant.schema.js
  const schemaPath = join(__dirname, '../../instant.schema.js');
  console.log('🔍 Trying to import schema from instant.schema.js...');
  console.log('🔍 __dirname:', __dirname);
  console.log('🔍 Computed schema path:', schemaPath);
  
  const schemaModule = await import(schemaPath);
  console.log('🔍 schemaModule type:', typeof schemaModule);
  console.log('🔍 schemaModule keys:', Object.keys(schemaModule));
  console.log('🔍 schemaModule.default type:', typeof schemaModule.default);
  
  schema = schemaModule.default || schemaModule;
  if (schema) {
    console.log('✅ Loaded schema from instant.schema.js');
    console.log('🔍 Schema type:', typeof schema);
    console.log('🔍 Schema keys:', Object.keys(schema));
  } else {
    throw new Error('Schema is null or undefined');
  }
} catch (e) {
  console.error('⚠️  Could not import schema');
  console.error('Error name:', e.name);
  console.error('Error message:', e.message);
  console.error('Error stack:', e.stack);
  schema = null;
}

// Initialize InstantDB (only if not using local storage)
let db = null;
if (STORAGE_MODE === 'instantdb') {
  if (!APP_ID) {
    console.warn('⚠️  INSTANTDB_APP_ID not set. Falling back to local storage.');
  } else if (!ADMIN_TOKEN) {
    console.warn('⚠️  INSTANTDB_ADMIN_TOKEN not set. Falling back to local storage.');
  } else if (!schema) {
    console.error('❌ Schema is null! Cannot initialize InstantDB without schema.');
    console.warn('⚠️  Falling back to local storage.');
  } else {
    try {
      console.log('🔍 Initializing InstantDB with schema...');
      console.log('🔍 Schema type:', typeof schema);
      console.log('🔍 Schema keys:', schema ? Object.keys(schema) : 'null');
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
        console.log(`🔍 db.tx.vocabularies available: ${db.tx.vocabularies ? 'yes' : 'no'}`);
        console.log(`🔍 db.tx keys: ${Object.keys(db.tx).join(', ')}`);
      } else {
        console.error('❌ db.tx is not available! Schema might not be properly passed.');
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

  async getUserByEmailVerificationToken(token) {
    if (STORAGE_MODE === 'local' || !db || !token) return await localDbHelpers.getUserByEmailVerificationToken(token);
    const result = await db.query({ users: { $: { where: { emailVerificationToken: token } } } });
    const user = result?.users?.[0] || null;
    if (user && user.emailVerificationExpires && user.emailVerificationExpires > Date.now()) return user;
    return null;
  },

  async getUserByPasswordResetToken(token) {
    if (STORAGE_MODE === 'local' || !db || !token) return await localDbHelpers.getUserByPasswordResetToken(token);
    const result = await db.query({ users: { $: { where: { passwordResetToken: token } } } });
    const user = result?.users?.[0] || null;
    if (user && user.passwordResetExpires && user.passwordResetExpires > Date.now()) return user;
    return null;
  },

  async getUserByChangeEmailToken(token) {
    if (STORAGE_MODE === 'local' || !db || !token) return await localDbHelpers.getUserByChangeEmailToken(token);
    const result = await db.query({ users: { $: { where: { changeEmailToken: token } } } });
    const user = result?.users?.[0] || null;
    if (user && user.changeEmailExpires && user.changeEmailExpires > Date.now()) return user;
    return null;
  },

  // Vocabulary operations
  async createVocabulary(vocabData) {
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.createVocabulary(vocabData);
    }
    if (!db || !db.tx || !db.tx.vocabularies) {
      console.error('❌ InstantDB not properly initialized. db.tx.vocabularies is undefined');
      throw new Error('Database not initialized. Please check INSTANTDB_APP_ID and INSTANTDB_ADMIN_TOKEN.');
    }
    const newId = id();
    await db.transact([db.tx.vocabularies[newId].update(vocabData)]);
    return newId;
  },

  async getVocabularies(filters = {}) {
    if (filters.customPackId) {
      return await localDbHelpers.getCustomVocabulariesByPack(filters.customPackId, filters.userId || '');
    }
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
    if (vocabId && vocabId.startsWith('custom-')) {
      return await localDbHelpers.getCustomVocabularyById(vocabId);
    }
    if (STORAGE_MODE === 'local' || !db) {
      return await localDbHelpers.getVocabularyById(vocabId);
    }
    const result = await db.query({ 
      vocabularies: { $: { where: { vocabId } } } 
    });
    const found = result?.vocabularies?.[0];
    if (found) return found;
    return await localDbHelpers.getCustomVocabularyById(vocabId);
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
    if (!db || !db.tx || !db.tx.gameRooms) {
      console.error('❌ InstantDB not properly initialized. db.tx.gameRooms is undefined');
      throw new Error('Database not initialized. Please check INSTANTDB_APP_ID and INSTANTDB_ADMIN_TOKEN.');
    }
    const newId = id();
    await db.transact([db.tx.gameRooms[newId].update(roomData)]);
    return newId; // Gib die ID zurück, nicht das Transact-Ergebnis
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
    const sessionId = id();
    await db.transact([db.tx.gameSessions[sessionId].update(sessionData)]);
    return sessionId; // Gib nur die ID zurück, nicht das ganze Transact-Ergebnis
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
  },

  // Custom Packs & Vocabularies (nutzen localStorage-Dateien, funktioniert mit beiden Modi)
  async createCustomPack(userId, name) {
    return await localDbHelpers.createCustomPack(userId, name);
  },
  async getCustomPacks(userId) {
    return await localDbHelpers.getCustomPacks(userId);
  },
  async getCustomPackById(packId, userId) {
    return await localDbHelpers.getCustomPackById(packId, userId);
  },
  async updateCustomPack(packId, userId, name) {
    return await localDbHelpers.updateCustomPack(packId, userId, name);
  },
  async deleteCustomPack(packId, userId) {
    return await localDbHelpers.deleteCustomPack(packId, userId);
  },
  async createCustomVocabulary(packId, userId, german, english) {
    return await localDbHelpers.createCustomVocabulary(packId, userId, german, english);
  },
  async getCustomVocabulariesByPack(packId, userId) {
    return await localDbHelpers.getCustomVocabulariesByPack(packId, userId);
  },
  async getCustomVocabularyById(vocabId) {
    return await localDbHelpers.getCustomVocabularyById(vocabId);
  },
  async deleteCustomVocabulary(vocabId, userId) {
    return await localDbHelpers.deleteCustomVocabulary(vocabId, userId);
  }
};

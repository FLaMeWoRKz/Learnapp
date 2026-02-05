import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local storage directory
const STORAGE_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(STORAGE_DIR, 'users.json');
const VOCAB_FILE = path.join(STORAGE_DIR, 'vocabularies.json');
const PROGRESS_FILE = path.join(STORAGE_DIR, 'userProgress.json');
const FLASHCARD_FILE = path.join(STORAGE_DIR, 'flashcardProgress.json');
const GAMEROOMS_FILE = path.join(STORAGE_DIR, 'gameRooms.json');
const GAMESESSIONS_FILE = path.join(STORAGE_DIR, 'gameSessions.json');
const CUSTOMPACKS_FILE = path.join(STORAGE_DIR, 'customPacks.json');
const CUSTOMVOCAB_FILE = path.join(STORAGE_DIR, 'customVocabularies.json');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Helper functions to read/write JSON files
function readJSON(filePath, defaultValue = []) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (!content || content.trim() === '') {
        console.warn(`⚠️ ${filePath} ist leer, verwende Standardwert`);
        return defaultValue;
      }
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    // Wenn die Datei beschädigt ist, benenne sie um und erstelle eine neue
    if (fs.existsSync(filePath)) {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      try {
        fs.renameSync(filePath, backupPath);
        console.log(`📦 Beschädigte Datei gesichert als: ${backupPath}`);
      } catch (renameError) {
        console.error(`❌ Konnte beschädigte Datei nicht umbenennen:`, renameError);
      }
    }
  }
  return defaultValue;
}

function writeJSON(filePath, data) {
  try {
    // Erstelle Backup vor dem Schreiben
    if (fs.existsSync(filePath)) {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      try {
        fs.copyFileSync(filePath, backupPath);
      } catch (backupError) {
        // Backup-Fehler ignorieren, nicht kritisch
      }
    }
    // Schreibe atomar: zuerst in temporäre Datei, dann umbenennen
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (error) {
    console.error(`❌ Error writing ${filePath}:`, error);
    // Lösche temporäre Datei falls vorhanden
    const tempPath = `${filePath}.tmp`;
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (unlinkError) {
        // Ignorieren
      }
    }
    return false;
  }
}

// Generate UUID
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Local storage helpers (mimicking InstantDB interface)
export const localDbHelpers = {
  // User operations
  async createUser(userData) {
    const users = readJSON(USERS_FILE, []);
    const newUser = {
      id: generateId(),
      ...userData
    };
    users.push(newUser);
    writeJSON(USERS_FILE, users);
    return newUser.id;
  },

  async getUserByEmail(email) {
    const users = readJSON(USERS_FILE, []);
    return users.find(u => u.email === email) || null;
  },

  async getUserByUsername(username) {
    const users = readJSON(USERS_FILE, []);
    return users.find(u => u.username === username) || null;
  },

  async getUserById(userId) {
    const users = readJSON(USERS_FILE, []);
    return users.find(u => u.id === userId) || null;
  },

  async updateUser(userId, userData) {
    const users = readJSON(USERS_FILE, []);
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...userData, updatedAt: Date.now() };
      writeJSON(USERS_FILE, users);
      return users[index];
    }
    return null;
  },

  async getUserByEmailVerificationToken(token) {
    if (!token) return null;
    const users = readJSON(USERS_FILE, []);
    return users.find(u => u.emailVerificationToken === token && u.emailVerificationExpires > Date.now()) || null;
  },

  async getUserByPasswordResetToken(token) {
    if (!token) return null;
    const users = readJSON(USERS_FILE, []);
    return users.find(u => u.passwordResetToken === token && u.passwordResetExpires > Date.now()) || null;
  },

  async getUserByChangeEmailToken(token) {
    if (!token) return null;
    const users = readJSON(USERS_FILE, []);
    return users.find(u => u.changeEmailToken === token && u.changeEmailExpires > Date.now()) || null;
  },

  // Vocabulary operations
  async createVocabulary(vocabData) {
    const vocabularies = readJSON(VOCAB_FILE, []);
    const newVocab = {
      id: generateId(),
      ...vocabData,
      createdAt: Date.now()
    };
    vocabularies.push(newVocab);
    writeJSON(VOCAB_FILE, vocabularies);
    return newVocab.id;
  },

  async getVocabularies(filters = {}) {
    let vocabularies = readJSON(VOCAB_FILE, []);
    if (filters.customPackId) {
      vocabularies = await this.getCustomVocabulariesByPack(filters.customPackId, filters.userId || '');
      return vocabularies;
    }
    if (filters.level) {
      vocabularies = vocabularies.filter(v => v.level === filters.level);
    }
    if (filters.levels && filters.levels.length) {
      const set = new Set(filters.levels);
      vocabularies = vocabularies.filter(v => set.has(v.level));
    }
    if (filters.cefr) {
      vocabularies = vocabularies.filter(v => v.cefr === filters.cefr);
    }
    return vocabularies;
  },

  async getVocabularyById(vocabId) {
    const vocabularies = readJSON(VOCAB_FILE, []);
    const standard = vocabularies.find(v => v.vocabId === vocabId);
    if (standard) return standard;
    return await this.getCustomVocabularyById(vocabId);
  },

  async updateVocabulary(vocabId, vocabData) {
    const vocabularies = readJSON(VOCAB_FILE, []);
    const index = vocabularies.findIndex(v => v.vocabId === vocabId);
    if (index !== -1) {
      vocabularies[index] = { ...vocabularies[index], ...vocabData, updatedAt: Date.now() };
      writeJSON(VOCAB_FILE, vocabularies);
      return vocabularies[index];
    }
    return null;
  },

  // User Progress operations
  async getUserProgress(userId, vocabId) {
    const progress = readJSON(PROGRESS_FILE, []);
    return progress.find(p => p.userId === userId && p.vocabId === vocabId) || null;
  },

  async getAllUserProgress(userId) {
    const progress = readJSON(PROGRESS_FILE, []);
    return progress.filter(p => p.userId === userId);
  },

  async updateUserProgress(progressData) {
    const progress = readJSON(PROGRESS_FILE, []);
    const existing = progress.find(
      p => p.userId === progressData.userId && p.vocabId === progressData.vocabId
    );
    
    if (existing) {
      const index = progress.indexOf(existing);
      progress[index] = { ...progress[index], ...progressData, updatedAt: Date.now() };
    } else {
      progress.push({
        id: generateId(),
        ...progressData,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
    
    writeJSON(PROGRESS_FILE, progress);
    return true;
  },

  // Flashcard Progress operations
  async getFlashcardProgress(userId) {
    const flashcardProgress = readJSON(FLASHCARD_FILE, []);
    return flashcardProgress.find(fp => fp.userId === userId) || null;
  },

  async updateFlashcardProgress(progressData) {
    const flashcardProgress = readJSON(FLASHCARD_FILE, []);
    const existing = flashcardProgress.find(fp => fp.userId === progressData.userId);
    
    if (existing) {
      const index = flashcardProgress.indexOf(existing);
      flashcardProgress[index] = { ...existing, ...progressData, updatedAt: Date.now() };
    } else {
      flashcardProgress.push({
        id: generateId(),
        ...progressData,
        updatedAt: Date.now()
      });
    }
    
    writeJSON(FLASHCARD_FILE, flashcardProgress);
    return true;
  },

  // Game Room operations
  async createGameRoom(roomData) {
    const rooms = readJSON(GAMEROOMS_FILE, []);
    const newRoom = {
      id: generateId(),
      ...roomData,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    rooms.push(newRoom);
    writeJSON(GAMEROOMS_FILE, rooms);
    return newRoom.id;
  },

  async getGameRoomByCode(code) {
    const rooms = readJSON(GAMEROOMS_FILE, []);
    return rooms.find(r => r.code === code) || null;
  },

  async updateGameRoom(roomId, roomData) {
    const rooms = readJSON(GAMEROOMS_FILE, []);
    const index = rooms.findIndex(r => r.id === roomId);
    if (index !== -1) {
      rooms[index] = { ...rooms[index], ...roomData, updatedAt: Date.now() };
      writeJSON(GAMEROOMS_FILE, rooms);
      return rooms[index];
    }
    return null;
  },

  // Game Session operations
  async createGameSession(sessionData) {
    const sessions = readJSON(GAMESESSIONS_FILE, []);
    const newSession = {
      id: generateId(),
      ...sessionData
    };
    sessions.push(newSession);
    writeJSON(GAMESESSIONS_FILE, sessions);
    return newSession.id;
  },

  async getGameSession(sessionId) {
    const sessions = readJSON(GAMESESSIONS_FILE, []);
    return sessions.find(s => s.id === sessionId) || null;
  },

  async updateGameSession(sessionId, sessionData) {
    const sessions = readJSON(GAMESESSIONS_FILE, []);
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...sessionData };
      writeJSON(GAMESESSIONS_FILE, sessions);
      return sessions[index];
    }
    return null;
  },

  async getUserGameSession(userId, mode, level) {
    const sessions = readJSON(GAMESESSIONS_FILE, []);
    return sessions.find(s => 
      s.userId === userId && 
      s.mode === mode && 
      s.level === level && 
      !s.completed
    ) || null;
  },

  // Custom Packs (benutzerdefinierte Vokabel-Level)
  async createCustomPack(userId, name) {
    const packs = readJSON(CUSTOMPACKS_FILE, []);
    const newPack = {
      id: generateId(),
      userId,
      name: name || 'Neues Level',
      createdAt: Date.now()
    };
    packs.push(newPack);
    writeJSON(CUSTOMPACKS_FILE, packs);
    return newPack;
  },

  async getCustomPacks(userId) {
    const packs = readJSON(CUSTOMPACKS_FILE, []);
    return packs.filter(p => p.userId === userId).sort((a, b) => a.createdAt - b.createdAt);
  },

  async getCustomPackById(packId, userId) {
    const packs = readJSON(CUSTOMPACKS_FILE, []);
    const pack = packs.find(p => p.id === packId && p.userId === userId);
    return pack || null;
  },

  async updateCustomPack(packId, userId, name) {
    const packs = readJSON(CUSTOMPACKS_FILE, []);
    const idx = packs.findIndex(p => p.id === packId && p.userId === userId);
    if (idx === -1) return null;
    packs[idx].name = name;
    packs[idx].updatedAt = Date.now();
    writeJSON(CUSTOMPACKS_FILE, packs);
    return packs[idx];
  },

  async deleteCustomPack(packId, userId) {
    const packs = readJSON(CUSTOMPACKS_FILE, []);
    const filtered = packs.filter(p => !(p.id === packId && p.userId === userId));
    if (filtered.length === packs.length) return false;
    writeJSON(CUSTOMPACKS_FILE, filtered);
    const vocabs = readJSON(CUSTOMVOCAB_FILE, []);
    writeJSON(CUSTOMVOCAB_FILE, vocabs.filter(v => v.packId !== packId));
    return true;
  },

  // Custom Vocabularies
  async createCustomVocabulary(packId, userId, german, english) {
    const vocabs = readJSON(CUSTOMVOCAB_FILE, []);
    const vocabId = `custom-${packId}-${generateId()}`;
    const newVocab = {
      id: generateId(),
      vocabId,
      packId,
      userId,
      german,
      english,
      level: 100, // Placeholder, wird bei Abfrage über packId ermittelt
      cefr: 'custom',
      createdAt: Date.now()
    };
    vocabs.push(newVocab);
    writeJSON(CUSTOMVOCAB_FILE, vocabs);
    return newVocab;
  },

  async getCustomVocabulariesByPack(packId, userId) {
    const vocabs = readJSON(CUSTOMVOCAB_FILE, []);
    return vocabs.filter(v => v.packId === packId && v.userId === userId);
  },

  async getCustomVocabularyById(vocabId) {
    const vocabs = readJSON(CUSTOMVOCAB_FILE, []);
    return vocabs.find(v => v.vocabId === vocabId) || null;
  },

  async deleteCustomVocabulary(vocabId, userId) {
    const vocabs = readJSON(CUSTOMVOCAB_FILE, []);
    const filtered = vocabs.filter(v => !(v.vocabId === vocabId && v.userId === userId));
    if (filtered.length === vocabs.length) return false;
    writeJSON(CUSTOMVOCAB_FILE, filtered);
    return true;
  }
};

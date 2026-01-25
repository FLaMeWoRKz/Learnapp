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

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Helper functions to read/write JSON files
function readJSON(filePath, defaultValue = []) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }
  return defaultValue;
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
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
    
    if (filters.level) {
      vocabularies = vocabularies.filter(v => v.level === filters.level);
    }
    if (filters.cefr) {
      vocabularies = vocabularies.filter(v => v.cefr === filters.cefr);
    }
    
    return vocabularies;
  },

  async getVocabularyById(vocabId) {
    const vocabularies = readJSON(VOCAB_FILE, []);
    return vocabularies.find(v => v.vocabId === vocabId) || null;
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
  }
};

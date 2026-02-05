// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/core";

const _schema = i.schema({
  entities: {
    // Benutzer-Accounts
    users: i.entity({
      email: i.string().unique().indexed(),
      username: i.string().unique().indexed(),
      passwordHash: i.string(),
      createdAt: i.number(),
      updatedAt: i.number(),
      stats: i.json(), // { totalWordsLearned, totalJokerPoints, gamesPlayed, gamesWon }
    }),

    // Vokabeln
    vocabularies: i.entity({
      vocabId: i.string().indexed(),
      level: i.number().indexed(),
      german: i.string(),
      english: i.string(),
      cefr: i.string().indexed(),
      createdAt: i.number(),
    }),

    // Benutzer-Fortschritt pro Vokabel
    userProgress: i.entity({
      userId: i.string().indexed(),
      vocabId: i.string().indexed(),
      level: i.number(),
      learned: i.boolean(),
      correctCount: i.number(),
      wrongCount: i.number(),
      lastReviewed: i.number().optional(),
      currentBox: i.number(),
      packCompleted: i.boolean(),
      createdAt: i.number(),
      updatedAt: i.number(),
    }),

    // Karteikarten-Fortschritt
    flashcardProgress: i.entity({
      userId: i.string().indexed(),
      boxes: i.json(), // JSON-Objekt mit Box-Daten
      jokerPoints: i.number(),
      updatedAt: i.number(),
    }),

    // Multiplayer-Spielräume
    gameRooms: i.entity({
      code: i.string().unique().indexed(),
      hostId: i.string().indexed(),
      players: i.json(), // Array von Spielern
      settings: i.json(), // Spiel-Einstellungen
      currentRound: i.number(),
      currentQuestion: i.json().optional(), // Aktuelle Frage
      status: i.string(), // 'waiting', 'playing', 'finished'
      createdAt: i.number(),
      updatedAt: i.number(),
    }),

    // Einzelspieler-Sessions
    gameSessions: i.entity({
      userId: i.string().indexed(),
      mode: i.string(), // Spiel-Modus
      level: i.number(),
      packId: i.number(),
      questions: i.json(), // Array von Fragen
      score: i.number(),
      completed: i.boolean(),
      createdAt: i.number(),
    }),
  },
  links: {},
  rooms: {}
});

// This helps TypeScript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema }
export default schema;

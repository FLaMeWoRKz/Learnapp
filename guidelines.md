# Project Guidelines

> Eine **Context-First** Anleitung für Entwickler und KI-Agenten.  
> Ähnlich zu [AGENTS.md](https://agents.md/#examples) – dedizierter Ort für Projekt-Kontext, Konventionen und AI-Guidance.

---

## 1. Project Overview

- **Name:** VocabMaster
- **Description:** Ein moderner Multiplayer-Vokabeltrainer für FOS/BOS Schüler (B2/C1 Niveau). Bietet Singleplayer-Modi (Level, Karteikasten, Freies Üben) und Echtzeit-Multiplayer über Socket.io.
- **Core Purpose:** Vokabellernen im Klassenzimmer ermöglichen – alleine oder gemeinsam (ähnlich Kahoot). Gamification durch Punkte, Joker-System und Progression.

---

## 2. Tech Stack

| Bereich | Technologien |
|---------|--------------|
| **Frontend** | React 18, TypeScript, Vite 5, React Router 6, Tailwind CSS 3, Axios, Socket.io Client |
| **Backend** | Node.js 20+, Express 4, Socket.io 4, ESM Modules |
| **Datenbank** | InstantDB (serverless, Production) oder lokale JSON-Dateien (`backend/data/`, STORAGE_MODE=local) |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **Tools** | ESLint, TypeScript (strict: false), PostCSS, Autoprefixer |
| **Infrastructure** | Docker, Docker Compose, Vercel (Frontend), Railway (Backend), GitHub Actions CI/CD |

---

## 3. Key Commands

### Entwicklung

| Befehl | Beschreibung |
|--------|--------------|
| `cd backend && npm run dev` | Backend starten (Port 3000, Watch-Mode via tsx) |
| `cd frontend && npm run dev` | Frontend starten (Vite, Port 5173) |
| `.\start-local.ps1` | Beide (Backend + Frontend) lokal starten – nutzt `STORAGE_MODE=local` |

### Build

| Befehl | Beschreibung |
|--------|--------------|
| `cd frontend && npm run build` | Frontend bauen (tsc + vite build) |
| `cd frontend && npm run build:skip-check` | Build ohne TypeScript-Check |
| `docker-compose up -d` | Backend + Frontend per Docker starten |

### Testing

| Befehl | Beschreibung |
|--------|--------------|
| `cd backend && npm test` | API-Tests (Health, Register, Login, Vocab, Progress) – erwartet laufendes Backend |
| `cd backend && npm run test:local` | Wie oben, für lokale Entwicklung |

### Linting / Formatting

| Befehl | Beschreibung |
|--------|--------------|
| `cd frontend && npm run lint` | ESLint für TypeScript/React |
| `cd backend && npm run lint` | Backend-Linter (optional, CI: continue-on-error) |

### Schema / Datenbank

| Befehl | Beschreibung |
|--------|--------------|
| `npm run schema:push` | InstantDB-Schema pushen (Root `package.json`) |
| `npm run schema:pull` | InstantDB-Schema pullen |
| `cd backend && npm run import-vocab` | Vokabeln aus `vokabeln.csv` importieren |

### Setup

| Befehl | Beschreibung |
|--------|--------------|
| `cd backend && npm run setup` | Environment-Setup (Script: `scripts/setup-env.js`) |
| `cd backend && cp .env.example .env` | `.env` anlegen und befüllen |

---

## 4. Project Structure

```
Projekt2/
├── backend/                 # Express API + Socket.io
│   ├── src/
│   │   ├── server.js        # Einstiegspunkt, CORS, Routes, Socket-Setup
│   │   ├── socket.js        # Socket.io Event-Handler
│   │   ├── config/          # instantdb.js (DB-Abstraktion), localStorage.js
│   │   ├── controllers/     # auth, game, multiplayer, progress, vocab
│   │   ├── routes/          # Express-Router
│   │   ├── middleware/      # auth.js (JWT)
│   │   └── utils/           # csvParser, gameHelpers, jwt, password, etc.
│   ├── scripts/             # import-vocab, setup-env, test-local
│   └── vokabeln.csv         # Vokabeldaten
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Router, AuthProvider, PrivateRoute
│   │   ├── components/
│   │   │   ├── shared/      # Button, Card, ProgressBar, Timer
│   │   │   ├── singleplayer/# LevelMode, FlashcardBox, FreePractice
│   │   │   └── multiplayer/ # Lobby, GameRoom
│   │   ├── contexts/        # AuthContext
│   │   ├── pages/           # Home, Login, Register, Profile, SinglePlayer, Multiplayer
│   │   ├── services/        # api.ts (Axios + API-Module), socket.ts
│   │   └── types/           # index.ts (Interfaces)
│   └── index.css            # Tailwind + Custom Styles
├── instant.schema.ts        # InstantDB Schema-Definition
├── docker-compose.yml
├── .github/workflows/ci.yml # CI: Backend-Check, Frontend Lint+Build, Vercel Deploy
└── *.ps1                    # PowerShell-Skripte (start-local, commit, push)
```

### Naming Conventions

- **Dateien:** `camelCase` für Utils/Services, `PascalCase` für React-Komponenten
- **Komponenten:** PascalCase (`LevelMode`, `GameRoom`, `AuthContext`)
- **Hooks:** `use`-Prefix (`useAuth`, `useState`, `useEffect`)
- **API-Module:** `authAPI`, `vocabAPI`, `progressAPI`, `gameAPI`, `multiplayerAPI`
- **Backend:** camelCase für Funktionen, PascalCase für nichts

---

## 5. Development Workflow

### Neue Features hinzufügen

1. **Frontend-Komponente:** In `components/` (ggf. `shared/`, `singleplayer/`, `multiplayer/`) ablegen.
2. **Seite:** In `pages/` als neues Modul, Route in `App.tsx` ergänzen.
3. **API:** Neue Methoden in `services/api.ts` unter dem passenden Modul.
4. **Backend:** Neuer Controller in `controllers/`, Route in `routes/`, Registrierung in `server.js`.

### Component-Struktur

- **Functional Components** mit Hooks
- **Default Export** für Seiten/Komponenten
- Props über Interface definieren; Children optional
- Shared Components: `Button`, `Card`, `ProgressBar`, `Timer` nutzen

### State Management

- **Auth:** `AuthContext` (Provider + `useAuth`), Token in `localStorage`
- **Server State:** Axios-Calls über `api.ts`, lokaler State mit `useState`/`useEffect`
- **Echtzeit:** Socket.io in `services/socket.ts`, Events gemäß README

### Styling

- **Tailwind CSS** – Utility-First
- Custom Colors: `primary-50` bis `primary-900` in `tailwind.config.js`
- Dark Mode: `dark:bg-gray-800`, `dark:text-white` nutzen
- Globals: `index.css` (Tailwind-Direktiven, Keyframes, Root-Styles)

---

## 6. Rules for AI Generation

### Allgemein

- **Sprache:** Deutsche UI-Texte, Code-Kommentare und Fehlermeldungen auf Deutsch oder Englisch konsistent halten.
- **Imports:** ESM (`import`/`export`), `.js`-Extension bei Backend-Imports (wegen ESM-Resolution).

### TypeScript (Frontend)

- **Interfaces** statt `type` für Objektformen.
- **`type`** für Unions/Literals (`'primary' | 'secondary'`).
- Kein `any`; bei externen Daten `unknown` oder spezifische Interfaces verwenden.
- Strict Mode ist aktuell deaktiviert; trotzdem typisiert schreiben.

### React

- **Functional Components** und Hooks – keine Klassenkomponenten.
- **Arrow Functions** oder benannte Funktionen; einheitlich pro Datei.
- **Default Export** für Seiten und wiederverwendbare Komponenten.
- **Named Exports** für Context (Provider + Hook).

### Backend (JavaScript)

- **async/await** statt Callback-Pyramiden.
- **try/catch** mit `next(error)` in Controllern.
- **dbHelpers** aus `config/instantdb.js` nutzen – keine direkten InstantDB-Calls in Controllern.
- Validierung zuerst (Body-Checks), dann DB-Logik.

### API & Socket

- REST-Pfade: `/api/auth`, `/api/vocab`, `/api/progress`, `/api/game`, `/api/multiplayer`.
- JWT im Header: `Authorization: Bearer <token>`.
- Fehler: strukturierte JSON-Response mit `{ error: string }`.

### Styling

- Tailwind-Klassen, keine Inline-Styles außer bei dynamischen Werten.
- Shared Components (`Button`, `Card`) nutzen statt ad-hoc Styles.

### Testing & Qualität

- Vor Commit: `npm run lint` (Frontend) und `npm test` (Backend) ausführen.
- Neue Features: entsprechende API-Tests in `scripts/test-local.js` ergänzen.

---

## 7. Environment & Deployment

### Backend `.env`

- `PORT`, `FRONTEND_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`
- `STORAGE_MODE`: `local` (Tests) oder `instantdb` (Production)
- `INSTANTDB_APP_ID`, `INSTANTDB_ADMIN_TOKEN` bei `STORAGE_MODE=instantdb`

### Frontend

- `VITE_API_URL`: Backend-URL (z.B. `https://api.example.com/api`) – für Production setzen.

### CI/CD (GitHub Actions)

- Läuft auf `push`/`PR` zu `main` und `develop`
- Jobs: `backend-test`, `frontend-test`, `deploy-vercel`
- Vercel-Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

---

*Zuletzt aktualisiert basierend auf Codebase-Analyse. Bei Konflikten mit README oder anderen Docs gilt: explizite User-Anweisungen haben Vorrang.*

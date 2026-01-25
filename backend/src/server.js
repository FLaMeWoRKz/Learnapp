import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupSocket } from './socket.js';
import authRoutes from './routes/auth.js';
import vocabRoutes from './routes/vocab.js';
import { getLevelCounts } from './controllers/vocabController.js';
import gameRoutes from './routes/game.js';
import progressRoutes from './routes/progress.js';
import multiplayerRoutes from './routes/multiplayer.js';
import { dbHelpers } from './config/instantdb.js';
import { importVocabulariesFromFile, parseCSV } from './utils/csvParser.js';
import { loadVocabFromGitHub } from './utils/loadVocabFromGitHub.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Automatischer Import beim Serverstart, wenn keine Vokabeln vorhanden sind
async function checkAndImportVocabularies() {
  try {
    const existingVocabs = await dbHelpers.getVocabularies({});
    
    if (existingVocabs.length === 0) {
      console.log('📚 Keine Vokabeln gefunden. Starte automatischen Import...');
      
      // Erweiterte Pfadsuche für verschiedene Deployment-Umgebungen
      // WICHTIG: Railway setzt Root Directory auf 'backend', daher ist process.cwd() bereits /app
      const possiblePaths = [
        path.join(__dirname, '../vokabeln.csv'), // Backend root (lokal: backend/vokabeln.csv)
        path.join(process.cwd(), 'vokabeln.csv'), // Railway: /app/vokabeln.csv (wenn Root Directory = backend)
        path.join(process.cwd(), 'backend/vokabeln.csv'), // Fallback: /app/backend/vokabeln.csv
        path.join(__dirname, '../../vokabeln.csv'), // Alternative Backend root
        '/app/vokabeln.csv', // Docker/Railway absolute path (wenn Root Directory = backend)
        '/app/backend/vokabeln.csv', // Docker/Railway backend path
        path.join(__dirname, '../../backend/vokabeln.csv'), // Alternative: von src aus
      ];
      
      // Debug: Zeige aktuelles Working Directory und __dirname
      console.log(`🔍 Debug: process.cwd() = ${process.cwd()}`);
      console.log(`🔍 Debug: __dirname = ${__dirname}`);
      
      let csvPath = null;
      for (const p of possiblePaths) {
        try {
          if (fs.existsSync(p)) {
            csvPath = p;
            console.log(`📂 CSV-Datei gefunden: ${csvPath}`);
            break;
          }
        } catch (e) {
          // Ignoriere Fehler beim Prüfen
        }
      }
      
      if (csvPath) {
        try {
          const result = await importVocabulariesFromFile(csvPath);
          console.log(`✅ Import abgeschlossen: ${result.imported} Vokabeln importiert, ${result.updated} aktualisiert (${result.errors} Fehler)`);
        } catch (importError) {
          console.error('❌ Fehler beim Importieren:', importError);
          // Versuche es erneut nach kurzer Wartezeit
          console.log('⏳ Warte 2 Sekunden und versuche erneut...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            const result = await importVocabulariesFromFile(csvPath);
            console.log(`✅ Wiederholter Import erfolgreich: ${result.imported} Vokabeln importiert`);
          } catch (retryError) {
            console.error('❌ Wiederholter Import fehlgeschlagen:', retryError);
          }
        }
      } else {
        console.error('❌ CSV-Datei nicht gefunden in folgenden Pfaden:');
        possiblePaths.forEach(p => {
          try {
            const exists = fs.existsSync(p);
            console.error(`   - ${p} ${exists ? '✅ EXISTIERT' : '❌ nicht gefunden'}`);
          } catch (e) {
            console.error(`   - ${p} ❌ Fehler beim Prüfen`);
          }
        });
        console.error('⚠️ Lokale CSV-Datei nicht gefunden. Versuche Fallback: GitHub...');
        
        // Fallback: Lade von GitHub
        try {
          const csvContent = await loadVocabFromGitHub();
          const vocabularies = await parseCSV(csvContent);
          
          let imported = 0;
          let updated = 0;
          let errors = 0;
          
          for (const vocab of vocabularies) {
            try {
              const existing = await dbHelpers.getVocabularyById(vocab.vocabId);
              if (existing) {
                await dbHelpers.updateVocabulary(vocab.vocabId, vocab);
                updated++;
              } else {
                await dbHelpers.createVocabulary(vocab);
                imported++;
              }
            } catch (error) {
              console.error(`Error importing vocab ${vocab.vocabId}:`, error);
              errors++;
            }
          }
          
          console.log(`✅ GitHub-Import abgeschlossen: ${imported} importiert, ${updated} aktualisiert, ${errors} Fehler`);
        } catch (githubError) {
          console.error('❌ GitHub-Fallback fehlgeschlagen:', githubError);
          console.error('⚠️ Bitte stelle sicher, dass vokabeln.csv im Backend-Verzeichnis liegt und im Git-Repository ist!');
          console.error('💡 Tipp: Prüfe Railway Settings → Root Directory sollte "backend" sein');
          console.error('💡 Tipp: Prüfe ob die CSV-Datei im Git-Repository ist: git ls-files | grep vokabeln.csv');
        }
      }
    } else {
      console.log(`✅ ${existingVocabs.length} Vokabeln bereits in der Datenbank`);
    }
  } catch (error) {
    console.error('❌ Fehler beim automatischen Import:', error);
    console.error('Stack:', error.stack);
  }
}

const app = express();
const httpServer = createServer(app);

// CORS-Konfiguration - Erlaube mehrere Origins
const allowedOrigins = [
  "http://localhost:5173",                          // Lokale Entwicklung
  "https://learnapp-pearl.vercel.app",              // Vercel Frontend
  "https://learnapp-production-a492.up.railway.app" // Railway Backend (für Health Checks)
];

// Füge FRONTEND_URL aus .env hinzu, falls vorhanden
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: (origin, callback) => {
    // Erlaube Requests ohne Origin (z.B. mobile apps, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`⚠️  CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 600 // Cache preflight requests for 10 minutes
};

const io = new Server(httpServer, {
  cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug: Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes – level-counts explizit vor dem Vocab-Router (sonst fängt /:id "level-counts" ab)
app.get('/api/vocab/level-counts', getLevelCounts);
app.use('/api/auth', authRoutes);
app.use('/api/vocab', vocabRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/multiplayer', multiplayerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io Setup
setupSocket(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 3000;

// Start server after checking vocabularies
checkAndImportVocabularies().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io ready for connections`);
  });
});

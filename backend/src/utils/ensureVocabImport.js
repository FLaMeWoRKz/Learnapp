import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbHelpers } from '../config/instantdb.js';
import { parseCSV } from './csvParser.js';
import { loadVocabFromGitHub } from './loadVocabFromGitHub.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Stellt sicher, dass Vokabeln vorhanden sind. Wenn keine existieren,
 * wird versucht, aus vokabeln.csv zu importieren.
 */
export async function ensureVocabulariesImported() {
  const all = await dbHelpers.getVocabularies({});
  if (all.length > 0) return;

  // Erweiterte Pfadsuche für verschiedene Deployment-Umgebungen
  // WICHTIG: Railway setzt Root Directory auf 'backend', daher ist process.cwd() bereits /app
  const possiblePaths = [
    path.join(__dirname, '../../vokabeln.csv'), // Backend root (lokal: backend/vokabeln.csv)
    path.join(process.cwd(), 'vokabeln.csv'), // Railway: /app/vokabeln.csv (wenn Root Directory = backend)
    path.join(process.cwd(), 'backend/vokabeln.csv'), // Fallback: /app/backend/vokabeln.csv
    path.join(__dirname, '../../../vokabeln.csv'), // Alternative Backend root
    '/app/vokabeln.csv', // Docker/Railway absolute path (wenn Root Directory = backend)
    '/app/backend/vokabeln.csv', // Docker/Railway backend path
    path.join(__dirname, '../../../backend/vokabeln.csv'), // Alternative: von src/utils aus
  ];
  let csvPath = null;
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        csvPath = p;
        break;
      }
    } catch (e) {
      // Ignoriere Fehler beim Prüfen
    }
  }
  if (!csvPath) {
    console.warn('⚠️ vokabeln.csv nicht gefunden in folgenden Pfaden:');
    possiblePaths.forEach(p => console.warn(`   - ${p}`));
    console.warn('⚠️ Lokale CSV-Datei nicht gefunden. Versuche Fallback: GitHub...');
    
    // Fallback: Lade von GitHub
    try {
      const csvContent = await loadVocabFromGitHub();
      const parsed = await parseCSV(csvContent);
      let imported = 0;
      for (const v of parsed) {
        try {
          const ex = await dbHelpers.getVocabularyById(v.vocabId);
          if (!ex) {
            await dbHelpers.createVocabulary(v);
            imported++;
          }
        } catch (e) {
          console.error('Import vocab:', e);
        }
      }
      console.log(`✅ GitHub-Auto-Import abgeschlossen: ${imported} Vokabeln.`);
      return;
    } catch (githubError) {
      console.error('❌ GitHub-Fallback fehlgeschlagen:', githubError);
      console.warn('⚠️ Kein Auto-Import möglich. Bitte manuell importieren.');
      return;
    }
  }

  try {
    console.log('⚠️ Keine Vokabeln. Automatischer Import aus vokabeln.csv...');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const parsed = await parseCSV(csvContent);
    let imported = 0;
    for (const v of parsed) {
      try {
        const ex = await dbHelpers.getVocabularyById(v.vocabId);
        if (!ex) {
          await dbHelpers.createVocabulary(v);
          imported++;
        }
      } catch (e) {
        console.error('Import vocab:', e);
      }
    }
    console.log(`✅ Auto-Import abgeschlossen: ${imported} Vokabeln.`);
  } catch (err) {
    console.error('❌ Auto-Import fehlgeschlagen:', err);
  }
}

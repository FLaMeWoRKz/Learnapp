import { dbHelpers } from '../config/instantdb.js';
import { parseCSV } from '../utils/csvParser.js';
import { ensureVocabulariesImported } from '../utils/ensureVocabImport.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getVocabularies(req, res, next) {
  try {
    const { level, levels, cefr } = req.query;
    const filters = {};
    if (levels) {
      const arr = (typeof levels === 'string' ? levels.split(',') : levels).map(x => parseInt(x, 10));
      if (arr.length) filters.levels = arr;
    } else if (level) {
      filters.level = parseInt(level, 10);
    }
    if (cefr) filters.cefr = cefr;

    let vocabularies = await dbHelpers.getVocabularies(filters);
    
    // Wenn keine Vokabeln vorhanden sind, versuche automatisch zu importieren
    if (vocabularies.length === 0 && !filters.level && !filters.cefr && !filters.levels?.length) {
      console.log('⚠️ Keine Vokabeln gefunden. Versuche automatischen Import...');
      try {
        // WICHTIG: Railway setzt Root Directory auf 'backend', daher ist process.cwd() bereits /app
        const possiblePaths = [
          path.join(__dirname, '../../vokabeln.csv'), // Backend root (lokal: backend/vokabeln.csv)
          path.join(process.cwd(), 'vokabeln.csv'), // Railway: /app/vokabeln.csv (wenn Root Directory = backend)
          path.join(process.cwd(), 'backend/vokabeln.csv'), // Fallback: /app/backend/vokabeln.csv
          '/app/vokabeln.csv', // Docker/Railway absolute path (wenn Root Directory = backend)
          '/app/backend/vokabeln.csv', // Docker/Railway backend path
          path.join(__dirname, '../../../vokabeln.csv'), // Alternative: von src/controllers aus
        ];
        
        let csvPath = null;
        for (const p of possiblePaths) {
          if (fs.existsSync(p)) {
            csvPath = p;
            break;
          }
        }
        
        if (csvPath) {
          const csvContent = fs.readFileSync(csvPath, 'utf-8');
          const parsedVocabs = await parseCSV(csvContent);
          
          let imported = 0;
          for (const vocab of parsedVocabs) {
            try {
              const existing = await dbHelpers.getVocabularyById(vocab.vocabId);
              if (!existing) {
                await dbHelpers.createVocabulary(vocab);
                imported++;
              }
            } catch (error) {
              console.error(`Error importing vocab ${vocab.vocabId}:`, error);
            }
          }
          
          console.log(`✅ Automatischer Import abgeschlossen: ${imported} Vokabeln importiert`);
          
          // Lade Vokabeln erneut
          vocabularies = await dbHelpers.getVocabularies(filters);
        }
      } catch (importError) {
        console.error('❌ Fehler beim automatischen Import:', importError);
      }
    }
    
    res.json({
      count: vocabularies.length,
      vocabularies
    });
  } catch (error) {
    next(error);
  }
}

export async function getVocabularyById(req, res, next) {
  try {
    const { id } = req.params;
    const vocabulary = await dbHelpers.getVocabularyById(id);

    if (!vocabulary) {
      return res.status(404).json({ error: 'Vocabulary not found' });
    }

    res.json(vocabulary);
  } catch (error) {
    next(error);
  }
}

export async function getLevelCounts(req, res, next) {
  try {
    await ensureVocabulariesImported();
    const all = await dbHelpers.getVocabularies({});
    const byLevel = {};
    for (const v of all) {
      const l = v.level;
      byLevel[l] = (byLevel[l] || 0) + 1;
    }
    let levels = Object.keys(byLevel)
      .filter(k => parseInt(k, 10) < 100) // Nur System-Level (1-15)
      .map((k) => ({ level: parseInt(k, 10), count: byLevel[k] }))
      .sort((a, b) => a.level - b.level);

    // Custom Packs für eingeloggte User hinzufügen
    if (req.user && req.user.userId) {
      const customPacks = await dbHelpers.getCustomPacks(req.user.userId);
      for (const pack of customPacks) {
        const vocabs = await dbHelpers.getCustomVocabulariesByPack(pack.id, req.user.userId);
        if (vocabs.length > 0) {
          levels.push({ level: pack.id, count: vocabs.length, custom: true, name: pack.name });
        }
      }
    }
    res.json({ levels });
  } catch (error) {
    next(error);
  }
}

export async function importVocabularies(req, res, next) {
  try {
    // WICHTIG: Railway setzt Root Directory auf 'backend', daher ist process.cwd() bereits /app
    const possiblePaths = [
      path.join(__dirname, '../../vokabeln.csv'), // Backend root (lokal: backend/vokabeln.csv)
      path.join(process.cwd(), 'vokabeln.csv'), // Railway: /app/vokabeln.csv (wenn Root Directory = backend)
      path.join(process.cwd(), 'backend/vokabeln.csv'), // Fallback: /app/backend/vokabeln.csv
      '/app/vokabeln.csv', // Docker/Railway absolute path (wenn Root Directory = backend)
      '/app/backend/vokabeln.csv', // Docker/Railway backend path
      path.join(__dirname, '../../../vokabeln.csv'), // Alternative: von src/controllers aus
    ];
    
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
    
    if (!csvPath) {
      console.error('❌ CSV-Datei nicht gefunden in folgenden Pfaden:');
      possiblePaths.forEach(p => console.error(`   - ${p}`));
      return res.status(404).json({ 
        error: 'CSV file not found',
        triedPaths: possiblePaths,
        hint: 'Bitte stelle sicher, dass vokabeln.csv im Backend-Verzeichnis liegt und im Git-Repository ist!'
      });
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const vocabularies = await parseCSV(csvContent);

    // Import to database (update existing, create new)
    let imported = 0;
    let updated = 0;
    let errors = 0;
    for (const vocab of vocabularies) {
      try {
        const existing = await dbHelpers.getVocabularyById(vocab.vocabId);
        if (existing) {
          // Update existing vocabulary (especially level)
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

    console.log(`✅ Import abgeschlossen: ${imported} importiert, ${updated} aktualisiert, ${errors} Fehler`);

    res.json({
      message: 'Import completed',
      imported,
      updated,
      errors,
      total: vocabularies.length
    });
  } catch (error) {
    console.error('❌ Fehler beim Import:', error);
    next(error);
  }
}

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
        const possiblePaths = [
          path.join(__dirname, '../../vokabeln.csv'),
          path.join(process.cwd(), 'vokabeln.csv'),
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
    const levels = Object.keys(byLevel)
      .map((k) => ({ level: parseInt(k, 10), count: byLevel[k] }))
      .sort((a, b) => a.level - b.level);
    res.json({ levels });
  } catch (error) {
    next(error);
  }
}

export async function importVocabularies(req, res, next) {
  try {
    // In production, check if user is admin
    // Try multiple possible paths
    const possiblePaths = [
      path.join(__dirname, '../../vokabeln.csv'), // Backend root
      path.join(__dirname, '../../../../lernprogramm dadi/vokabeln.csv'), // Original location
      path.join(process.cwd(), 'vokabeln.csv'), // Current working directory
    ];
    
    let csvPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        csvPath = p;
        break;
      }
    }
    
    if (!csvPath) {
      return res.status(404).json({ error: 'CSV file not found. Tried: ' + possiblePaths.join(', ') });
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const vocabularies = await parseCSV(csvContent);

    // Import to database (update existing, create new)
    let imported = 0;
    let updated = 0;
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
      }
    }

    res.json({
      message: 'Import completed',
      imported,
      updated,
      total: vocabularies.length
    });
  } catch (error) {
    next(error);
  }
}

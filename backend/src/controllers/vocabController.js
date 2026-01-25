import { dbHelpers } from '../config/instantdb.js';
import { parseCSV } from '../utils/csvParser.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getVocabularies(req, res, next) {
  try {
    const { level, cefr } = req.query;
    
    const filters = {};
    if (level) filters.level = parseInt(level);
    if (cefr) filters.cefr = cefr;

    const vocabularies = await dbHelpers.getVocabularies(filters);
    
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

export async function importVocabularies(req, res, next) {
  try {
    // In production, check if user is admin
    const csvPath = path.join(__dirname, '../../../../lernprogramm dadi/vokabeln.csv');
    
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ error: 'CSV file not found' });
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const vocabularies = await parseCSV(csvContent);

    // Import to database
    let imported = 0;
    for (const vocab of vocabularies) {
      try {
        await dbHelpers.createVocabulary(vocab);
        imported++;
      } catch (error) {
        console.error(`Error importing vocab ${vocab.vocabId}:`, error);
      }
    }

    res.json({
      message: 'Import completed',
      imported,
      total: vocabularies.length
    });
  } catch (error) {
    next(error);
  }
}

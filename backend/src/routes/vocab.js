import express from 'express';
import { getVocabularies, getVocabularyById, importVocabularies } from '../controllers/vocabController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getVocabularies);
router.get('/:id', getVocabularyById);
router.post('/import', importVocabularies); // Öffentlich für automatischen Import (in Production sollte das geschützt sein)

export default router;

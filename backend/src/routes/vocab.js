import express from 'express';
import { getVocabularies, getVocabularyById, importVocabularies } from '../controllers/vocabController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getVocabularies);
router.get('/:id', getVocabularyById);
router.post('/import', authenticateToken, importVocabularies); // Admin only in production

export default router;

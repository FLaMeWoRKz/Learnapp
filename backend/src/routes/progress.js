import express from 'express';
import {
  getUserProgress,
  updateProgress,
  getCompletedPacks,
  completeLevel,
  getFlashcardStatus,
  updateFlashcardProgress
} from '../controllers/progressController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getUserProgress);
router.post('/', authenticateToken, updateProgress);
router.get('/packs', authenticateToken, getCompletedPacks);
router.post('/complete-level', authenticateToken, completeLevel);
router.get('/flashcards', authenticateToken, getFlashcardStatus);
router.post('/flashcards', authenticateToken, updateFlashcardProgress);

export default router;

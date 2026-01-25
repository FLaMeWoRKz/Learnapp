import express from 'express';
import {
  getUserProgress,
  updateProgress,
  getCompletedPacks,
  getFlashcardStatus
} from '../controllers/progressController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getUserProgress);
router.post('/', authenticateToken, updateProgress);
router.get('/packs', authenticateToken, getCompletedPacks);
router.get('/flashcards', authenticateToken, getFlashcardStatus);

export default router;

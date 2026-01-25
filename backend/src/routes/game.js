import express from 'express';
import { startGame, submitAnswer, getGameStatus } from '../controllers/gameController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/start', authenticateToken, startGame);
router.post('/:id/answer', authenticateToken, submitAnswer);
router.get('/:id', authenticateToken, getGameStatus);

export default router;

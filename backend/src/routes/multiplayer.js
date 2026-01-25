import express from 'express';
import {
  createRoom,
  joinRoom,
  getRoomInfo,
  startGame,
  submitAnswer
} from '../controllers/multiplayerController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authenticateToken, createRoom);
router.post('/join', authenticateToken, joinRoom);
router.get('/room/:code', authenticateToken, getRoomInfo);
router.post('/room/:code/start', authenticateToken, startGame);
router.post('/room/:code/answer', authenticateToken, submitAnswer);

export default router;

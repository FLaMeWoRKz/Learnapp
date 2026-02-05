import express from 'express';
import {
  register,
  login,
  guestLogin,
  getMe,
  updateProfile,
  changePassword,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  changeEmail,
  confirmEmailChange,
  changeUsername
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/guest', guestLogin);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.put('/password', authenticateToken, changePassword);

router.get('/verify-email', verifyEmail);
router.post('/verify-email', verifyEmail);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/change-email', authenticateToken, changeEmail);
router.post('/confirm-email-change', confirmEmailChange);
router.post('/change-username', authenticateToken, changeUsername);

export default router;

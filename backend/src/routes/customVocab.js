import express from 'express';
import {
  getCustomPacks,
  createCustomPack,
  updateCustomPack,
  deleteCustomPack,
  getCustomVocabularies,
  createCustomVocabulary,
  deleteCustomVocabulary
} from '../controllers/customVocabController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/packs', getCustomPacks);
router.post('/packs', createCustomPack);
router.put('/packs/:packId', updateCustomPack);
router.delete('/packs/:packId', deleteCustomPack);
router.get('/packs/:packId/vocabularies', getCustomVocabularies);
router.post('/packs/:packId/vocabularies', createCustomVocabulary);
router.delete('/vocabularies/:vocabId', deleteCustomVocabulary);

export default router;

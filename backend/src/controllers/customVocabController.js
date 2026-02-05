import { dbHelpers } from '../config/instantdb.js';

export async function getCustomPacks(req, res, next) {
  try {
    const userId = req.user.userId;
    const packs = await dbHelpers.getCustomPacks(userId);
    res.json({ packs });
  } catch (error) {
    next(error);
  }
}

export async function createCustomPack(req, res, next) {
  try {
    const userId = req.user.userId;
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name ist erforderlich' });
    }
    const pack = await dbHelpers.createCustomPack(userId, name.trim());
    res.status(201).json(pack);
  } catch (error) {
    next(error);
  }
}

export async function updateCustomPack(req, res, next) {
  try {
    const userId = req.user.userId;
    const { packId } = req.params;
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name ist erforderlich' });
    }
    const pack = await dbHelpers.updateCustomPack(packId, userId, name.trim());
    if (!pack) return res.status(404).json({ error: 'Pack nicht gefunden' });
    res.json(pack);
  } catch (error) {
    next(error);
  }
}

export async function deleteCustomPack(req, res, next) {
  try {
    const userId = req.user.userId;
    const { packId } = req.params;
    const deleted = await dbHelpers.deleteCustomPack(packId, userId);
    if (!deleted) return res.status(404).json({ error: 'Pack nicht gefunden' });
    res.json({ message: 'Pack gelöscht' });
  } catch (error) {
    next(error);
  }
}

export async function getCustomVocabularies(req, res, next) {
  try {
    const userId = req.user.userId;
    const { packId } = req.params;
    const pack = await dbHelpers.getCustomPackById(packId, userId);
    if (!pack) return res.status(404).json({ error: 'Pack nicht gefunden' });
    const vocabularies = await dbHelpers.getCustomVocabulariesByPack(packId, userId);
    res.json({ vocabularies });
  } catch (error) {
    next(error);
  }
}

export async function createCustomVocabulary(req, res, next) {
  try {
    const userId = req.user.userId;
    const { packId } = req.params;
    const { german, english } = req.body;
    if (!german || !english || typeof german !== 'string' || typeof english !== 'string') {
      return res.status(400).json({ error: 'Deutsch und Englisch sind erforderlich' });
    }
    const pack = await dbHelpers.getCustomPackById(packId, userId);
    if (!pack) return res.status(404).json({ error: 'Pack nicht gefunden' });
    const vocab = await dbHelpers.createCustomVocabulary(packId, userId, german.trim(), english.trim());
    res.status(201).json(vocab);
  } catch (error) {
    next(error);
  }
}

export async function deleteCustomVocabulary(req, res, next) {
  try {
    const userId = req.user.userId;
    const { vocabId } = req.params;
    const deleted = await dbHelpers.deleteCustomVocabulary(vocabId, userId);
    if (!deleted) return res.status(404).json({ error: 'Vokabel nicht gefunden' });
    res.json({ message: 'Vokabel gelöscht' });
  } catch (error) {
    next(error);
  }
}

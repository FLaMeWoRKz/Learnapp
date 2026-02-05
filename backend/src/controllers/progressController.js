import { dbHelpers } from '../config/instantdb.js';
import { ensureVocabulariesImported } from '../utils/ensureVocabImport.js';

export async function getUserProgress(req, res, next) {
  try {
    const userId = req.user.userId;
    const progress = await dbHelpers.getAllUserProgress(userId);

    res.json({
      count: progress.length,
      progress
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProgress(req, res, next) {
  try {
    const userId = req.user.userId;
    const { vocabId, isCorrect, level } = req.body;

    if (!vocabId || isCorrect === undefined) {
      return res.status(400).json({ error: 'vocabId and isCorrect are required' });
    }

    let progress = await dbHelpers.getUserProgress(userId, vocabId);
    
    if (!progress) {
      progress = {
        userId,
        vocabId,
        level: level || 1,
        learned: false,
        correctCount: 0,
        wrongCount: 0,
        currentBox: 1,
        packCompleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    }

    if (isCorrect) {
      progress.correctCount++;
      progress.currentBox = Math.min(5, progress.currentBox + 1);
    } else {
      progress.wrongCount++;
      progress.currentBox = Math.max(1, progress.currentBox - 1);
    }

    progress.learned = progress.currentBox === 5;
    progress.lastReviewed = Date.now();
    progress.updatedAt = Date.now();

    await dbHelpers.updateUserProgress(progress);

    res.json(progress);
  } catch (error) {
    next(error);
  }
}

export async function getCompletedPacks(req, res, next) {
  try {
    const userId = req.user.userId;
    const user = await dbHelpers.getUserById(userId);
    const completedPacks = (user?.completedLevels || []).slice().sort((a, b) => a - b);

    res.json({
      completedPacks,
      levelStats: {}
    });
  } catch (error) {
    next(error);
  }
}

export async function completeLevel(req, res, next) {
  try {
    const userId = req.user.userId;
    const { level } = req.body;
    if (level == null || level < 1) {
      return res.status(400).json({ error: 'level (>= 1) is required' });
    }
    const user = await dbHelpers.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const completed = user.completedLevels || [];
    if (completed.includes(level)) {
      return res.json({ completedPacks: completed.slice().sort((a, b) => a - b) });
    }
    const updated = [...completed, level].sort((a, b) => a - b);
    await dbHelpers.updateUser(userId, { completedLevels: updated });
    res.json({ completedPacks: updated });
  } catch (error) {
    next(error);
  }
}

export async function getFlashcardStatus(req, res, next) {
  try {
    await ensureVocabulariesImported();
    const userId = req.user.userId;

    let flashcardProgress = await dbHelpers.getFlashcardProgress(userId);

    if (!flashcardProgress) {
      flashcardProgress = {
        userId,
        boxes: JSON.stringify({ 1: [], 2: [], 3: [], 4: [], 5: [] }),
        jokerPoints: 0,
        updatedAt: Date.now()
      };
    }

    // Parse boxes if stored as string
    let boxes = typeof flashcardProgress.boxes === 'string'
      ? JSON.parse(flashcardProgress.boxes)
      : (flashcardProgress.boxes || {});

    // Standard-Vokabeln und Custom-Packs laden
    const allStandardVocabs = await dbHelpers.getVocabularies({});
    const customPacks = await dbHelpers.getCustomPacks(userId);
    const customVocabsByPack = {};
    for (const pack of customPacks) {
      customVocabsByPack[pack.id] = await dbHelpers.getVocabularies({ customPackId: pack.id, userId });
    }
    const allCustomVocabs = Object.values(customVocabsByPack).flat();

    const allVocabIds = new Set([
      ...allStandardVocabs.map(v => v.vocabId),
      ...allCustomVocabs.map(v => v.vocabId)
    ]);

    const allBoxesEmpty = Object.values(boxes).every(box => !box || box.length === 0);
    if (allBoxesEmpty) {
      if (allVocabIds.size > 0) {
        const vocabIds = Array.from(allVocabIds);
        const newBoxes = {
          1: vocabIds,
          2: [],
          3: [],
          4: [],
          5: []
        };
        boxes = newBoxes;
        flashcardProgress.boxes = JSON.stringify(newBoxes);
        flashcardProgress.updatedAt = Date.now();
        await dbHelpers.updateFlashcardProgress(flashcardProgress);
      }
    } else {
      const existingVocabIds = new Set();
      for (let b = 1; b <= 5; b++) {
        (boxes[b] || []).forEach(id => existingVocabIds.add(id));
      }
      const missingVocabIds = [...allVocabIds].filter(id => !existingVocabIds.has(id));
      if (missingVocabIds.length > 0) {
        if (!boxes[1]) boxes[1] = [];
        boxes[1] = [...boxes[1], ...missingVocabIds];
        flashcardProgress.boxes = JSON.stringify(boxes);
        flashcardProgress.updatedAt = Date.now();
        await dbHelpers.updateFlashcardProgress(flashcardProgress);
      }
    }

    const levelCountsMap = {};
    const idToLevel = {};
    for (const v of allStandardVocabs) {
      levelCountsMap[v.level] = levelCountsMap[v.level] || { count: 0, custom: false };
      levelCountsMap[v.level].count += 1;
      idToLevel[v.vocabId] = v.level;
    }
    for (const pack of customPacks) {
      const vocabs = customVocabsByPack[pack.id] || [];
      if (vocabs.length > 0) {
        levelCountsMap[pack.id] = { count: vocabs.length, custom: true, name: pack.name };
        vocabs.forEach(v => { idToLevel[v.vocabId] = pack.id; });
      }
    }

    const levelBoxCounts = {};
    for (const key of Object.keys(levelCountsMap)) {
      levelBoxCounts[key] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    }
    const vocabLevels = {};
    for (let b = 1; b <= 5; b++) {
      for (const id of (boxes[b] || [])) {
        const l = idToLevel[id];
        vocabLevels[id] = l;
        if (l != null && levelBoxCounts[l]) levelBoxCounts[l][b]++;
      }
    }

    const levelCounts = [];
    const stdLevels = Object.keys(levelCountsMap)
      .filter(k => !levelCountsMap[k].custom)
      .map(k => parseInt(k, 10))
      .filter(n => !Number.isNaN(n))
      .sort((a, b) => a - b);
    for (const l of stdLevels) {
      levelCounts.push({ level: l, count: levelCountsMap[l].count });
    }
    for (const pack of customPacks) {
      const entry = levelCountsMap[pack.id];
      if (entry && entry.custom) {
        levelCounts.push({ level: pack.id, count: entry.count, custom: true, name: entry.name || pack.name });
      }
    }

    res.json({
      userId: flashcardProgress.userId,
      boxes,
      jokerPoints: flashcardProgress.jokerPoints,
      updatedAt: flashcardProgress.updatedAt,
      levelCounts,
      levelBoxCounts,
      vocabLevels
    });
  } catch (error) {
    next(error);
  }
}

export async function updateFlashcardProgress(req, res, next) {
  try {
    const userId = req.user.userId;
    const { boxes, jokerPoints } = req.body;

    if (!boxes) {
      return res.status(400).json({ error: 'boxes are required' });
    }

    const flashcardProgress = {
      userId,
      boxes: JSON.stringify(boxes),
      jokerPoints: jokerPoints || 0,
      updatedAt: Date.now()
    };

    await dbHelpers.updateFlashcardProgress(flashcardProgress);

    res.json(flashcardProgress);
  } catch (error) {
    next(error);
  }
}

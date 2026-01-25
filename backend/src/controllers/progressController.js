import { dbHelpers } from '../config/instantdb.js';

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
    const progress = await dbHelpers.getAllUserProgress(userId);
    
    // Group by level and check completion (>80% correct)
    const levelStats = {};
    progress.forEach(p => {
      const level = p.level;
      if (!levelStats[level]) {
        levelStats[level] = { total: 0, correct: 0, completed: false };
      }
      levelStats[level].total++;
      if (p.learned || p.correctCount > 0) {
        levelStats[level].correct++;
      }
    });

    const completedPacks = [];
    Object.keys(levelStats).forEach(level => {
      const stats = levelStats[level];
      const percentage = (stats.correct / stats.total) * 100;
      if (percentage >= 80) {
        completedPacks.push(parseInt(level));
      }
    });

    res.json({
      completedPacks: completedPacks.sort((a, b) => a - b),
      levelStats
    });
  } catch (error) {
    next(error);
  }
}

export async function getFlashcardStatus(req, res, next) {
  try {
    const userId = req.user.userId;
    
    const flashcardProgress = await dbHelpers.getFlashcardProgress(userId);
    
    if (!flashcardProgress) {
      return res.json({
        boxes: {
          1: [],
          2: [],
          3: [],
          4: [],
          5: []
        },
        jokerPoints: 0
      });
    }

    res.json(flashcardProgress);
  } catch (error) {
    next(error);
  }
}

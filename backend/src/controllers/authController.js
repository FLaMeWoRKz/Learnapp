import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { dbHelpers } from '../config/instantdb.js';

export async function register(req, res, next) {
  try {
    const { email, username, password } = req.body;

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUserByEmail = await dbHelpers.getUserByEmail(email);
    if (existingUserByEmail) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const existingUserByUsername = await dbHelpers.getUserByUsername(username);
    if (existingUserByUsername) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const now = Date.now();
    const userData = {
      email,
      username,
      passwordHash,
      createdAt: now,
      updatedAt: now,
      stats: {
        totalWordsLearned: 0,
        totalJokerPoints: 0,
        gamesPlayed: 0,
        gamesWon: 0
      }
    };

    const userId = await dbHelpers.createUser(userData);

    // Generate token
    const token = generateToken({
      userId,
      email,
      username
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        email,
        username
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await dbHelpers.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        stats: user.stats
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await dbHelpers.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        stats: user.stats,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
}

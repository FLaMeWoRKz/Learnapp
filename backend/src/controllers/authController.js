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
      // WICHTIG: stats als JSON-String speichern (InstantDB erwartet String-Typ)
      stats: JSON.stringify({
        totalWordsLearned: 0,
        totalJokerPoints: 0,
        gamesPlayed: 0,
        gamesWon: 0
      })
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
        stats: typeof user.stats === 'string' ? JSON.parse(user.stats) : user.stats
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function guestLogin(req, res, next) {
  try {
    // Generiere zufälligen Benutzernamen
    const adjectives = ['Schnell', 'Klug', 'Mutig', 'Froh', 'Stark', 'Kreativ', 'Clever', 'Flink', 'Tapfer', 'Weise'];
    const nouns = ['Löwe', 'Adler', 'Falke', 'Wolf', 'Bär', 'Tiger', 'Fuchs', 'Hase', 'Hirsch', 'Falke'];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 1000);
    const username = `${randomAdjective}${randomNoun}${randomNumber}`;
    
    // Erstelle temporäre E-Mail für Gast
    const email = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}@guest.local`;
    
    // Erstelle Gast-Benutzer ohne Passwort
    const now = Date.now();
    const userData = {
      email,
      username,
      passwordHash: '', // Kein Passwort für Gäste
      isGuest: true,
      createdAt: now,
      updatedAt: now,
      // WICHTIG: stats als JSON-String speichern (InstantDB erwartet String-Typ)
      stats: JSON.stringify({
        totalWordsLearned: 0,
        totalJokerPoints: 0,
        gamesPlayed: 0,
        gamesWon: 0
      })
    };

    const userId = await dbHelpers.createUser(userData);

    // Generate token
    const token = generateToken({
      userId,
      email,
      username
    });

    res.json({
      message: 'Gastzugang erfolgreich',
      token,
      user: {
        id: userId,
        email,
        username,
        isGuest: true
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
        stats: typeof user.stats === 'string' ? JSON.parse(user.stats) : user.stats,
        createdAt: user.createdAt,
        isGuest: user.isGuest || false
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.userId;
    const user = await dbHelpers.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.isGuest) {
      return res.status(400).json({ error: 'Gäste können ihr Profil nicht ändern' });
    }

    const { username, email } = req.body;
    const updates = {};

    if (username !== undefined && username.trim()) {
      const existing = await dbHelpers.getUserByUsername(username.trim());
      if (existing && existing.id !== userId) {
        return res.status(409).json({ error: 'Benutzername bereits vergeben' });
      }
      updates.username = username.trim();
    }

    if (email !== undefined && email.trim()) {
      const existing = await dbHelpers.getUserByEmail(email.trim());
      if (existing && existing.id !== userId) {
        return res.status(409).json({ error: 'E-Mail bereits vergeben' });
      }
      updates.email = email.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Keine Änderungen angegeben' });
    }

    await dbHelpers.updateUser(userId, updates);

    res.json({
      message: 'Profil aktualisiert',
      user: {
        id: user.id,
        email: updates.email || user.email,
        username: updates.username || user.username
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const userId = req.user.userId;
    const user = await dbHelpers.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.isGuest || !user.passwordHash) {
      return res.status(400).json({ error: 'Passwort-Änderung nicht möglich' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Aktuelles und neues Passwort erforderlich' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Neues Passwort muss mindestens 6 Zeichen haben' });
    }

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Aktuelles Passwort falsch' });
    }

    const passwordHash = await hashPassword(newPassword);
    await dbHelpers.updateUser(userId, { passwordHash });

    res.json({ message: 'Passwort geändert' });
  } catch (error) {
    next(error);
  }
}

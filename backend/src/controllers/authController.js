import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { generateSecureToken, getTokenExpiry } from '../utils/tokens.js';
import { dbHelpers } from '../config/instantdb.js';
import * as emailService from '../services/emailService.js';

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || '';

/** Prüft, ob E-Mail-Versand konfiguriert ist: Resend (bevorzugt) oder SMTP. Keine sensiblen Werte. */
export function getSmtpStatus(req, res) {
  const resendKey = process.env.RESEND_API_KEY;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const resendConfigured = !!resendKey;
  const smtpConfigured = !!(host && user && pass);
  const emailConfigured = resendConfigured || smtpConfigured;
  res.json({
    emailConfigured,
    provider: resendConfigured ? 'resend' : (smtpConfigured ? 'smtp' : 'none'),
    resendConfigured,
    smtpConfigured,
    hasHost: !!host,
    hasUser: !!user,
    hasPass: !!pass
  });
}

function authError(res, statusCode = 500) {
  const message = 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut. Wenn das Problem bestehen bleibt, wende dich an einen Systemadministrator.';
  return res.status(statusCode).json({ error: message, contactEmail: SUPPORT_EMAIL });
}

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

    const emailNorm = email.trim().toLowerCase();
    const usernameTrim = username.trim();

    const existingUserByEmail = await dbHelpers.getUserByEmail(emailNorm);
    if (existingUserByEmail) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const existingUserByUsername = await dbHelpers.getUserByUsername(usernameTrim);
    if (existingUserByUsername) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const passwordHash = await hashPassword(password);
    const now = Date.now();
    const emailVerificationToken = generateSecureToken();
    const emailVerificationExpires = getTokenExpiry();
    const userData = {
      email: emailNorm,
      username: usernameTrim,
      passwordHash,
      emailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
      createdAt: now,
      updatedAt: now,
      stats: JSON.stringify({
        totalWordsLearned: 0,
        totalJokerPoints: 0,
        gamesPlayed: 0,
        gamesWon: 0
      })
    };

    const userId = await dbHelpers.createUser(userData);
    const userForEmail = { id: userId, email: emailNorm, username: usernameTrim };

    // E-Mail im Hintergrund senden (blockiert nicht die HTTP-Antwort)
    emailService.sendVerificationEmail(userForEmail, emailVerificationToken).catch((mailErr) => {
      console.error('Verification email failed:', mailErr.message);
    });

    const token = generateToken({
      userId,
      email: emailNorm,
      username: usernameTrim
    });

    res.status(201).json({
      message: 'Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse.',
      token,
      user: {
        id: userId,
        email: emailNorm,
        username: usernameTrim,
        emailVerified: false
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
        emailVerified: user.emailVerified === true,
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
        emailVerified: user.emailVerified === true,
        stats: typeof user.stats === 'string' ? JSON.parse(user.stats) : user.stats,
        createdAt: user.createdAt,
        isGuest: user.isGuest || false
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const token = req.body?.token || req.query?.token;
    if (!token) {
      return authError(res, 400);
    }
    const user = await dbHelpers.getUserByEmailVerificationToken(token);
    if (!user) {
      return authError(res, 400);
    }
    await dbHelpers.updateUser(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null
    });
    emailService.sendWelcomeEmail({ email: user.email, username: user.username }).catch((mailErr) => {
      console.error('Welcome email failed:', mailErr.message);
    });
    res.json({ message: 'E-Mail bestätigt. Du kannst dich jetzt einloggen.', emailVerified: true });
  } catch (error) {
    console.error('verifyEmail error:', error.message);
    return authError(res, 500);
  }
}

export async function requestPasswordReset(req, res, next) {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.trim()) {
      return authError(res, 400);
    }
    const user = await dbHelpers.getUserByEmail(email.trim().toLowerCase());
    if (user && !user.isGuest && user.passwordHash) {
      const passwordResetToken = generateSecureToken();
      const passwordResetExpires = getTokenExpiry();
      await dbHelpers.updateUser(user.id, { passwordResetToken, passwordResetExpires });
      console.log('[Passwort-Reset] Versende E-Mail an Nutzer (E-Mail-Maskierung: ***@' + (user.email || '').split('@')[1] + ')');
      // E-Mail im Hintergrund (blockiert nicht die HTTP-Antwort; verhindert Timeout bei langsamer SMTP)
      emailService.sendPasswordResetEmail(user, passwordResetToken).catch((mailErr) => {
        console.error('[Passwort-Reset] E-Mail-Versand fehlgeschlagen:', mailErr.message, mailErr.code || '', mailErr.response ? '(SMTP-Response vorhanden)' : '');
      });
    }
    res.json({
      message: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir dir einen Link zum Zurücksetzen des Passworts gesendet.'
    });
  } catch (error) {
    console.error('requestPasswordReset error:', error.message);
    return authError(res, 500);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return authError(res, 400);
    }
    if (newPassword.length < 6) {
      return authError(res, 400);
    }
    const user = await dbHelpers.getUserByPasswordResetToken(token);
    if (!user) {
      return authError(res, 400);
    }
    const passwordHash = await hashPassword(newPassword);
    await dbHelpers.updateUser(user.id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null
    });
    res.json({ message: 'Passwort wurde geändert. Du kannst dich jetzt einloggen.' });
  } catch (error) {
    console.error('resetPassword error:', error.message);
    return authError(res, 500);
  }
}

export async function changeEmail(req, res, next) {
  try {
    const userId = req.user.userId;
    const user = await dbHelpers.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isGuest || !user.passwordHash) {
      return res.status(400).json({ error: 'E-Mail-Änderung nicht möglich' });
    }
    const { newEmail, currentPassword } = req.body;
    if (!newEmail || !currentPassword) {
      return res.status(400).json({ error: 'Neue E-Mail und aktuelles Passwort erforderlich' });
    }
    const newEmailNorm = newEmail.trim().toLowerCase();
    if (newEmailNorm === (user.email || '').toLowerCase()) {
      return res.status(400).json({ error: 'Die neue E-Mail ist identisch mit der aktuellen' });
    }
    const existing = await dbHelpers.getUserByEmail(newEmailNorm);
    if (existing) {
      return res.status(409).json({ error: 'Diese E-Mail-Adresse ist bereits vergeben' });
    }
    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Aktuelles Passwort ist falsch' });
    }
    const changeEmailToken = generateSecureToken();
    const changeEmailExpires = getTokenExpiry();
    await dbHelpers.updateUser(userId, {
      pendingEmail: newEmailNorm,
      changeEmailToken,
      changeEmailExpires
    });
    emailService.sendChangeEmailConfirmation(user, changeEmailToken, newEmailNorm).catch((mailErr) => {
      console.error('Change email confirmation failed:', mailErr.message);
    });
    res.json({ message: 'Wir haben dir eine E-Mail an deine neue Adresse geschickt. Bitte bestätige sie.' });
  } catch (error) {
    next(error);
  }
}

export async function confirmEmailChange(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) {
      return authError(res, 400);
    }
    const user = await dbHelpers.getUserByChangeEmailToken(token);
    if (!user) {
      return authError(res, 400);
    }
    const newEmail = user.pendingEmail;
    if (!newEmail) {
      return authError(res, 400);
    }
    await dbHelpers.updateUser(user.id, {
      email: newEmail,
      pendingEmail: null,
      changeEmailToken: null,
      changeEmailExpires: null,
      emailVerified: true
    });
    res.json({ message: 'E-Mail-Adresse wurde geändert.' });
  } catch (error) {
    console.error('confirmEmailChange error:', error.message);
    return authError(res, 500);
  }
}

export async function changeUsername(req, res, next) {
  try {
    const userId = req.user.userId;
    const user = await dbHelpers.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isGuest || !user.passwordHash) {
      return res.status(400).json({ error: 'Benutzername-Änderung nicht möglich' });
    }
    const { newUsername, currentPassword } = req.body;
    if (!newUsername || !currentPassword) {
      return res.status(400).json({ error: 'Neuer Benutzername und aktuelles Passwort erforderlich' });
    }
    const trimmed = newUsername.trim();
    if (!trimmed) {
      return res.status(400).json({ error: 'Benutzername darf nicht leer sein' });
    }
    const existing = await dbHelpers.getUserByUsername(trimmed);
    if (existing && existing.id !== userId) {
      return res.status(409).json({ error: 'Dieser Benutzername ist bereits vergeben' });
    }
    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Aktuelles Passwort ist falsch' });
    }
    await dbHelpers.updateUser(userId, { username: trimmed });
    emailService.sendUsernameChangedNotification({ ...user, username: trimmed }).catch((mailErr) => {
      console.error('Username changed notification failed:', mailErr.message);
    });
    res.json({ message: 'Benutzername wurde geändert.', username: trimmed });
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

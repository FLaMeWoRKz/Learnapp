/**
 * E-Mail-Service: kapselt Versand über SMTP (Nodemailer).
 * Konfiguration über Umgebungsvariablen: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, APP_BASE_URL.
 */

import nodemailer from 'nodemailer';

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';
const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@vocabmaster.local';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.warn('⚠️ E-Mail: SMTP nicht konfiguriert (SMTP_HOST, SMTP_USER, SMTP_PASS). E-Mails werden nur geloggt.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
  return transporter;
}

async function sendMail(options) {
  const transport = getTransporter();
  const mailOptions = {
    from: MAIL_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html
  };
  if (transport) {
    try {
      await transport.sendMail(mailOptions);
      console.log('[E-Mail gesendet]', { to: options.to, subject: options.subject });
    } catch (err) {
      console.error('E-Mail senden fehlgeschlagen:', err.message, err.code || '');
      throw err;
    }
  } else {
    console.error('[E-Mail NICHT gesendet] SMTP nicht konfiguriert (SMTP_HOST, SMTP_USER, SMTP_PASS prüfen). Empfänger:', options.to, 'Betreff:', options.subject);
    throw new Error('SMTP_NOT_CONFIGURED');
  }
}

export async function sendVerificationEmail(user, token) {
  const url = `${APP_BASE_URL}/verify-email?token=${encodeURIComponent(token)}`;
  const subject = 'Bestätige deine E-Mail-Adresse – VocabMaster';
  const text = `Hallo ${user.username},\n\nbitte bestätige deine E-Mail-Adresse, indem du auf den folgenden Link klickst:\n\n${url}\n\nDer Link ist 1 Stunde gültig.\n\nDein VocabMaster-Team`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2>E-Mail bestätigen</h2>
      <p>Hallo ${user.username},</p>
      <p>bitte bestätige deine E-Mail-Adresse, indem du auf den Button klickst:</p>
      <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:8px;">E-Mail bestätigen</a></p>
      <p>Oder kopiere diesen Link in deinen Browser: ${url}</p>
      <p><small>Der Link ist 1 Stunde gültig.</small></p>
      <p>Dein VocabMaster-Team</p>
    </div>`;
  await sendMail({ to: user.email, subject, text, html });
}

export async function sendWelcomeEmail(user) {
  const subject = 'Willkommen bei VocabMaster';
  const text = `Hallo ${user.username},\n\nwillkommen bei VocabMaster! Deine E-Mail wurde bestätigt. Du kannst dich jetzt einloggen und loslegen.\n\nDein VocabMaster-Team`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2>Willkommen bei VocabMaster</h2>
      <p>Hallo ${user.username},</p>
      <p>deine E-Mail wurde bestätigt. Du kannst dich jetzt einloggen und loslegen.</p>
      <p>Dein VocabMaster-Team</p>
    </div>`;
  await sendMail({ to: user.email, subject, text, html });
}

export async function sendPasswordResetEmail(user, token) {
  const url = `${APP_BASE_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = 'Passwort zurücksetzen – VocabMaster';
  const text = `Hallo ${user.username},\n\ndu hast angefordert, dein Passwort zurückzusetzen. Klicke auf den Link:\n\n${url}\n\nDer Link ist 1 Stunde gültig. Wenn du das nicht warst, ignoriere diese E-Mail.\n\nDein VocabMaster-Team`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2>Passwort zurücksetzen</h2>
      <p>Hallo ${user.username},</p>
      <p>du hast angefordert, dein Passwort zurückzusetzen. Klicke auf den Button:</p>
      <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:8px;">Passwort zurücksetzen</a></p>
      <p>Oder kopiere diesen Link: ${url}</p>
      <p><small>Der Link ist 1 Stunde gültig. Wenn du das nicht warst, ignoriere diese E-Mail.</small></p>
      <p>Dein VocabMaster-Team</p>
    </div>`;
  await sendMail({ to: user.email, subject, text, html });
}

export async function sendChangeEmailConfirmation(user, token, newEmail) {
  const url = `${APP_BASE_URL}/confirm-email-change?token=${encodeURIComponent(token)}`;
  const subject = 'E-Mail-Adresse bestätigen – VocabMaster';
  const text = `Hallo ${user.username},\n\nbitte bestätige deine neue E-Mail-Adresse:\n\n${url}\n\nDer Link ist 1 Stunde gültig.\n\nDein VocabMaster-Team`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2>Neue E-Mail-Adresse bestätigen</h2>
      <p>Hallo ${user.username},</p>
      <p>bitte bestätige deine neue E-Mail-Adresse (${newEmail}), indem du auf den Button klickst:</p>
      <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:8px;">E-Mail bestätigen</a></p>
      <p><small>Der Link ist 1 Stunde gültig.</small></p>
      <p>Dein VocabMaster-Team</p>
    </div>`;
  await sendMail({ to: newEmail, subject, text, html });
}

export async function sendUsernameChangedNotification(user) {
  const subject = 'Dein Benutzername wurde geändert – VocabMaster';
  const text = `Hallo,\n\ndein Benutzername wurde geändert. Falls du das nicht warst, wende dich bitte an den Support.\n\nDein VocabMaster-Team`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2>Benutzername geändert</h2>
      <p>Dein Benutzername wurde geändert. Falls du das nicht warst, wende dich bitte an den Support.</p>
      <p>Dein VocabMaster-Team</p>
    </div>`;
  await sendMail({ to: user.email, subject, text, html });
}

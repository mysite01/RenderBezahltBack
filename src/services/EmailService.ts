import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: Number(process.env.SMTP_PORT) || 1025,
    secure: false, // Kein SSL bei MailDev
    auth: process.env.SMTP_USER
        ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
});

export async function sendConfirmationEmail(to: string, token: string): Promise<boolean> {
    const confirmationUrl = `${process.env.APP_URL}/api/email/confirm-email?token=${token}`;
    try {
        await transporter.sendMail({
            from: process.env.SMTP_USER || "no-reply@example.com", // Fallback falls SMTP_USER nicht gesetzt ist
            to,
            subject: 'Bestätige deine E-Mail',
            html: `<p>Klicke auf diesen Link, um deine E-Mail zu bestätigen: <a href="${confirmationUrl}">${confirmationUrl}</a></p>`,
        });
        return true;
    } catch (error: any) {
        throw new Error(`Fehler beim Versenden der Bestätigungs-E-Mail: ${(error as Error).message}`);
    }
}

export async function sendResetPasswordEmail(to: string, token: string): Promise<boolean> {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
    try {
        await transporter.sendMail({
            from: process.env.SMTP_USER || "no-reply@example.com",
            to,
            subject: 'Passwort zurücksetzen',
            html: `<p>Klicke auf diesen Link, um dein Passwort zurückzusetzen: <a href="${resetUrl}">${resetUrl}</a></p>`,
        });
        return true;
    } catch (error: any) {
        throw new Error(`Fehler beim Versenden der Passwort-Reset-E-Mail: ${(error as Error).message}`);
    }
}

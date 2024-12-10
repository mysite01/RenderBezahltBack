import { sendConfirmationEmail, sendResetPasswordEmail } from '../../src/services/EmailService';
import { User } from '../../src/model/UserModel';
import supertest from 'supertest';
import app from '../../src/app';

describe('EmailService', () => {
    const testEmail = 'test@example.com';

    beforeAll(async () => {
        // Stelle sicher, dass dein SMTP-Server läuft
        console.log('Stelle sicher, dass MailDev läuft unter localhost:1025');
    });

    test('sendConfirmationEmail sends an email successfully', async () => {
        const response = await sendConfirmationEmail(testEmail, 'http://localhost:3000/confirm?token=testtoken');
        expect(response).toBeTruthy();
        console.log('Bestätigungs-E-Mail erfolgreich gesendet!');
    });

    test('sendResetPasswordEmail sends an email successfully', async () => {
        const response = await sendResetPasswordEmail(testEmail, 'test-reset-token');
        expect(response).toBeTruthy();
        console.log('Passwort-Reset-E-Mail erfolgreich gesendet!');
    });
});


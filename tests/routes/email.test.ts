import supertest from 'supertest';
import app from '../../src/app';
import { User } from '../../src/model/UserModel';
import jwt from 'jsonwebtoken';
import { generateToken } from '../../src/services/TokenService';
import dotenv from "dotenv";
dotenv.config();

const request = supertest(app);

describe("Email API Routes", () => {
    beforeAll(async () => {
        await User.deleteMany({});
    });

    test("GET /api/email/confirm-email - Confirm Email with valid token", async () => {
        const user = await User.create({ name: "TestUser", password: "password123" });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

        const response = await request.get(`/api/email/confirm-email?token=${token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("E-Mail erfolgreich bestätigt!");

        const updatedUser = await User.findById(user._id);
        expect(updatedUser?.emailConfirmed).toBe(true);
    });

    test("GET /api/email/confirm-email - Invalid token", async () => {
        const response = await request.get('/api/email/confirm-email?token=invalidToken');
        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Ungültiger oder abgelaufener Token.");
    });

    test("POST /api/email/forgot-password - Request reset link", async () => {
        // Benutzer in der Test-Datenbank erstellen
        const email = "test@example.com";
        const user = await User.create({ name: "Test User", email, password: "password123" });
    
        // Passwort-Reset-Link anfordern
        const response = await request.post('/api/email/forgot-password').send({ email });
    
        // Überprüfen, ob die Antwort korrekt ist
        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Passwort-Reset-Link wurde gesendet.");
    
        // Überprüfen, ob der Benutzer einen Reset-Token erhalten hat
        const updatedUser = await User.findById(user._id);
        expect(updatedUser?.resetToken).toBeDefined();
    });
    
    test("POST /api/email/reset-password - Reset password with valid token", async () => {
        const user = await User.create({ name: "test@example.com", password: "oldPassword" });
        const resetToken = generateToken();
        user.resetToken = resetToken;
        await user.save();

        const response = await request.post('/api/email/reset-password').send({
            token: resetToken,
            newPassword: "newPassword",
        });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Passwort erfolgreich zurückgesetzt.");

        const updatedUser = await User.findById(user._id);
        expect(await updatedUser?.isCorrectPassword("newPassword")).toBe(true);
        expect(updatedUser?.resetToken).toBeUndefined();
    });
});
test("POST /api/email/reset-password - Invalid token", async () => {
    const response = await request.post('/api/email/reset-password').send({
        token: "invalidToken",
        newPassword: "newPassword",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Ungültiger oder abgelaufener Token.");
});


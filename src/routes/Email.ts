import express, { Router, Request, Response } from "express";
import { sendConfirmationEmail, sendResetPasswordEmail } from "../services/EmailService";
import { verifyJWT, generateToken } from "../services/TokenService";
import { User } from "../model/UserModel";

const emailRouter: Router = express.Router();

/**
 * Überprüft die Gültigkeit eines Tokens und gibt eine Bestätigung zurück.
 */
emailRouter.get('/email/:token/:id', async (req: Request, res: Response): Promise<void> => {
    const { token, id } = req.params;

    try {
        const user = await User.findById(id);
        if (!user || user.resetToken !== token) {
            res.status(400).json({ message: "Ungültiger oder abgelaufener Token." });
            return;
        }

        res.status(200).json({ message: "Token ist gültig. Bitte setzen Sie Ihr Passwort zurück." });
    } catch (error) {
        console.error("Fehler beim Überprüfen des Tokens:", error);
        res.status(500).json({ message: "Fehler beim Verarbeiten des Tokens." });
    }
});

/**
 * Sendet eine Test-E-Mail mit einem generierten Token.
 */
emailRouter.post('/send-test', async (req: Request, res: Response) => {
    const { to } = req.body;

    try {
        const testToken = generateToken(); // Test-Token generieren
        await sendConfirmationEmail(to, testToken); // E-Mail mit Test-Token senden
        res.status(200).json({ message: "Test-E-Mail wurde erfolgreich gesendet." });
    } catch (error) {
        console.error("Fehler beim Senden der Test-E-Mail:", error); // Debugging
        res.status(500).json({ message: "Fehler beim Senden der Test-E-Mail" });
    }
});


/**
 * Bestätigt die E-Mail eines Benutzers mit einem gültigen Token.
 */
emailRouter.get('/confirm-email', async (req: Request, res: Response): Promise<void> => {
    const { token } = req.query;

    try {
        if (!token || typeof token !== "string") {
            res.status(400).json({ message: "Token fehlt oder ist ungültig." });
            return;
        }

        // Token verifizieren
        const decoded = verifyJWT(token);
        console.log("Decoded JWT:", decoded); // Debugging

        // Benutzer finden
        const user = await User.findById(decoded.id);
        if (!user) {
            res.status(404).json({ message: "Benutzer nicht gefunden." });
            return;
        }

        // E-Mail als bestätigt markieren
        user.emailConfirmed = true;
        await user.save();

        res.status(200).json({ message: "E-Mail erfolgreich bestätigt!" });
    } catch (error) {
        console.error("Fehler beim Bestätigen der E-Mail:", error); // Debugging
        res.status(400).json({ message: "Ungültiger oder abgelaufener Token." });
    }
});

/**
 * Sendet einen Passwort-Reset-Link an die E-Mail des Benutzers.
 */
emailRouter.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "Benutzer nicht gefunden." });
            return;
        }

        const resetToken = generateToken();
        user.resetToken = resetToken;
        await user.save();

        await sendResetPasswordEmail(email, resetToken);
        res.status(200).json({ message: "Passwort-Reset-Link wurde gesendet." });
    } catch (error) {
        console.error("Fehler beim Senden des Passwort-Reset-Links:", error);
        res.status(500).json({ message: "Fehler beim Senden des Passwort-Reset-Links." });
    }
});

/**
 * Setzt das Passwort eines Benutzers zurück, wenn ein gültiger Token bereitgestellt wird.
 */
emailRouter.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.body;

    try {
        const user = await User.findOne({ resetToken: token });
        if (!user) {
            res.status(400).json({ message: "Ungültiger oder abgelaufener Token." });
            return;
        }

        // Neues Passwort setzen
        user.password = newPassword;
        user.resetToken = undefined; // Token löschen
        await user.save();

        res.status(200).json({ message: "Passwort erfolgreich zurückgesetzt." });
    } catch (error) {
        console.error("Fehler beim Zurücksetzen des Passworts:", error);
        res.status(500).json({ message: "Fehler beim Zurücksetzen des Passworts." });
    }
});

export default emailRouter;

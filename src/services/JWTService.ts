import { JsonWebTokenError, sign, verify } from "jsonwebtoken";
import { login } from "../services/AuthenticationService";

/**
 * Erstellt ein JWT nach erfolgreicher Authentifizierung.
 * @param name - Benutzername
 * @param password - Benutzerpasswort
 * @returns Das generierte JWT-Token oder `undefined`, wenn die Authentifizierung fehlschlägt.
 */
export async function verifyPasswordAndCreateJWT(name: string, password: string): Promise<string | undefined> {
    const secret = process.env.JWT_SECRET;
    const ttl = process.env.JWT_TTL || "1h"; // Standardwert: Token ist eine Stunde gültig

    if (!secret) {
        throw new Error("Umgebungsvariable JWT_SECRET ist nicht gesetzt.");
    }

    const user = await login(name, password); // Login prüfen
    if (!user) {
        return undefined; // Benutzer nicht gefunden oder falsches Passwort
    }

    // Payload für das JWT
    const payload = {
        id: user.id, // Benutzer-ID
    };

    // Token generieren
    const jwtString = sign(payload, secret, {
        expiresIn: ttl,
        algorithm: "HS256", // Standardalgorithmus
    });

    return jwtString;
}

/**
 * Verifiziert ein JWT und gibt die Benutzerinformationen zurück.
 * @param jwtString - Das JWT-Token
 * @returns Ein Objekt mit Benutzer-ID und Ablaufzeit (falls vorhanden)
 * @throws {JsonWebTokenError} Wenn das JWT ungültig oder abgelaufen ist.
 */
export function verifyJWT(jwtString: string | undefined): { id: string; exp: number | undefined } {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("Umgebungsvariable JWT_SECRET ist nicht gesetzt.");
    }

    if (!jwtString) {
        throw new JsonWebTokenError("JWT ist nicht definiert.");
    }

    try {
        const payload = verify(jwtString, secret) as any; // Payload aus dem JWT extrahieren
        return {
            id: payload.id, // Die Benutzer-ID
            exp: payload.exp, // Ablaufzeit des Tokens
        };
    } catch (err) {
        console.error("Fehler beim Verifizieren des JWT:", err); // Log für Debugging
        throw new JsonWebTokenError("JWT-Überprüfung fehlgeschlagen.");
    }
}

/**
 * Erstellt ein temporäres JWT für E-Mail-Bestätigung oder Passwort-Reset.
 * @param userId - Die ID des Benutzers
 * @param expiresIn - Ablaufzeit des Tokens (z. B. "1h", "7d")
 * @returns Das generierte JWT-Token
 */
export function createTemporaryJWT(userId: string, expiresIn: string = "1h"): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("Umgebungsvariable JWT_SECRET ist nicht gesetzt.");
    }

    // Payload für das temporäre Token
    const payload = {
        id: userId,
    };

    // Token generieren
    return sign(payload, secret, {
        expiresIn,
        algorithm: "HS256",
    });
}

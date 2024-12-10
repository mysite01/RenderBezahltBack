import express, { Request, Response, NextFunction } from "express";
import { login } from "../services/AuthenticationService";  // Importiere die Login-Funktion

export const authenticationRoutes = express.Router();

// POST-Route für das Login
authenticationRoutes.post("/login", async (req, res,next) => {
    const { name, password } = req.body;
    
    try {
        // Aufruf der Login-Funktion aus dem Service
        const result = await login(name, password);
        
        if (result) {
             res.status(200).json(result);  // Erfolgreiches Login: Token und ID zurückgeben

        } else {
             res.status(401).send({ message: 'No such username exists' });
        }
    } catch (error) {
        console.error("errror vom Service..+++",error);
        // Fehlerbehandlung
         res.status(500).json(error);
         
    }

})
    




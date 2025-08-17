import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Token não fornecido",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyToken(token);

    req.user = payload; // tipado corretamente via .d.ts
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: err.message || "Token inválido ou expirado",
    });
  }
}

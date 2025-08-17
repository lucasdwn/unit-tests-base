// src/controllers/user.controller.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import db from "../config/db";
import { generateToken } from "../utils/jwt";
import type { UserPayload } from "../types/express";

// --- Criar usuário ---
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (username, password) VALUES ($1, $2)",
      [username, hashedPassword]
    );

    res.status(201).json({
      success: true,
      data: { message: "Usuário criado com sucesso." },
    });
  } catch (error: any) {
    console.error(error);

    if (error.code === "23505") {
      res.status(400).json({
        success: false,
        error: error.message || "Nome de usuário já cadastrado. Escolha outro.",
      });
      return;
    }

    res.status(500).json({ success: false, error: "Erro ao criar usuário." });
  }
};

// --- Login de usuário ---
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    const result = await db.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    if (result.rows.length === 0) {
      res.status(401).json({ success: false, error: "Credenciais inválidas." });
      return;
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      res.status(401).json({ success: false, error: "Credenciais inválidas." });
      return;
    }

    const payload: UserPayload = { id: user.id, username: user.username };
    const token = await generateToken(payload);

    res.status(200).json({
      success: true,
      data: {
        message: "Login realizado com sucesso.",
        token,
        user: { id: user.id, username: user.username },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Erro ao realizar login." });
  }
};

// --- Logout de usuário ---
export const logoutUser = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: { message: "Logout realizado com sucesso." },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Erro ao realizar logout." });
  }
};

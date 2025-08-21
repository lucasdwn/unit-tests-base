// src/controllers/contact.controller.ts
import { Request, Response } from "express";
import pool from "../configs/db";
import type { UserPayload } from "../types/express";

// --- Criar novo contato ---
export const createContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as UserPayload;
    const { name, phone } = req.body;

    const result = await pool.query(
      "INSERT INTO contacts (user_id, name, phone) VALUES ($1, $2, $3) RETURNING *",
      [user.id, name, phone]
    );

    res.status(201).json({
      success: true,
      data: { contact: result.rows[0] },
    });
  } catch (error) {
    console.error("Erro ao criar contato:", error);
    res.status(500).json({ success: false, error: "Erro interno no servidor" });
  }
};

// --- Listar todos os contatos do usuário logado ---
export const getContacts = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as UserPayload;

    const result = await pool.query("SELECT * FROM contacts WHERE user_id = $1", [user.id]);
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Erro ao buscar contatos:", error);
    res.status(500).json({ success: false, error: "Erro interno no servidor" });
  }
};

// --- Atualizar contato ---
export const updateContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;
    const user = req.user as UserPayload;

    const result = await pool.query(
      "UPDATE contacts SET name = $1, phone = $2 WHERE id = $3 AND user_id = $4 RETURNING *",
      [name, phone, id, user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: "Contato não encontrado" });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Erro ao atualizar contato:", error);
    res.status(500).json({ success: false, error: "Erro interno no servidor" });
  }
};

// --- Deletar contato ---
export const deleteContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user as UserPayload;

    const result = await pool.query(
      "DELETE FROM contacts WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: "Contato não encontrado" });
      return;
    }

    res.json({ success: true, data: { message: "Contato deletado com sucesso" } });
  } catch (error) {
    console.error("Erro ao deletar contato:", error);
    res.status(500).json({ success: false, error: "Erro interno no servidor" });
  }
};
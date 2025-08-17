import { Router } from "express";
import {
  createContact,
  getContacts,
  updateContact,
  deleteContact,
} from "../controllers/contact.controller";
import { validateBody } from "../middlewares/validateBody";

const router = Router();

// Criar novo contato
router.post(
  "/",
  validateBody([
    { name: "name", required: true, type: "string", minLength: 2, maxLength: 50 },
    { name: "phone", required: true, type: "string", pattern: /^(\(\d{2}\)|\d{2})\d{4,5}-?\d{4}$/ }
  ]),
  createContact
);

// Listar todos os contatos do usuário logado
router.get("/", getContacts);

// Atualizar contato
router.put(
  "/:id",
  validateBody([
    { name: "name", required: true, type: "string", minLength: 2, maxLength: 50 },
    { name: "phone", required: true, type: "string", pattern: /^(\(\d{2}\)|\d{2})\d{4,5}-?\d{4}$/ }
  ]),
  updateContact
);

// Deletar contato
router.delete("/:id", deleteContact);

export default router;

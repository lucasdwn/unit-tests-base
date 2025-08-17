import express from "express";
import user from "./users.routes";
import contact from "./contacts.routes";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.use("/users", user);
router.use("/contacts", authMiddleware, contact);

export default router;


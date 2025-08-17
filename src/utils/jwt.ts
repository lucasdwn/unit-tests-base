import { SignJWT, jwtVerify } from "jose";
import type { UserPayload } from "../types/express";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
const alg = "HS256";
const expiresIn = process.env.JWT_EXPIRES_IN || "1h";

/**
 * Gera um JWT assinado
 */
export async function generateToken(payload: UserPayload): Promise<string> {
  return await new SignJWT({ ...payload }) // espalha para virar um objeto indexável
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

/**
 * Valida e retorna o payload do JWT
 */
export async function verifyToken(token: string): Promise<UserPayload> {
  const { payload } = await jwtVerify<UserPayload>(token, secret, { algorithms: [alg] });
  return payload;
}

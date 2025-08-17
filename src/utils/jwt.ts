import { SignJWT, jwtVerify, decodeJwt, errors } from "jose";
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
export async function verifyToken(
  token: string,
  ignoreExpiration = false
): Promise<UserPayload> {
  try {
    const { payload } = await jwtVerify<UserPayload>(token, secret, {
      algorithms: [alg],
    });
    return payload;
  } catch (err) {
    if (ignoreExpiration && err instanceof errors.JWTExpired) {
      // Decodifica sem validar exp
      const payload = decodeJwt<UserPayload>(token);
      return payload;
    }
    throw err;
  }
}

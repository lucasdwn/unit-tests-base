import { Pool } from "pg";
import Redis from "ioredis";

declare global {
  // Definições globais
  // Evita conflito com outros módulos
  // Permite tipagem correta em `global.pool` e `global.redis`
  // Importante: usar `var` e não `const`
  var pool: Pool;
  var redis: Redis;
}

// Necessário para transformar o arquivo em módulo e não dar erro
export {};

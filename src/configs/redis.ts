import Redis from "ioredis";

// Carrega variáveis de ambiente do .env
const redisHost = process.env.REDIS_HOST;
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;

// Inicializa o cliente Redis
const redisClient = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  retryStrategy: (times) => {
    // Exponencial backoff até no máximo 2 segundos
    return Math.min(times * 50, 2000);
  },
});

// Eventos de log (opcional)
redisClient.on("connect", () => {
  console.log("Redis conectado com sucesso!");
});

redisClient.on("error", (err) => {
  console.error("Erro no Redis:", err);
});

export default redisClient;

/*
# Subir servidor Redis no Docker
docker run --name redis -p 6379:6379 -d redis redis-server --requirepass 123
*/

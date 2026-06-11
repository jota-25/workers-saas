import {Redis} from "@upstash/redis";


let redis = null;

if (
  process.env.NODE_ENV !== "test" &&
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export { redis };


export async function connectRedis() {

  if (!redis) {
    console.log(
      "Redis deshabilitado (modo test o variables ausentes)"
    );
    return;
  }

  try {
    await redis.set(
      "connection_test",
      "ok"
    );

    console.log(
      "Redis conectado correctamente"
    );

  } catch (error) {
    console.error(
      "Error conectando Redis:",
      error
    );

    throw error;
  }
}

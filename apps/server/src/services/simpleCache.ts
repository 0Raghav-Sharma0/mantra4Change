import { Redis } from "ioredis";

const TTL_MS = 5 * 60 * 1000;

type Value = unknown;

class MemoryStore {
  private store = new Map<string, { value: Value; expiresAt: number }>();

  get(key: string): Value | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: Value, ttlMs = TTL_MS) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  del(key: string) {
    this.store.delete(key);
  }
}

let redisClient: Redis | null = null;
let useRedis = false;

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL);
    // Connect async but don't await here; commands will queue.
    redisClient.on("error", () => {});
    useRedis = true;
  } catch (e) {
    // fallback to memory store
    useRedis = false;
    redisClient = null;
  }
}

const memory = new MemoryStore();

export async function cacheGet(key: string): Promise<Value | null> {
  if (useRedis && redisClient) {
    try {
      const raw = await redisClient.get(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }
  return memory.get(key);
}

export async function cacheSet(key: string, value: Value, ttlMs = TTL_MS): Promise<void> {
  if (useRedis && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), "PX", ttlMs);
      return;
    } catch (e) {
      // fallthrough
    }
  }
  memory.set(key, value, ttlMs);
}

export async function cacheDel(key: string): Promise<void> {
  if (useRedis && redisClient) {
    try {
      await redisClient.del(key);
      return;
    } catch (e) {
      // ignore
    }
  }
  memory.del(key);
}

export function cacheIsRedis(): boolean {
  return useRedis;
}

export default { cacheGet, cacheSet, cacheDel, cacheIsRedis };

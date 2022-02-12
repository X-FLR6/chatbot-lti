import { createClient } from "@node-redis/client";
import crypto from "crypto";

class RCache {
  redisClient;
  connected: boolean;
  constructor() {
    this.redisClient = createClient();
    this.connected = false;
    this.redisClient.on("error", (err) =>
      console.log("Redis Client Error", err)
    );
  }

  async getRandomKey(): Promise<string> {
    const key = crypto.randomBytes(12).toString("hex");
    return (await this.redisClient.exists(key)) === 1
      ? await this.getRandomKey()
      : key;
  }

  async connect() {
    await this.redisClient.connect();
    this.connected = true;
  }

  async cache(value: string, _key?: string | null) {
    const key = _key ?? (await this.getRandomKey());
    await this.redisClient.set(key, value);
    return key;
  }

  read(key: string) {
    return this.redisClient.get(key);
  }

  clear(key: string) {
    return this.redisClient.del(key);
  }
}

const rCache = new RCache();
rCache.connect();

export default async function returnConnectedRCache(): Promise<RCache> {
  if (rCache.connected) {
    return rCache;
  } else {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return returnConnectedRCache();
  }
}

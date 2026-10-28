import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { DataStore } from "./repositories/dataStore";
import { MemoryStore } from "./repositories/memoryStore";
import { MongoStore } from "./repositories/mongoStore";

async function createStore(): Promise<DataStore> {
  if (!env.MONGO_URI) return new MemoryStore();
  return MongoStore.connect(env.MONGO_URI);
}

async function start(): Promise<void> {
  const store = await createStore();
  const app = createApp({ store });
  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, storage: store.mode }, "PG Finder Ops Console API listening");
  });
}

void start().catch((error: unknown) => {
  logger.fatal({ err: error }, "API startup failed");
  process.exitCode = 1;
});

import cors from "cors";
import express, { Express, Request } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { CallKaroPathConfig } from "./adapters/callkaroAdapter";
import { corsOrigins, env } from "./config/env";
import { logger } from "./config/logger";
import { AppError } from "./domain/errors";
import { errorHandler } from "./http/errorHandler";
import { requestId } from "./http/middleware";
import { openApiSpec } from "./openapi";
import { DataStore } from "./repositories/dataStore";
import { MemoryStore } from "./repositories/memoryStore";
import { createApiRouter } from "./routes/api";

export type AppOptions = {
  store?: DataStore;
  webhookSecret?: string;
  corsOrigins?: string[];
  callKaroPaths?: CallKaroPathConfig;
  rateLimitMax?: number;
};

export function createApp(options: AppOptions = {}): Express {
  const store = options.store ?? new MemoryStore();
  const app = express();
  app.disable("x-powered-by");
  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (_request: Request, response) =>
        response.getHeader("x-request-id")?.toString() ?? "missing",
      customProps: (_request, response) => ({ requestId: response.getHeader("x-request-id") }),
      serializers: {
        req: (request) => ({ method: request.method, url: request.url, id: request.id }),
        res: (response) => ({ statusCode: response.statusCode }),
      },
    }),
  );
  app.use(helmet());
  const allowedOrigins = options.corsOrigins ?? corsOrigins;
  app.use(
    cors({
      origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
      credentials: false,
    }),
  );
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      limit: options.rateLimitMax ?? env.RATE_LIMIT_MAX,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      handler: (_request, _response, next) =>
        next(new AppError("Too many requests.", 429, "RATE_LIMITED")),
    }),
  );
  app.use(express.json({ limit: "1mb", strict: false }));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.use(
    "/api/v1",
    createApiRouter({
      store,
      webhookSecret: options.webhookSecret ?? env.CALLKARO_WEBHOOK_SECRET,
      callKaroPaths: options.callKaroPaths,
    }),
  );
  app.use((_request, _response, next) => next(new AppError("Route not found.", 404, "NOT_FOUND")));
  app.use(errorHandler);
  return app;
}

import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "phone",
      "contactPhone",
      "req.body.phone",
      "req.body.contactPhone",
      "res.body.phone",
      "res.body.contactPhone",
      "metadataSent.phone",
      "req.headers.x-callkaro-secret",
      "req.headers.authorization",
    ],
    censor: "[REDACTED]",
  },
  base: { service: "pg-finder-ops-console-api" },
});

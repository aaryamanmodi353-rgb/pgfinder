import { ErrorRequestHandler, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../domain/errors";
import { logger } from "../config/logger";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  request: Request,
  response: Response,
  _next,
) => {
  void _next;
  const requestId = response.getHeader("x-request-id")?.toString() ?? "unknown";
  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "An unexpected error occurred.";
  let details: unknown;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "Request validation failed.";
    details = error.flatten();
  } else if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.parse.failed"
  ) {
    statusCode = 400;
    code = "INVALID_JSON";
    message = "Request body must contain valid JSON.";
  } else if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.too.large"
  ) {
    statusCode = 413;
    code = "PAYLOAD_TOO_LARGE";
    message = "Request body exceeds the 1 MB limit.";
  } else if (error instanceof Error) {
    logger.error({ err: error, requestId, route: request.path }, "Unhandled request error");
  }

  const envelope: {
    error: { code: string; message: string; details?: unknown };
    requestId: string;
  } = {
    error: { code, message },
    requestId,
  };
  if (details !== undefined) envelope.error.details = details;
  response.status(statusCode).json(envelope);
};

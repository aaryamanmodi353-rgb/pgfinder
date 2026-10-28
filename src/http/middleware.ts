import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextFunction, Request, Response } from "express";
import { z, ZodTypeAny } from "zod";
import { AppError } from "../domain/errors";

export function requestId(_request: Request, response: Response, next: NextFunction): void {
  response.setHeader("x-request-id", randomUUID());
  next();
}

export function validateBody(schema: ZodTypeAny) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      next(
        new AppError(
          "Request body validation failed.",
          400,
          "VALIDATION_ERROR",
          parsed.error.flatten(),
        ),
      );
      return;
    }
    request.body = parsed.data;
    next();
  };
}

export function validateParams(schema: z.ZodObject<z.ZodRawShape>) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(request.params);
    if (!parsed.success) {
      next(
        new AppError(
          "Request path validation failed.",
          400,
          "VALIDATION_ERROR",
          parsed.error.flatten(),
        ),
      );
      return;
    }
    request.params = parsed.data as unknown as Request["params"];
    next();
  };
}

export function webhookSecret(secret: string) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (!secret) {
      next();
      return;
    }
    const supplied = request.get("x-callkaro-secret") ?? "";
    const expectedBuffer = Buffer.from(secret);
    const suppliedBuffer = Buffer.from(supplied);
    const matches =
      expectedBuffer.length === suppliedBuffer.length &&
      timingSafeEqual(expectedBuffer, suppliedBuffer);
    if (!matches) {
      next(new AppError("Webhook authentication failed.", 401, "WEBHOOK_UNAUTHORIZED"));
      return;
    }
    next();
  };
}

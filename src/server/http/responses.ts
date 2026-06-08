import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return Response.json({ data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function error(message: string, status = 400, details?: unknown) {
  return Response.json({ error: { message, details } }, { status });
}

export function validationError(err: unknown) {
  if (err instanceof ZodError) {
    return error("Invalid request body", 422, err.flatten());
  }
  return error("Invalid request body", 422);
}

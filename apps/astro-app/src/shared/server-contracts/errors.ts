import { z } from "zod";

const errorShape = <TCode extends number, TType extends string>(
  code: TCode,
  type: TType,
) =>
  z.object({
    code: z.literal(code),
    type: z.literal(type),
    message: z.string(),
  });

export const badRequest = errorShape(400, "bad-request");
export const unauthorized = errorShape(401, "unauthorized");
export const forbidden = errorShape(403, "forbidden");
export const notFound = errorShape(404, "not-found");
export const conflict = errorShape(409, "conflict");
export const internalServer = errorShape(500, "internal-server");

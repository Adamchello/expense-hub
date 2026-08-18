import { ZodError, type z } from "zod";
import { BadRequest, InternalServer } from "../core/error-handling";
import type { ProcedureSchema } from "../core/procedure";

type InOutSchema = z.ZodObject<{
  in: z.ZodTypeAny;
  out: z.ZodTypeAny;
}>;

const formatZodError = (error: ZodError): string => {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
};

export const withZodSchema = <TSchema extends InOutSchema>({
  schema,
}: {
  schema: () => TSchema;
}): ProcedureSchema<z.infer<TSchema>["in"], z.infer<TSchema>["out"]> => {
  let resolvedSchema: TSchema | undefined;
  const getSchema = () => {
    if (!resolvedSchema) {
      resolvedSchema = schema();
    }

    return resolvedSchema;
  };

  return {
    parseInput: async (input) => {
      try {
        return await getSchema().shape.in.parseAsync(input);
      } catch (error) {
        if (error instanceof ZodError) {
          throw new BadRequest(
            `Invalid request payload: ${formatZodError(error)}`,
          );
        }

        throw error;
      }
    },
    parseOutput: async (output) => {
      // Contract enforcement catches server bugs, not client input — skip the
      // re-validation in production to save Workers CPU time per response.
      if (import.meta.env.PROD) {
        return output as z.infer<TSchema>["out"];
      }

      try {
        return await getSchema().shape.out.parseAsync(output);
      } catch (error) {
        if (error instanceof ZodError) {
          console.error("Response contract violation:", formatZodError(error));
          throw new InternalServer();
        }

        throw error;
      }
    },
  };
};

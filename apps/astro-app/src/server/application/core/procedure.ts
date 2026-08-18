import type { APIContext } from "astro";
import { createSupabaseServerClient } from "@/shared/data-sources/supabase-server";
import type { AuthenticatedUser } from "../../domain/user";
import {
  APIError,
  Conflict,
  InternalServer,
  Unauthorized,
} from "./error-handling";

export type SupabaseServer = ReturnType<typeof createSupabaseServerClient>;

export type ProcedureSchema<TIn, TOut> = {
  parseInput: (input: unknown) => Promise<TIn>;
  parseOutput: (output: unknown) => Promise<TOut>;
};

const getUser = async (db: SupabaseServer): Promise<AuthenticatedUser> => {
  const userResult = await db.auth.getUser();

  if (userResult.error || !userResult.data.user) throw new Unauthorized();

  const user = userResult.data.user;

  if (!user.email) throw new Unauthorized();

  return { id: user.id, email: user.email };
};

const getActiveProfileId = async (
  db: SupabaseServer,
  userId: string,
): Promise<string> => {
  const settingsResult = await db
    .from("account_settings")
    .select("active_profile_id")
    .eq("account_id", userId)
    .maybeSingle();

  if (settingsResult.error || !settingsResult.data?.active_profile_id) {
    throw new Conflict("No active profile selected");
  }

  return settingsResult.data.active_profile_id;
};

const createProcedureFactory = <TIn, TOut, TExtra>({
  schema,
  resolveExtra,
}: {
  schema: ProcedureSchema<TIn, TOut>;
  resolveExtra: (db: SupabaseServer) => Promise<TExtra>;
}) => {
  return ({
    handler,
  }: {
    handler: (
      input: TIn,
      extra: { db: SupabaseServer } & TExtra,
    ) => Promise<TOut>;
  }) => {
    return async (input: unknown, context: APIContext): Promise<TOut> => {
      try {
        const db = createSupabaseServerClient(context);
        const extra = await resolveExtra(db);

        const parsedInput = await schema.parseInput(input);
        const result = await handler(parsedInput, {
          db,
          ...extra,
        });
        return await schema.parseOutput(result);
      } catch (error) {
        if (APIError.is(error)) {
          return error.json() as TOut;
        }

        console.error("Unhandled procedure error:", error);
        return new InternalServer().json() as TOut;
      }
    };
  };
};

export const publicProcedure = <TIn, TOut>({
  schema,
}: {
  schema: ProcedureSchema<TIn, TOut>;
}) => {
  return createProcedureFactory({
    schema,
    resolveExtra: async () => ({}),
  });
};

export const privateProcedure = <TIn, TOut>({
  schema,
}: {
  schema: ProcedureSchema<TIn, TOut>;
}) => {
  return createProcedureFactory({
    schema,
    resolveExtra: async (db) => ({
      user: await getUser(db),
    }),
  });
};

export const profileProcedure = <TIn, TOut>({
  schema,
}: {
  schema: ProcedureSchema<TIn, TOut>;
}) => {
  return createProcedureFactory({
    schema,
    resolveExtra: async (db) => {
      const user = await getUser(db);
      const activeProfileId = await getActiveProfileId(db, user.id);
      return { user, activeProfileId };
    },
  });
};

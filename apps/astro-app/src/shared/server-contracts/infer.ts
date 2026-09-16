import type { z } from "zod";

export type InferOut<
  TUnion extends { code: number },
  TCode extends TUnion["code"] | undefined = undefined,
> = [TCode] extends [undefined] ? TUnion : Extract<TUnion, { code: TCode }>;

type ContractFactory = () => z.ZodObject<{
  in: z.ZodTypeAny;
  out: z.ZodTypeAny;
}>;

/**
 * Input a contract's endpoint accepts. Use with `import type` on the
 * contract factory — the schema never enters the client bundle.
 *
 *   type Payload = ContractIn<typeof createExpenseContract>;
 */
export type ContractIn<TContract extends ContractFactory> = z.infer<
  ReturnType<TContract>
>["in"];

/**
 * Response members of a contract, narrowed to one code:
 *
 *   type Created = ContractOut<typeof createExpenseContract, 201>;
 *
 * Omit the code to get the full discriminated union.
 */
export type ContractOut<
  TContract extends ContractFactory,
  TCode extends z.infer<ReturnType<TContract>>["out"]["code"] | undefined =
    undefined,
> = InferOut<z.infer<ReturnType<TContract>>["out"], TCode>;

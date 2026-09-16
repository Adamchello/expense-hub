/**
 * Vendor-neutral request shape for "give the model some content, get JSON
 * back". `infrastructure/llm` owns model choice, transport, and wire format;
 * callers own prompts, schemas, and validation of what comes back.
 */

export type LlmContentPart =
  | { kind: "text"; text: string }
  | { kind: "pdf"; fileName: string; base64: string };

export type LlmJsonRequest = {
  /** System-level instructions for the task. */
  instructions: string;
  content: LlmContentPart[];
  /** JSON schema the reply must satisfy; the adapter enforces it as strictly as the provider allows. */
  output: { name: string; schema: Record<string, unknown> };
};

import type {
  LlmContentPart,
  LlmJsonRequest,
} from "@/server/application/core/llm-client";
import { readSecret } from "./secrets";

/**
 * The one place that knows which model provider we use. Swapping providers
 * means rewriting this file; nothing above it imports a vendor name.
 *
 * Current provider: OpenAI Responses API.
 */

const API_KEY_ENV = "OPENAI_API_KEY";
const RESPONSES_URL = "https://api.openai.com/v1/responses";
const MODEL = "gpt-5-mini";
/**
 * Hard ceiling on reply size. 500 extracted rows is roughly 15k tokens; this
 * leaves headroom without letting a runaway reply bill without bound.
 */
const MAX_OUTPUT_TOKENS = 32_000;
/** Page images at low detail: statements are text-heavy, fine print is rare. */
const PDF_DETAIL = "low";

export class LlmNotConfiguredError extends Error {
  constructor() {
    super(`Model provider is not configured (${API_KEY_ENV} is missing)`);
    this.name = "LlmNotConfiguredError";
  }
}

/** The model hit the output token ceiling before finishing the JSON. */
export class LlmOutputTooLongError extends Error {
  constructor() {
    super("Model reply exceeded the output token limit");
    this.name = "LlmOutputTooLongError";
  }
}

/** The model declined to answer (safety refusal). */
export class LlmRefusedError extends Error {
  constructor(reason: string) {
    super(`Model refused: ${reason}`);
    this.name = "LlmRefusedError";
  }
}

type ProviderInputPart =
  | { type: "input_text"; text: string }
  | {
      type: "input_file";
      filename: string;
      file_data: string;
      detail: typeof PDF_DETAIL;
    };

const toInputPart = (part: LlmContentPart): ProviderInputPart =>
  part.kind === "text"
    ? { type: "input_text", text: part.text }
    : {
        type: "input_file",
        filename: part.fileName,
        file_data: `data:application/pdf;base64,${part.base64}`,
        detail: PDF_DETAIL,
      };

type ProviderPayload = {
  status?: string;
  incomplete_details?: { reason?: string };
  output?: Array<{
    type: string;
    content?: Array<{ type: string; text?: string; refusal?: string }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string };
};

const readOutputText = (payload: ProviderPayload): string => {
  for (const item of payload.output ?? []) {
    if (item.type !== "message") continue;
    for (const part of item.content ?? []) {
      if (part.type === "refusal") {
        throw new LlmRefusedError(part.refusal ?? "no reason given");
      }
      if (part.type === "output_text" && typeof part.text === "string") {
        return part.text;
      }
    }
  }
  throw new Error("Model reply contained no output text");
};

/** Resolves to the parsed JSON reply, guaranteed to match `output.schema`. */
export const generateJson = async ({
  instructions,
  content,
  output,
}: LlmJsonRequest): Promise<unknown> => {
  const apiKey = readSecret(API_KEY_ENV);
  if (!apiKey) throw new LlmNotConfiguredError();

  const response = await fetch(RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_output_tokens: MAX_OUTPUT_TOKENS,
      input: [
        { role: "system", content: instructions },
        { role: "user", content: content.map(toInputPart) },
      ],
      text: {
        format: {
          type: "json_schema",
          name: output.name,
          strict: true,
          schema: output.schema,
        },
      },
    }),
  });

  const payload = (await response.json()) as ProviderPayload;

  if (!response.ok) {
    throw new Error(
      payload.error?.message ?? `Model request failed (${response.status})`,
    );
  }

  console.log("llm usage", {
    model: MODEL,
    task: output.name,
    input_tokens: payload.usage?.input_tokens,
    output_tokens: payload.usage?.output_tokens,
    total_tokens: payload.usage?.total_tokens,
  });

  if (payload.status === "incomplete") {
    if (payload.incomplete_details?.reason === "max_output_tokens") {
      throw new LlmOutputTooLongError();
    }
    throw new Error(
      `Model reply incomplete (${payload.incomplete_details?.reason ?? "unknown"})`,
    );
  }

  return JSON.parse(readOutputText(payload)) as unknown;
};

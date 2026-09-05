import { zodToJsonSchema } from "zod-to-json-schema";
import type { LlmContentPart } from "@/server/application/core/llm-client";
import { generateJson } from "@/server/application/adapter/llm";
import {
  extractionResultSchema,
  type ExtractExpensesInput,
  type ExtractionResult,
} from "@/shared/server-contracts/schemas/expense";
import { extractionInstructions, PDF_TASK, rowsTask } from "./prompt";

/** Contract-derived strict schema, computed once; category narrowed per request. */
const BASE_OUTPUT_SCHEMA = (() => {
  const { $schema: _ignored, ...schema } = zodToJsonSchema(
    extractionResultSchema,
    { $refStrategy: "none" },
  ) as Record<string, unknown>;
  return schema;
})();

/**
 * Strict-mode JSON schema for the model, derived from the same zod schema
 * that validates the reply and types the API contract, with `category`
 * narrowed to an enum of what this user can actually pick.
 */
export const buildExtractionOutputSchema = (
  categories: string[],
): Record<string, unknown> => {
  const base = BASE_OUTPUT_SCHEMA as {
    properties: { rows: { items: { properties: Record<string, unknown> } } };
  };
  const rowProperties = base.properties.rows.items.properties;

  return {
    ...BASE_OUTPUT_SCHEMA,
    properties: {
      ...base.properties,
      rows: {
        ...base.properties.rows,
        items: {
          ...base.properties.rows.items,
          properties: {
            ...rowProperties,
            category: { type: "string", enum: categories },
          },
        },
      },
    },
  };
};

const buildContent = (source: ExtractExpensesInput): LlmContentPart[] =>
  source.kind === "pdf"
    ? [
        { kind: "pdf", fileName: source.fileName, base64: source.base64 },
        { kind: "text", text: PDF_TASK },
      ]
    : [
        {
          kind: "text",
          text: rowsTask(source.fileName, source.headers, source.rows),
        },
      ];

export const extractExpensesWith = async (
  source: ExtractExpensesInput,
  categories: string[],
): Promise<ExtractionResult> => {
  const reply = await generateJson({
    instructions: extractionInstructions(categories),
    content: buildContent(source),
    output: {
      name: "expense_extraction",
      schema: buildExtractionOutputSchema(categories),
    },
  });

  return extractionResultSchema.parse(reply);
};

import {
  generateJson,
  LlmNotConfiguredError,
  LlmOutputTooLongError,
  LlmRefusedError,
} from "./llm";

type FetchCall = { url: string; init: RequestInit; body: any };

const jsonResponse = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const responsesApiReply = (outputText: string, extra: object = {}) => ({
  status: "completed",
  output: [
    {
      type: "message",
      role: "assistant",
      content: [{ type: "output_text", text: outputText }],
    },
  ],
  usage: { input_tokens: 120, output_tokens: 30, total_tokens: 150 },
  ...extra,
});

const stubFetch = (reply: Response) => {
  const calls: FetchCall[] = [];
  vi.stubGlobal("fetch", async (url: string | URL, init?: RequestInit) => {
    calls.push({
      url: String(url),
      init: init ?? {},
      body: JSON.parse(String(init?.body)),
    });
    return reply;
  });
  return calls;
};

const request = {
  instructions: "Be terse.",
  content: [
    { kind: "pdf" as const, fileName: "a.pdf", base64: "QUJD" },
    { kind: "text" as const, text: "Extract." },
  ],
  output: {
    name: "thing",
    schema: { type: "object", properties: {}, additionalProperties: false },
  },
};

beforeEach(() => {
  vi.stubEnv("OPENAI_API_KEY", "sk-test");
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("generateJson", () => {
  it("posts to the provider with the bearer key from the environment", async () => {
    const calls = stubFetch(jsonResponse(200, responsesApiReply("{}")));

    await generateJson(request);

    expect(calls[0].url).toBe("https://api.openai.com/v1/responses");
    expect(
      (calls[0].init.headers as Record<string, string>)["Authorization"],
    ).toBe("Bearer sk-test");
    expect(calls[0].body.model).toBe("gpt-5-mini");
  });

  it("maps neutral content parts onto provider input parts, PDFs at low detail", async () => {
    const calls = stubFetch(jsonResponse(200, responsesApiReply("{}")));

    await generateJson(request);

    const system = calls[0].body.input.find(
      (item: { role: string }) => item.role === "system",
    );
    const user = calls[0].body.input.find(
      (item: { role: string }) => item.role === "user",
    );
    expect(system.content).toBe("Be terse.");
    expect(user.content).toEqual([
      {
        type: "input_file",
        filename: "a.pdf",
        file_data: "data:application/pdf;base64,QUJD",
        detail: "low",
      },
      { type: "input_text", text: "Extract." },
    ]);
  });

  it("requests strict JSON output with the caller's schema and name", async () => {
    const calls = stubFetch(jsonResponse(200, responsesApiReply("{}")));

    await generateJson(request);

    expect(calls[0].body.text.format).toEqual({
      type: "json_schema",
      name: "thing",
      strict: true,
      schema: request.output.schema,
    });
  });

  it("bounds the output size so a runaway reply cannot bill unbounded tokens", async () => {
    const calls = stubFetch(jsonResponse(200, responsesApiReply("{}")));

    await generateJson(request);

    expect(calls[0].body.max_output_tokens).toBeGreaterThan(0);
  });

  it("returns the parsed JSON from the output text", async () => {
    stubFetch(jsonResponse(200, responsesApiReply('{"answer":42}')));

    await expect(generateJson(request)).resolves.toEqual({ answer: 42 });
  });

  it("logs token usage for cost tracking", async () => {
    stubFetch(jsonResponse(200, responsesApiReply("{}")));

    await generateJson(request);

    expect(console.log).toHaveBeenCalledWith(
      expect.stringMatching(/usage/i),
      expect.objectContaining({
        model: "gpt-5-mini",
        input_tokens: 120,
        output_tokens: 30,
      }),
    );
  });

  it("throws with the provider error message on a non-OK status", async () => {
    stubFetch(jsonResponse(401, { error: { message: "Invalid API key" } }));

    await expect(generateJson(request)).rejects.toThrow(/Invalid API key/);
  });

  it("throws LlmOutputTooLongError when the reply was cut at the token limit", async () => {
    stubFetch(
      jsonResponse(
        200,
        responsesApiReply('{"rows":[{"amo', {
          status: "incomplete",
          incomplete_details: { reason: "max_output_tokens" },
        }),
      ),
    );

    await expect(generateJson(request)).rejects.toBeInstanceOf(
      LlmOutputTooLongError,
    );
  });

  it("throws LlmRefusedError when the model refuses", async () => {
    stubFetch(
      jsonResponse(200, {
        status: "completed",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [{ type: "refusal", refusal: "I can't help with that." }],
          },
        ],
      }),
    );

    await expect(generateJson(request)).rejects.toBeInstanceOf(LlmRefusedError);
  });

  it("throws when the reply carries no output text", async () => {
    stubFetch(jsonResponse(200, { status: "completed", output: [] }));

    await expect(generateJson(request)).rejects.toThrow(/no output text/);
  });

  it("throws LlmNotConfiguredError without calling the provider when no key is set", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const calls = stubFetch(jsonResponse(200, responsesApiReply("{}")));

    await expect(generateJson(request)).rejects.toBeInstanceOf(
      LlmNotConfiguredError,
    );
    expect(calls).toHaveLength(0);
  });
});

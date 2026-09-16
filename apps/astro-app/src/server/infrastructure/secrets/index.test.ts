import { readSecret } from "./index";

const NAME = "SECRETS_TEST_KEY";

afterEach(() => {
  vi.unstubAllEnvs();
  delete process.env[NAME];
  delete (import.meta.env as Record<string, unknown>)[NAME];
});

describe("readSecret", () => {
  it("reads from process.env (Workers runtime, Node)", () => {
    process.env[NAME] = "from-process";

    expect(readSecret(NAME)).toBe("from-process");
  });

  it("falls back to import.meta.env (Astro dev .env)", () => {
    delete process.env[NAME];
    (import.meta.env as Record<string, unknown>)[NAME] = "from-vite";

    expect(readSecret(NAME)).toBe("from-vite");
  });

  it("returns undefined for an empty or missing value", () => {
    process.env[NAME] = "";

    expect(readSecret(NAME)).toBeUndefined();
  });
});

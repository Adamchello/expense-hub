import type { Page } from "@playwright/test";

const TEST_USER = {
  email: process.env.E2E_USER_EMAIL ?? "e2e@test.com",
  password: process.env.E2E_USER_PASSWORD ?? "e2e-test-pass-123",
};

export async function loginAs(page: Page) {
  await page.request.post("/api/auth/signin", {
    form: {
      email: TEST_USER.email,
      password: TEST_USER.password,
    },
  });
}

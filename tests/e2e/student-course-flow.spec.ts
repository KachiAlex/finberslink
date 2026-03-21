import { expect, test } from "@playwright/test";

const STUDENT_EMAIL = process.env.E2E_STUDENT_EMAIL ?? "student@finberslink.com";
const STUDENT_PASSWORD = process.env.E2E_STUDENT_PASSWORD ?? "student123!";

test.describe("Student course flow", () => {
  test("student can resume a course and start a lesson", async ({ page, request }) => {
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
    const baseOrigin = new URL(baseUrl).origin;

    const loginResponse = await request.post("/api/auth/login", {
      data: { email: STUDENT_EMAIL, password: STUDENT_PASSWORD },
    });

    expect(await loginResponse.ok()).toBeTruthy();

    const storageState = await request.storageState();
    const enrichedCookies = storageState.cookies.map((cookie) => {
      if (cookie.domain) {
        return {
          ...cookie,
          path: cookie.path ?? "/",
        };
      }

      return {
        ...cookie,
        path: cookie.path ?? "/",
        url: baseOrigin,
      };
    });
    await page.context().addCookies(enrichedCookies);

    await page.goto("/dashboard");

    await expect(page.getByText("Student workspace")).toBeVisible();

    const continueLink = page.getByRole("link", { name: /^Continue$/i }).first();
    await expect(continueLink).toBeVisible();
    await continueLink.click();

    await expect(page).toHaveURL(/\/courses\//);
    await expect(page.getByRole("heading", { name: /Course overview/i })).toBeVisible();

    const startLessonLink = page.getByRole("link", { name: /start lesson/i }).first();
    await expect(startLessonLink).toBeVisible();

    await Promise.all([
      page.waitForURL("**/courses/**/lessons/**", { timeout: 30_000 }),
      startLessonLink.click(),
    ]);

    await expect(page.getByRole("heading", { name: /Resources/i })).toBeVisible();
    await expect(page.locator("iframe").first()).toBeVisible();
    await expect(page.getByText(/Available now/i)).toBeVisible();
  });
});

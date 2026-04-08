import { expect, test } from "@playwright/test";

const STUDENT_EMAIL = process.env.E2E_STUDENT_EMAIL ?? "student@finberslink.com";
const STUDENT_PASSWORD = process.env.E2E_STUDENT_PASSWORD ?? "student123!";

test.describe("Student course flow", () => {
  test("student can resume a course and start a lesson", async ({ page, request }) => {
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
    const baseOrigin = new URL(baseUrl).origin;
    const secureForOrigin = baseOrigin.startsWith("https://");

    // Perform API login and set cookies directly in the browser context
    const loginRes = await request.post(`${baseOrigin}/api/auth/login`, {
      data: JSON.stringify({ email: STUDENT_EMAIL, password: STUDENT_PASSWORD }),
      headers: { 'Content-Type': 'application/json' },
    });

    expect(loginRes.ok()).toBeTruthy();

    const headers = loginRes.headers();
    let accessToken = headers['x-dev-access-token'] || headers['X-Dev-Access-Token'];
    let refreshToken = headers['x-dev-refresh-token'] || headers['X-Dev-Refresh-Token'];

    if (!accessToken || !refreshToken) {
      const json = await loginRes.json().catch(() => ({}));
      accessToken = accessToken || json?.tokens?.accessToken;
      refreshToken = refreshToken || json?.tokens?.refreshToken;
    }

    if (!accessToken || !refreshToken) {
      const setCookie = headers['set-cookie'] || headers['Set-Cookie'] || '';
      const accessMatch = setCookie.match(/access_token=([^;]+)/);
      const refreshMatch = setCookie.match(/refresh_token=([^;]+)/);
      accessToken = accessToken || accessMatch?.[1] || "";
      refreshToken = refreshToken || refreshMatch?.[1] || "";
    }

    if (!accessToken || !refreshToken) {
      throw new Error(`Could not obtain auth tokens from login response. Headers: ${JSON.stringify(headers)}`);
    }

    const domain = new URL(baseOrigin).hostname;
    // Set cookies directly in the browser context so subsequent navigations include them
    await page.context().addCookies([
      { name: 'access_token', value: accessToken, domain, path: '/' },
      { name: 'refresh_token', value: refreshToken, domain, path: '/' },
    ]);
    await page.goto(`${baseOrigin}/`, { waitUntil: 'load' });

    // Inspect cookies stored in the browser context (debug)
    const stored = await page.context().cookies();
    console.log('playwright-context-cookies:', JSON.stringify(stored));

    // Also call the debug API from the page to see if cookies are sent on client fetch
    const debugFromPage = await page.evaluate(async () => {
      const res = await fetch('/api/debug/session', { method: 'GET', credentials: 'same-origin' });
      try { return { status: res.status, body: await res.json() }; } catch (e) { return { status: res.status, body: await res.text() }; }
    });
    console.log('debug-from-page:', JSON.stringify(debugFromPage));

    // Navigate to dashboard with cookies set
    await page.goto(`${baseOrigin}/dashboard`, { waitUntil: 'load' });

    // Target the visible page heading to avoid matching decorative labels
    await expect(page.getByRole('heading', { name: /Student (workspace|Hub)/i }).first()).toBeVisible({ timeout: 15000 });

    // Match either "Continue" or "Continue learning" buttons/links
    const continueLink = page.getByRole("link", { name: /Continue( learning)?/i }).first();
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

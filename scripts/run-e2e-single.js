const { chromium } = require('playwright');

(async () => {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  try {
    const loginRes = await fetch(baseUrl + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: process.env.E2E_STUDENT_EMAIL || 'student@finberslink.com', password: process.env.E2E_STUDENT_PASSWORD || 'student123!' }),
    });

    console.log('login status', loginRes.status);
    const setCookie = loginRes.headers.get('set-cookie') || '';

    const accessMatch = setCookie.match(/access_token=([^;]+)/);
    const refreshMatch = setCookie.match(/refresh_token=([^;]+)/);
    const accessToken = accessMatch ? accessMatch[1] : null;
    const refreshToken = refreshMatch ? refreshMatch[1] : null;

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: baseUrl });

    const cookies = [];
    if (accessToken) cookies.push({ name: 'access_token', value: accessToken, url: baseUrl, path: '/', httpOnly: true, secure: false });
    if (refreshToken) cookies.push({ name: 'refresh_token', value: refreshToken, url: baseUrl, path: '/', httpOnly: true, secure: false });

    if (cookies.length) {
      await context.addCookies(cookies);
      console.log('added cookies');
    } else {
      console.log('no cookies parsed from login');
    }

    const page = await context.newPage();
    const r = await page.goto(baseUrl + '/dashboard', { waitUntil: 'networkidle' });
    console.log('goto status', r && r.status());

    const visible = await page.getByText('Student workspace').isVisible().catch(() => false);
    console.log('Student workspace visible?', visible);

    if (!visible) {
      const shot = 'run-e2e-failure.png';
      await page.screenshot({ path: shot, fullPage: true });
      console.log('Saved screenshot to', shot);
    }

    await browser.close();
    process.exit(visible ? 0 : 2);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

// Debug script: POST to /api/auth/login, log Set-Cookie headers, then GET /dashboard with cookies
// Usage: PLAYWRIGHT_BASE_URL=http://localhost:3000 node scripts/debug-e2e-login.js

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const loginUrl = `${baseUrl}/api/auth/login`;
const dashboardUrl = `${baseUrl}/dashboard/resumes`;
const email = process.env.E2E_STUDENT_EMAIL || 'student@finberslink.com';
const password = process.env.E2E_STUDENT_PASSWORD || 'student123!';

async function run() {
  console.log('Logging in to', loginUrl);
  const loginRes = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    redirect: 'manual',
  });

  console.log('Login status:', loginRes.status);
  console.log('Login status:', loginRes.status);

  // Try to read Set-Cookie headers first
  const setCookies = [];
  for (const [k, v] of loginRes.headers.entries()) {
    if (k.toLowerCase() === 'set-cookie') setCookies.push(v);
  }

  // Fallback: server may expose tokens in dev-only headers (`x-dev-access-token`)
  let cookieHeader = '';
  if (setCookies.length > 0) {
    console.log('Set-Cookie headers:', setCookies);
    cookieHeader = setCookies.map(c => c.split(';')[0]).join('; ');
  } else {
    const accessHeader = loginRes.headers.get('x-dev-access-token');
    const refreshHeader = loginRes.headers.get('x-dev-refresh-token');
    if (accessHeader && refreshHeader) {
      console.log('Dev tokens present in headers; using them to build Cookie header');
      cookieHeader = `access_token=${accessHeader}; refresh_token=${refreshHeader}`;
    } else {
      // Try to parse JSON body for tokens as a final fallback
      try {
        const json = await loginRes.json();
        if (json?.tokens?.accessToken && json?.tokens?.refreshToken) {
          console.log('Dev tokens present in response body; using them');
          cookieHeader = `access_token=${json.tokens.accessToken}; refresh_token=${json.tokens.refreshToken}`;
        }
      } catch (err) {
        // ignore
      }
    }
  }

  console.log('Cookie header to send:', cookieHeader);

  console.log('Fetching dashboard with cookies...');
  const dashRes = await fetch(dashboardUrl, {
    method: 'GET',
    headers: {
      Cookie: cookieHeader,
    },
    redirect: 'manual',
  });

  console.log('Dashboard fetch status:', dashRes.status);
  const location = dashRes.headers.get('location');
  console.log('Dashboard response headers:');
  for (const [k,v] of dashRes.headers.entries()) console.log(`  ${k}: ${v}`);
  if (location) console.log('Dashboard redirected to:', location);
  else console.log('Dashboard response URL:', dashRes.url);

  const text = await dashRes.text();
  console.log('Dashboard response snippet:', text.slice(0, 1000));

  // Also call debug API to verify server-side token verification
  try {
    const debugRes = await fetch(`${baseUrl}/api/debug/session`, {
      method: 'GET',
      headers: { Cookie: cookieHeader },
      redirect: 'manual',
    });
    console.log('Debug API status:', debugRes.status);
    const debugJson = await debugRes.json();
    console.log('Debug API response:', JSON.stringify(debugJson, null, 2));
  } catch (err) {
    console.error('Error calling debug API:', err);
  }
}

run().catch(err => {
  console.error('Error in debug script:', err);
  process.exit(1);
});

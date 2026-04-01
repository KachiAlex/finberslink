const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';
const email = process.env.E2E_STUDENT_EMAIL || 'student@finberslink.com';
const password = process.env.E2E_STUDENT_PASSWORD || 'student123!';

async function run() {
  try {
    console.log('Using baseUrl:', baseUrl);
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      redirect: 'manual',
    });

    console.log('Login status:', loginRes.status);

    const setCookieHeader = loginRes.headers.get('set-cookie');
    if (setCookieHeader) {
      console.log('Set-Cookie header present');
      const cookieHeader = setCookieHeader.split(',').map(s => s.split(';')[0]).join('; ');
      console.log('Built Cookie header:', cookieHeader);

      const dashRes = await fetch(`${baseUrl}/dashboard/resumes`, {
        method: 'GET',
        headers: { Cookie: cookieHeader },
        redirect: 'manual',
      });
      console.log('Dashboard status:', dashRes.status);
      const dashText = await dashRes.text();
      console.log('Dashboard snippet:', dashText.slice(0, 400));

      const debugRes = await fetch(`${baseUrl}/api/debug/session`, {
        method: 'GET',
        headers: { Cookie: cookieHeader },
        redirect: 'manual',
      });
      console.log('Debug API status:', debugRes.status);
      try {
        const debugJson = await debugRes.json();
        console.log('Debug API body:', JSON.stringify(debugJson, null, 2));
      } catch (e) {
        console.log('Debug API body non-json');
      }
    } else {
      console.log('No Set-Cookie header returned from login. Headers:');
      for (const [k, v] of loginRes.headers.entries()) console.log(`  ${k}: ${v}`);
      const text = await loginRes.text();
      console.log('Login response body snippet:', text.slice(0, 400));
    }
  } catch (err) {
    console.error('Error during verification:', err);
    process.exitCode = 1;
  }
}

run();

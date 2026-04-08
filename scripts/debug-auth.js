(async () => {
  try {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const payload = { email: 'smoke+test@local.invalid', password: 'Password123!', firstName: 'Smoke', lastName: 'Tester', role: 'STUDENT' };

    console.log('POST', `${baseUrl}/api/auth/register`);
    const reg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('register status', reg.status);
    const regText = await reg.text();
    console.log('register body:', regText);

    if (!reg.ok) {
      console.log('Trying login...');
      const login = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: payload.email, password: payload.password }),
      });
      console.log('login status', login.status);
      console.log('login body:', await login.text());
    }
  } catch (e) {
    console.error('fetch error', e);
  }
})();

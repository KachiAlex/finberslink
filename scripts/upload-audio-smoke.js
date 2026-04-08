import fs from 'fs';

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const email = 'smoke+test@local.invalid';
const password = 'Password123!';
const sessionId = process.env.SESSION_ID || 'cmnifucov0002r8ehpkes8tix';
const questionId = process.env.QUESTION_ID || 'cmnifucyv0003r8ehf1fuz7un';

async function run() {
  // ensure smoke.wav exists
  const wavData = Buffer.from('U01PS0VfVEVTVA==', 'base64');
  fs.writeFileSync('smoke.wav', wavData);

  // try register first (idempotent for this smoke user)
  const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, firstName: 'Smoke', lastName: 'Tester', role: 'STUDENT' }),
  });

  let authRes = registerRes;
  if (!registerRes.ok) {
    // if already exists, try login
    authRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  }

  if (!authRes.ok) {
    console.error('Auth failed', authRes.status, await authRes.text());
    process.exit(1);
  }

  const setCookie = authRes.headers.get('set-cookie') || '';
  const cookiePairs = setCookie
    .split(/,(?=\s*\w+=)/)
    .map((s) => s.split(';')[0])
    .join('; ');

  console.log('Cookies:', cookiePairs);

  // build form
  const form = new FormData();
  form.append('questionId', questionId);
  form.append('file', fs.createReadStream('smoke.wav'), 'smoke.wav');

  const uploadRes = await fetch(`${baseUrl}/api/interview-sessions/${sessionId}/responses/audio`, {
    method: 'POST',
    headers: {
      Cookie: cookiePairs,
    },
    body: form,
  });

  const text = await uploadRes.text();
  console.log('Upload status', uploadRes.status);
  console.log(text);

  // fetch session
  const sessionRes = await fetch(`${baseUrl}/api/interview-sessions/${sessionId}`, {
    method: 'GET',
    headers: { Cookie: cookiePairs },
  });
  console.log('Session status', sessionRes.status);
  console.log(await sessionRes.text());

  fs.unlinkSync('smoke.wav');
}

run().catch((e) => {
  console.error('Script error', e);
  process.exit(1);
});

const fetch = require('node-fetch');

(async function(){
  const login = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({email: 'student@finberslink.com', password: 'student123!'})
  });
  console.log('login status', login.status);
  const setCookie = login.headers.get('set-cookie');
  const cookieHeader = setCookie ? setCookie.split(',').map(s=>s.split(';')[0]).join('; ') : '';
  const res = await fetch('http://localhost:3001/api/resume', {
    method: 'POST',
    headers: {'Content-Type':'application/json', Cookie: cookieHeader},
    body: JSON.stringify({ title: 'Test Resume', notableAchievements: 'Test achievement' })
  });
  console.log('create resume status', res.status);
  console.log('body:', await res.text());
})();
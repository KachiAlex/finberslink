const http = require('http');

const url = 'http://localhost:3000/';

(async function(){
  try {
    const res = await new Promise((resolve, reject) => {
      const req = http.get(url, (res) => {
        resolve({ statusCode: res.statusCode, headers: res.headers });
      });
      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.abort();
        reject(new Error('Timeout'));
      });
    });
    console.log('OK', JSON.stringify(res));
    process.exit(0);
  } catch (err) {
    console.error('ERR', err.message || err);
    process.exit(2);
  }
})();

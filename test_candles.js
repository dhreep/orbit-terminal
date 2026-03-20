import http from 'http';

async function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTest() {
  console.log('1. Setting dummy Alpha Vantage key...');
  await request('/api/market/session/keys', 'POST', { provider: 'alpha_vantage', apiKey: 'INVALID_AV_KEY' });
  
  console.log('2. Running candles for TSLA...');
  const result = await request('/api/market/candles/TSLA');
  console.log('Status:', result.status);
  console.log('Body:', JSON.stringify(result.body, null, 2).substring(0, 1000));
}

runTest();

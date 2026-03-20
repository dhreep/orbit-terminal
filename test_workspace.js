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
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTest() {
  // 1. Save a workspace with a ticker
  const testWs = {
    layout: 'grid',
    slots: [
      { id: 0, ticker: 'TSLA', chartMode: 'candle', thesis: 'Test thesis' },
      { id: 1, ticker: null, chartMode: 'candle', thesis: '' },
      { id: 2, ticker: null, chartMode: 'candle', thesis: '' },
      { id: 3, ticker: null, chartMode: 'candle', thesis: '' },
    ],
    updatedAt: new Date().toISOString(),
  };

  console.log('1. Saving workspace...');
  const saveResult = await request('/api/workspace', 'PUT', testWs);
  console.log('   Status:', saveResult.status, 'Success:', saveResult.body.success);

  // 2. Reload it
  console.log('2. Loading workspace...');
  const loadResult = await request('/api/workspace');
  console.log('   Status:', loadResult.status);
  const loaded = loadResult.body.data;
  console.log('   Slot 0 ticker:', loaded?.slots?.[0]?.ticker);
  console.log('   Slot 0 thesis:', loaded?.slots?.[0]?.thesis);
  console.log('   Layout:', loaded?.layout);

  // 3. Verify match
  const matches = loaded?.slots?.[0]?.ticker === 'TSLA' && loaded?.layout === 'grid';
  console.log('3. Save/Reload:', matches ? '✅ PASS' : '❌ FAIL');
}

runTest();

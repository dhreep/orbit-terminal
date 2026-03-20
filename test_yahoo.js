// Test Alpha Vantage OVERVIEW function for fundamentals
async function test() {
  const ticker = 'AAPL';

  // Get AV key from the running server session
  try {
    const sessionRes = await fetch('http://localhost:3001/api/market/session/check');
    const session = await sessionRes.json();
    console.log('Session keys:', session.data);
  } catch(e) { console.log('Session check err:', e.message); }
  
  // Test AV OVERVIEW function via similar direct approach
  // We'll call through the server since it has the key
  console.log('\n=== Direct test of AV OVERVIEW ===');
  try {
    // First get the key from server memory
    const r = await fetch('http://localhost:3001/api/market/rate-status');
    const d = await r.json();
    console.log('Rate status:', d.data);
  } catch(e) { console.log(e.message); }

  // Test via another free API: coinpaprika (crypto only, not useful)
  // Let's test Financial Modeling Prep with the user's key directly
  console.log('\n=== Test FMP profile directly ===');
  try {
    const r = await fetch(`http://localhost:3001/api/market/fundamentals/${ticker}`);
    const d = await r.json();
    console.log('Success:', d.success);
    console.log('Data:', JSON.stringify(d.data, null, 2));
  } catch(e) { console.log(e.message); }
}

test();

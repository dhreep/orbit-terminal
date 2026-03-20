import http from 'http';

function testSearch() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/market/search?q=TSLA',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.end();
}

testSearch();

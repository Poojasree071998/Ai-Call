const http = require('http');
const querystring = require('querystring');

async function trigger(path, data) {
  const postData = querystring.stringify(data);
  const options = {
    hostname: '127.0.0.1',
    port: 5050,
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function simulate() {
  console.log('--- 🚀 FIC LIVE FIRE TEST: MISSION START ---');
  const callSid = 'LIVE_TEST_' + Date.now();
  
  try {
    // 1. Initial Call (Registers ID)
    console.log('Step 1: Customer Dials FIC Main Number...');
    await trigger('/api/calls/incoming', {
      CallSid: callSid,
      From: '+919876543210',
      To: '+13203141838'
    });

    // 2. Select SBI (Option 2)
    console.log('Step 2: Customer selects "SBI SQUAD" (Option 2)...');
    const result = await trigger('/api/calls/menu-selection', {
      CallSid: callSid,
      Digits: '2', // SBI
      From: '+919876543210'
    });

    console.log('\n--- 🛰️  SATELLITE RESULTS ---');
    console.log(result);

    if (result.includes('enqueue')) {
      console.log('\n🌟 MISSION SUCCESS: Call is LIVE on your Dashboard!');
      console.log('Please check your Employee Dashboard under the "SBI" tab.');
    } else if (result.includes('Connecting')) {
      console.log('\n📞 SUCCESS: System found a Free SBI Agent and is dialing them!');
    } else {
      console.log('\n⚠️  Alert: Routing completed, but check logs for details.');
    }
  } catch (err) {
    console.error('❌ MISSION FAILED:', err.message);
  }
}

simulate();

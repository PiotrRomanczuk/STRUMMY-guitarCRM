import express from 'express';

const app = express();
app.use(express.json());

const PORT = 4000;
const TARGET = 'http://localhost:3000';
const API_KEY = process.argv.includes('--key')
  ? process.argv[process.argv.indexOf('--key') + 1]
  : process.env.API_KEY;

if (!API_KEY) {
  console.error('Error: API key required. Use API_KEY env var or --key flag.');
  console.error('  API_KEY=gcrm_xxx npm run test:api-server');
  console.error('  npx tsx scripts/api-test-server.ts --key gcrm_xxx');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

async function proxy(
  method: string,
  path: string,
  body?: Record<string, unknown>
) {
  const url = `${TARGET}${path}`;
  const start = Date.now();

  console.log(`\n→ ${method} ${url}`);
  if (body) console.log('  Body:', JSON.stringify(body, null, 2));

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  const ms = Date.now() - start;

  console.log(`← ${res.status} (${ms}ms)`);
  console.log('  Response:', JSON.stringify(data, null, 2));

  return { status: res.status, data, ms };
}

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    target: TARGET,
    keyPrefix: API_KEY.slice(0, 8) + '...',
  });
});

app.get('/test-auth', async (_req, res) => {
  try {
    const result = await proxy('GET', '/api/external/songs?limit=3');
    res.status(result.status).json(result.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Proxy error:', message);
    res.status(502).json({ error: 'Failed to reach Next.js server', message });
  }
});

app.post('/create-song', async (req, res) => {
  try {
    const body = req.body && Object.keys(req.body).length > 0
      ? req.body
      : {
          title: `Express Test Song ${Date.now()}`,
          author: 'API Test',
          level: 'beginner',
          key: 'Am',
        };

    const result = await proxy('POST', '/api/external/songs', body);
    res.status(result.status).json(result.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Proxy error:', message);
    res.status(502).json({ error: 'Failed to reach Next.js server', message });
  }
});

app.listen(PORT, () => {
  console.log(`\nAPI Test Server running on http://localhost:${PORT}`);
  console.log(`Target: ${TARGET}`);
  console.log(`API Key: ${API_KEY.slice(0, 8)}...`);
  console.log('\nEndpoints:');
  console.log('  GET  /health       — Server status');
  console.log('  GET  /test-auth    — Validate API key (fetches songs)');
  console.log('  POST /create-song  — Create a song (optional JSON body)');
});

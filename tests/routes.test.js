const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

const app = require('../server');

let server;
let base;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

test.after(() => {
  server.close();
});

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(base + path);
    const req = http.request(
      url,
      { method: options.method || 'GET', headers: options.headers || {} },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }
    );
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

test('GET / renders Japanese by default', async () => {
  const res = await request('/');
  assert.strictEqual(res.status, 200);
  assert.match(res.body, /プロンプトの達人になろう/);
});

test('GET / renders English when lang query is en', async () => {
  const res = await request('/?lang=en');
  assert.match(res.body, /Become a Prompt Master/);
});

test('GET /quests/:id returns quest detail', async () => {
  const res = await request('/quests/summarize-log');
  assert.strictEqual(res.status, 200);
  assert.match(res.body, /エラーログを要約せよ/);
});

test('GET /quests/:unknown returns 404', async () => {
  const res = await request('/quests/does-not-exist');
  assert.strictEqual(res.status, 404);
});

test('GET /lang/en sets a cookie and redirects', async () => {
  const res = await request('/lang/en?redirect=/quests');
  assert.strictEqual(res.status, 302);
  assert.match(String(res.headers['set-cookie']), /lang=en/);
  assert.strictEqual(res.headers.location, '/quests');
});

test('GET /lang ignores non-local redirect (open redirect guard)', async () => {
  const res = await request('/lang/en?redirect=https://evil.example.com');
  assert.strictEqual(res.headers.location, '/');
});

test('POST /api/evaluate rejects empty prompt', async () => {
  const res = await request('/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questId: 'summarize-log', prompt: '  ' })
  });
  assert.strictEqual(res.status, 400);
  assert.match(res.body, /empty_prompt/);
});

test('POST /api/evaluate rejects unknown quest', async () => {
  const res = await request('/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questId: 'nope', prompt: 'hello' })
  });
  assert.strictEqual(res.status, 404);
});

// Contract tests for the GEO auditor. No dependencies: node --test tests/
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';

const run = promisify(execFile);
const CLI = path.resolve(import.meta.dirname, '../skills/geo-readiness/scripts/geo-audit.mjs');

const RICH = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Curing polyurethane insulation in Neuquén | Humedan</title>
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[
  {"@type":"Organization","name":"Humedan","sameAs":["https://www.instagram.com/humedan","https://www.linkedin.com/company/humedan"]},
  {"@type":"WebPage","name":"Polyurethane"}
]}
</script></head><body><main>
<h1>Curing polyurethane insulation</h1>
<p>${'Polyurethane foam reaches handling strength after 24 hours and full cure after 7 days at 20 degrees. '.repeat(12)}</p>
<table><tr><th>Thickness</th><th>Cure</th></tr><tr><td>30 mm</td><td>24 h</td></tr></table>
<blockquote>Humidity above 80 percent doubles the cure window.</blockquote>
<p>Source: <a href="https://example.com/standard">application standard</a>.</p>
</main></body></html>`;

const THIN = `<!doctype html><html><head><title>App</title></head><body><div id="root"></div><script>render()</script></body></html>`;

const LIMITED = `<!doctype html><html><head><title>Limited</title>
<meta name="bingbot" content="noarchive">
<meta name="robots" content="noindex"></head><body><main><p>${'Indexable prose goes here. '.repeat(20)}</p></main></body></html>`;

let base;
let server;

before(async () => {
  const routes = new Map();
  server = createServer((req, res) => {
    const body = routes.get(new URL(req.url, 'http://localhost').pathname);
    if (!body) {
      res.writeHead(404, { 'content-type': 'text/html' }).end('<title>Not found</title>');
      return;
    }
    res.writeHead(200, { 'content-type': body.type }).end(body.data);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;

  routes.set('/', { type: 'text/html', data: RICH });
  routes.set('/thin', { type: 'text/html', data: THIN });
  routes.set('/limited', { type: 'text/html', data: LIMITED });
  routes.set('/llms.txt', { type: 'text/plain', data: '# Humedan\n' });
  routes.set('/robots.txt', {
    type: 'text/plain',
    data: 'User-agent: *\nAllow: /\n\nUser-agent: OAI-SearchBot\nDisallow: /\n\nSitemap: ' + base + '/sitemap.xml\n',
  });
  routes.set('/sitemap.xml', {
    type: 'application/xml',
    data: `<?xml version="1.0"?><urlset><url><loc>${base}/</loc></url><url><loc>${base}/thin</loc></url></urlset>`,
  });
});

after(() => server.close());

test('rich page reports content, entity and bot access', async () => {
  const { stdout } = await run(process.execPath, [CLI, `${base}/`]);
  assert.match(stdout, /tables 1/);
  assert.match(stdout, /quotes 1/);
  assert.match(stdout, /sources 1/);
  assert.match(stdout, /entity Organization, WebPage \| sameAs 2/);
  assert.match(stdout, /OAI-SearchBot:block/);
  assert.match(stdout, /Googlebot:allow/);
  assert.match(stdout, /llms.txt present \(informational/);
});

test('a client-rendered page shows thin server HTML', async () => {
  const { stdout } = await run(process.execPath, [CLI, `${base}/thin`]);
  const words = Number((stdout.match(/html (\d+) words/) || [])[1]);
  assert.ok(words < 10, `expected a thin page, got ${words} words`);
});

test('bing directives are reported as citation limits', async () => {
  const { stdout } = await run(process.execPath, [CLI, `${base}/limited`]);
  assert.match(stdout, /bing meta noarchive: excluded from Copilot answers/);
  assert.match(stdout, /robots meta: noindex/);
});

test('sitemap input audits every loc', async () => {
  const { stdout } = await run(process.execPath, [CLI, `${base}/sitemap.xml`]);
  assert.match(stdout, /2 page\(s\)/);
  assert.match(stdout, new RegExp(`${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/thin`));
});

test('json output is machine readable', async () => {
  const { stdout } = await run(process.execPath, [CLI, `${base}/`, '--json']);
  const rows = JSON.parse(stdout);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].status, 200);
  assert.equal(rows[0].tables, 1);
  assert.equal(rows[0].sameAs.length, 2);
  assert.equal(rows[0].bots['OAI-SearchBot'], false);
  assert.equal(rows[0].llmsTxt, true);
});

test('an unreachable page fails the run', async () => {
  await assert.rejects(run(process.execPath, [CLI, `${base}/nope`]), (error) => {
    assert.equal(error.code, 1);
    assert.match(error.stdout, /1 unreachable/);
    return true;
  });
});

test('no arguments exits 2', async () => {
  await assert.rejects(run(process.execPath, [CLI]), (error) => {
    assert.equal(error.code, 2);
    return true;
  });
});

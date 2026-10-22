// Contract tests for the SEO auditor. No dependencies: node --test tests/
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';

const run = promisify(execFile);
const CLI = path.resolve(import.meta.dirname, '../skills/seo-on-page/scripts/audit.mjs');

const TITLE = 'Astro components for content-heavy marketing sites · Acme';
const DESC =
  'Build content-heavy sites with island architecture, zero JavaScript by default, and a component model that stays out of your way when you ship.';

const page = (base, route, title, desc) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${base}${route}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${base}${route}">
<meta property="og:image" content="${base}/og.png">
<meta property="og:image:alt" content="Acme logo on a dark background">
<meta name="twitter:card" content="summary_large_image">
</head><body><main><h1>Astro components</h1></main></body></html>`;

let base;
let server;

before(async () => {
  const routes = new Map();
  server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const body = routes.get(url.pathname);
    if (!body) {
      res.writeHead(404, { 'content-type': 'text/html' }).end('<title>Not found</title>');
      return;
    }
    res.writeHead(200, { 'content-type': body.type }).end(body.data);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;

  const ok = (route, title = TITLE, desc = DESC) => ({ type: 'text/html', data: page(base, route, title, desc) });
  routes.set('/', ok('/'));
  routes.set('/docs', ok('/docs', 'Docs for content-heavy marketing sites built in Astro · Acme', DESC.replace('Build', 'Ship')));
  routes.set('/dup', ok('/dup'));
  routes.set('/moved', {
    type: 'text/html',
    data: page('https://example.com', '/elsewhere', TITLE, DESC).replace('https://example.com/og.png', `${base}/og.png`),
  });
  routes.set('/prod', {
    type: 'text/html',
    data: page('https://example.com', '/prod', TITLE, DESC).replace('https://example.com/og.png', `${base}/og.png`),
  });
  routes.set('/bad', { type: 'text/html', data: '<title>Short</title><link rel="canonical" href="/x"><h1>a</h1><h1>b</h1>' });
  routes.set('/og.png', { type: 'image/png', data: 'png' });
  routes.set('/sitemap.xml', {
    type: 'application/xml',
    data: `<?xml version="1.0"?><urlset><url><loc>${base}/</loc></url><url><loc>${base}/docs</loc></url></urlset>`,
  });
  routes.set('/sitemap-index.xml', {
    type: 'application/xml',
    data: `<?xml version="1.0"?><sitemapindex><sitemap><loc>${base}/sitemap.xml</loc></sitemap><sitemap><loc>${base}/sitemap.xml</loc></sitemap></sitemapindex>`,
  });
  routes.set('/sitemap-dup.xml', {
    type: 'application/xml',
    data: `<?xml version="1.0"?><urlset><url><loc>${base}/</loc></url><url><loc>${base}/dup</loc></url></urlset>`,
  });
});

after(() => server.close());

test('a well-formed page passes', async () => {
  const { stdout } = await run(process.execPath, [CLI, `${base}/`]);
  assert.match(stdout, /OK\s+.*title:57 desc:143/);
  assert.match(stdout, /1\/1 routes OK/);
});

test('a sitemap of clean pages passes', async () => {
  const { stdout } = await run(process.execPath, [CLI, `${base}/sitemap.xml`]);
  assert.match(stdout, /2\/2 routes OK/);
});

test('a sitemap index is followed to its pages, each audited once', async () => {
  const { stdout } = await run(process.execPath, [CLI, `${base}/sitemap-index.xml`]);
  assert.match(stdout, /2\/2 routes OK/);
  assert.doesNotMatch(stdout, /sitemap\.xml\s+\[/);
});

test('a canonical on another host fails unless --ignore-host compares the path', async () => {
  await assert.rejects(run(process.execPath, [CLI, `${base}/prod`]), (error) => {
    assert.match(error.stdout, /canonical points elsewhere/);
    return true;
  });
  const { stdout } = await run(process.execPath, [CLI, `${base}/prod`, '--ignore-host']);
  assert.match(stdout, /1\/1 routes OK/);
});

test('--ignore-host still fails a canonical on another path', async () => {
  await assert.rejects(run(process.execPath, [CLI, `${base}/moved`, '--ignore-host']), (error) => {
    assert.match(error.stdout, /canonical points elsewhere/);
    return true;
  });
});

test('a broken page fails with the specific reasons', async () => {
  await assert.rejects(run(process.execPath, [CLI, `${base}/bad`]), (error) => {
    assert.equal(error.code, 1);
    assert.match(error.stdout, /title too short/);
    assert.match(error.stdout, /missing description/);
    assert.match(error.stdout, /canonical is relative/);
    assert.match(error.stdout, /2 h1/);
    return true;
  });
});

test('duplicate titles across pages fail', async () => {
  await assert.rejects(run(process.execPath, [CLI, `${base}/sitemap-dup.xml`]), (error) => {
    assert.equal(error.code, 1);
    assert.match(error.stdout, /duplicate title/);
    return true;
  });
});

test('a 404 fails', async () => {
  await assert.rejects(run(process.execPath, [CLI, `${base}/nope`]), (error) => {
    assert.match(error.stdout, /status 404/);
    return true;
  });
});

test('no arguments exits 2', async () => {
  await assert.rejects(run(process.execPath, [CLI]), (error) => {
    assert.equal(error.code, 2);
    return true;
  });
});

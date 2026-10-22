#!/usr/bin/env node
// GEO readiness audit: crawler access, server-rendered content, citable evidence, entity signals.
// Usage: node geo-audit.mjs <url|sitemap.xml> [...] [--json]
//
// Exit 1 only when a page cannot be fetched. The counts are reported, never scored:
// whether a page is citable is a human call, and the skill requires that call to
// carry an evidence label.

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const inputs = args.filter((a) => !a.startsWith('-'));

if (inputs.length === 0) {
  console.error('Usage: node geo-audit.mjs <url|sitemap.xml> [...] [--json]');
  process.exit(2);
}

const BOTS = ['Googlebot', 'OAI-SearchBot', 'bingbot', 'PerplexityBot', 'Claude-SearchBot'];
const UA = 'Mozilla/5.0 (compatible; geo-audit/1.0; +https://github.com/lucasvidela94/skills)';

const decode = (s) => s.replace(/&amp;/g, '&');

function parseRobots(text) {
  const groups = [];
  let group = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const at = line.indexOf(':');
    if (at === -1) continue;
    const key = line.slice(0, at).trim().toLowerCase();
    const value = line.slice(at + 1).trim();
    if (key === 'user-agent') {
      if (!group || group.rules.length) {
        group = { agents: [], rules: [] };
        groups.push(group);
      }
      if (value) group.agents.push(value.toLowerCase());
    } else if ((key === 'allow' || key === 'disallow') && group) {
      group.rules.push({ allow: key === 'allow', path: value });
    }
  }
  return groups;
}

// robots.txt paths are prefixes unless they contain * or a trailing $.
function ruleMatches(path, pattern) {
  if (!pattern) return false;
  const anchored = pattern.endsWith('$');
  const clean = anchored ? pattern.slice(0, -1) : pattern;
  let at = 0;
  for (const part of clean.split('*')) {
    const hit = path.indexOf(part, at);
    if (hit === -1) return false;
    at = hit + part.length;
  }
  return anchored ? at === path.length : true;
}

function allowedBy(groups, bot, path) {
  const name = bot.toLowerCase();
  const scoreOf = (agent) => (agent === '*' ? 0 : name.includes(agent) ? agent.length : -1);

  // Only the most specific matching group applies: a named bot beats `*`.
  let best = -1;
  for (const group of groups) {
    for (const agent of group.agents) best = Math.max(best, scoreOf(agent));
  }
  if (best < 0) return true;

  const rules = groups
    .filter((group) => group.agents.some((agent) => scoreOf(agent) === best))
    .flatMap((group) => group.rules)
    .filter((rule) => ruleMatches(path, rule.path));

  if (rules.length === 0) return true;
  rules.sort((a, b) => b.path.length - a.path.length || (a.allow ? -1 : 1));
  return rules[0].allow;
}

const stripTags = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function nodesOf(data) {
  const list = Array.isArray(data) ? data : [data];
  return list.flatMap((node) => {
    if (!node || typeof node !== 'object') return [];
    return [node, ...(Array.isArray(node['@graph']) ? node['@graph'] : [])];
  });
}

function analyse(html) {
  const text = stripTags(html);
  const types = new Set();
  const sameAs = new Set();

  for (const block of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data;
    try {
      data = JSON.parse(block[1]);
    } catch {
      continue;
    }
    for (const node of nodesOf(data)) {
      for (const type of [].concat(node['@type'] ?? [])) types.add(type);
      for (const url of [].concat(node.sameAs ?? [])) sameAs.add(url);
    }
  }

  const bingMeta = (html.match(/<meta[^>]+name=["']bingbot["'][^>]*content=["']([^"']*)["']/i) || [])[1] || '';
  const robotsMeta = (html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["']/i) || [])[1] || '';

  return {
    words: text ? text.split(' ').length : 0,
    tables: (html.match(/<table[\s>]/gi) || []).length,
    quotes: (html.match(/<blockquote[\s>]/gi) || []).length,
    numbers: (text.match(/\b\d[\d.,]*\b/g) || []).length,
    sources: new Set(
      [...html.matchAll(/<a[^>]+href=["'](https?:\/\/[^"']+)["']/gi)].map((m) => m[1]),
    ).size,
    types: [...types],
    sameAs: [...sameAs],
    bing: /noarchive/i.test(bingMeta) ? 'noarchive' : /nocache/i.test(bingMeta) ? 'nocache' : '',
    noindex: /noindex/i.test(robotsMeta),
  };
}

const MAX_SITEMAP_DEPTH = 3;

// A sitemap index lists child sitemaps, not pages: follow it instead of auditing the XML.
async function urlsFrom(input, depth = 0) {
  if (!/\.xml(\?|$)/i.test(input)) return [input];
  const res = await fetch(input, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`sitemap ${input} -> ${res.status}`);
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => decode(m[1]));
  if (!/<sitemapindex[\s>]/i.test(xml)) return locs;
  if (depth >= MAX_SITEMAP_DEPTH) throw new Error(`sitemap ${input} nests more than ${MAX_SITEMAP_DEPTH} levels`);
  const children = await Promise.all(locs.map((loc) => urlsFrom(loc, depth + 1)));
  return [...new Set(children.flat())];
}

const cache = new Map();
function once(key, load) {
  if (!cache.has(key)) cache.set(key, load());
  return cache.get(key);
}

const robotsFor = (origin) =>
  once(`robots:${origin}`, async () => {
    try {
      const res = await fetch(`${origin}/robots.txt`, { headers: { 'user-agent': UA } });
      if (!res.ok) return { missing: true, groups: [] };
      return { missing: false, groups: parseRobots(await res.text()) };
    } catch {
      return { missing: true, groups: [] };
    }
  });

const llmsFor = (origin) =>
  once(`llms:${origin}`, async () => {
    try {
      const res = await fetch(`${origin}/llms.txt`, { headers: { 'user-agent': UA } });
      return res.ok;
    } catch {
      return false;
    }
  });

const urls = (await Promise.all(inputs.map(urlsFrom))).flat();
const results = [];
let failed = 0;

for (const url of urls) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA } });
    const origin = new URL(url).origin;
    const { groups, missing } = await robotsFor(origin);
    const html = await res.text();
    const facts = analyse(html);

    const bots = Object.fromEntries(
      BOTS.map((bot) => [bot, missing || allowedBy(groups, bot, new URL(url).pathname)]),
    );

    if (!res.ok) failed++;
    results.push({ url, status: res.status, ok: res.ok, robotsMissing: missing, ...facts, bots, llmsTxt: await llmsFor(origin) });
  } catch (error) {
    failed++;
    results.push({ url, status: '-', ok: false, error: String(error.message || error), bots: {}, llmsTxt: false });
  }
}

if (asJson) {
  console.log(JSON.stringify(results, null, 2));
  process.exit(failed ? 1 : 0);
}

for (const r of results) {
  const lines = [`${r.ok ? 'OK  ' : 'FAIL'} ${r.url}  [${r.status}]`];
  if (r.error) {
    lines.push(`     ${r.error}`);
    console.log(lines.join('\n'));
    continue;
  }
  lines.push(
    `     html ${r.words} words | tables ${r.tables} | quotes ${r.quotes} | sources ${r.sources} | numbers ${r.numbers}`,
  );
  lines.push(`     entity ${r.types.length ? r.types.join(', ') : 'none'} | sameAs ${r.sameAs.length}`);
  if (r.noindex) lines.push('     robots meta: noindex on a page that should be citable');
  if (r.bing) {
    lines.push(
      `     bing meta ${r.bing}: ${
        r.bing === 'noarchive' ? 'excluded from Copilot answers' : 'citation reduced to url, title and snippet'
      }`,
    );
  }
  lines.push(`     bots ${BOTS.map((bot) => `${bot}:${r.bots[bot] ? 'allow' : 'block'}`).join(' ')}`);
  if (r.robotsMissing) lines.push('     robots.txt: missing, every bot is allowed');
  lines.push(`     llms.txt ${r.llmsTxt ? 'present (informational, Google ignores it)' : 'absent (optional)'}`);
  console.log(lines.join('\n'));
}

const blocked = results.filter((r) => r.ok && BOTS.some((bot) => !r.bots[bot])).length;
console.log(`\n${results.length} page(s), ${failed} unreachable, ${blocked} with a blocked bot`);
process.exit(failed ? 1 : 0);

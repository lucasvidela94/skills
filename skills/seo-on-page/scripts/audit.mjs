#!/usr/bin/env node
// Audits a site's head tags and indexable URLs.
// Usage: node audit.mjs <url> [url...]   |   node audit.mjs <sitemap.xml>
// Exits 1 when any route fails.

const inputs = process.argv.slice(2).filter((a) => !a.startsWith('-'));
if (inputs.length === 0) {
  console.error('Usage: node audit.mjs <url|sitemap.xml> [...]');
  process.exit(2);
}

const LIMITS = { title: [50, 60], desc: [140, 160] };

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const pick = (html, ...patterns) => {
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decode(m[1]).trim();
  }
  return '';
};

// Matches a meta tag by name or property, in either attribute order.
const meta = (html, key, attr = 'property') =>
  pick(
    html,
    new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*${attr}=["']${key}["']`, 'i'),
  );

const MAX_SITEMAP_DEPTH = 3;

// A sitemap index lists child sitemaps, not pages: follow it instead of auditing the XML.
async function urlsFrom(input, depth = 0) {
  if (!/\.xml(\?|$)/i.test(input)) return [input];
  const res = await fetch(input);
  if (!res.ok) throw new Error(`sitemap ${input} -> ${res.status}`);
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => decode(m[1]));
  if (!/<sitemapindex[\s>]/i.test(xml)) return locs;
  if (depth >= MAX_SITEMAP_DEPTH) throw new Error(`sitemap ${input} nests more than ${MAX_SITEMAP_DEPTH} levels`);
  const children = await Promise.all(locs.map((loc) => urlsFrom(loc, depth + 1)));
  return [...new Set(children.flat())];
}

function inspect(html) {
  return {
    title: pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    desc: meta(html, 'description', 'name'),
    canonical: pick(html, /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i),
    ogUrl: meta(html, 'og:url'),
    ogImage: meta(html, 'og:image'),
    ogImageAlt: meta(html, 'og:image:alt'),
    robots: meta(html, 'robots', 'name'),
    h1: (html.match(/<h1[\s>]/gi) || []).length,
  };
}

const abs = (u) => {
  try {
    return new URL(u).toString();
  } catch {
    return null;
  }
};

async function imageOk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const type = res.headers.get('content-type') || '';
    if (!res.ok) return `og:image ${res.status}`;
    if (!type.startsWith('image/')) return `og:image content-type ${type}`;
    return null;
  } catch {
    return 'og:image does not resolve';
  }
}

function audit(url, d, state) {
  const fails = [];
  const [tMin, tMax] = LIMITS.title;
  const [dMin, dMax] = LIMITS.desc;
  const canon = abs(d.canonical);
  const self = abs(url);

  // A value repeated across pages is the shape of generated filler.
  const unique = (kind, map, value) => {
    const prev = map.get(value);
    if (prev && prev !== url) fails.push(`duplicate ${kind} (also ${prev})`);
    map.set(value, url);
  };

  if (!d.title) fails.push('missing title');
  else if (d.title.length < tMin) fails.push(`title too short (${d.title.length})`);
  else if (d.title.length > tMax) fails.push(`title too long (${d.title.length})`);
  else unique('title', state.titles, d.title);

  if (!d.desc) fails.push('missing description');
  else if (d.desc.length < dMin) fails.push(`description too short (${d.desc.length})`);
  else if (d.desc.length > dMax) fails.push(`description too long (${d.desc.length})`);
  else unique('description', state.descs, d.desc);

  if (!d.canonical) fails.push('missing canonical');
  else if (!canon) fails.push(`canonical is relative (${d.canonical})`);
  else {
    if (self && canon !== self) fails.push(`canonical points elsewhere (${canon})`);
    unique('canonical', state.canonicals, canon);
  }

  if (!d.ogUrl) fails.push('missing og:url');
  else if (canon && abs(d.ogUrl) !== canon) fails.push('og:url != canonical');

  if (!d.ogImage) fails.push('missing og:image');
  else if (!abs(d.ogImage)) fails.push('og:image is relative');
  if (!d.ogImageAlt) fails.push('missing og:image:alt');

  if (/noindex/i.test(d.robots)) fails.push('noindex on an indexable URL');
  if (d.h1 !== 1) fails.push(`${d.h1} h1`);

  return fails;
}

const urls = (await Promise.all(inputs.map(urlsFrom))).flat();
const state = { canonicals: new Map(), titles: new Map(), descs: new Map() };
let bad = 0;
const rows = [];

for (const url of urls) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const d = inspect(html);
    const fails = res.ok ? audit(url, d, state) : [`status ${res.status}`];

    if (d.ogImage && abs(d.ogImage)) {
      const imgFail = await imageOk(d.ogImage);
      if (imgFail) fails.push(imgFail);
    }
    if (fails.length) bad++;

    rows.push({ url, status: res.status, title: d.title.length, desc: d.desc.length, fails });
  } catch (error) {
    bad++;
    rows.push({ url, status: '-', title: '-', desc: '-', fails: [String(error.message || error)] });
  }
}

for (const r of rows) {
  console.log(`\n${r.fails.length ? 'FAIL' : 'OK  '} ${r.url}  [${r.status}] title:${r.title} desc:${r.desc}`);
  for (const f of r.fails) console.log(`      - ${f}`);
}

console.log(`\n${rows.length - bad}/${rows.length} routes OK`);
process.exit(bad ? 1 : 0);

#!/usr/bin/env node
// Mechanical gate for this repo. Runs on every push and on pre-commit.
// Usage: node scripts/validate.mjs [repo-root]

import { readFile, readdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] ?? path.join(import.meta.dirname, '..'));
const errors = [];
const fail = (msg) => errors.push(msg);
const rel = (p) => path.relative(ROOT, p);

const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_LINES = 500;
const MIN_DESC = 80;
const MAX_DESC = 1024;
// Shorter sentences repeat by accident ("Run the suite."); longer ones repeat a meaning.
const MIN_DUP = 60;
const SLOP = [
  /\bTODO\b/,
  /\bTBD\b/,
  /\bFIXME\b/,
  /lorem ipsum/i,
  /\bplaceholder text\b/i,
  /\bas an AI\b/i,
  /\binsert .{0,20}here\b/i,
];

function parseFrontmatter(md, file) {
  const match = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) {
    fail(`${file}: missing YAML frontmatter`);
    return { data: {}, body: md };
  }
  const data = {};
  let key = null;
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([a-zA-Z][\w-]*):\s*(.*)$/);
    if (pair) {
      key = pair[1];
      data[key] = pair[2].replace(/^[>|][-+]?$/, '').trim();
    } else if (key && /^\s+\S/.test(line)) {
      data[key] = `${data[key]} ${line.trim()}`.trim();
    }
  }
  return { data, body: md.slice(match[0].length) };
}

// Fenced examples are content, not structure: keep them out of the checks.
const stripFences = (md) => md.replace(/```[\s\S]*?```/g, '');

async function listFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listFiles(full)));
    else out.push(full);
  }
  return out;
}

// Links resolve against the file that holds them; backticked `references/…`
// paths against the skill folder; a bare `name.md` against either. A command
// in a fenced block (`node scripts/audit.mjs`) reaches its script too.
async function pointers(file, raw, dir) {
  const prose = stripFences(raw);
  const found = [];
  for (const m of raw.matchAll(/(?:^|[\s`(])((?:scripts|references|assets)\/[\w./-]*\w)/gm)) {
    const target = path.join(dir, m[1]);
    if (await exists(target)) found.push(target);
  }
  for (const m of prose.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|#)/.test(href)) continue;
    const target = path.join(path.dirname(file), href.split('#')[0]);
    if (await exists(target)) found.push(target);
    else fail(`${rel(file)}: broken link ${href}`);
  }
  for (const m of prose.matchAll(/`((?:scripts|references|assets)\/[^`\s]+)`/g)) {
    const target = path.join(dir, m[1]);
    if (await exists(target)) found.push(target);
    else fail(`${rel(file)}: missing file ${m[1]}`);
  }
  for (const m of prose.matchAll(/`([\w.-]+\.(?:md|mjs|js|json))`/g)) {
    for (const base of [path.dirname(file), dir]) {
      const target = path.join(base, m[1]);
      if (await exists(target)) {
        found.push(target);
        break;
      }
    }
  }
  return found;
}

const sentences = (prose) =>
  prose
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*`]/g, '')
    .split(/\n|(?<=[.!?])\s+/)
    .map((s) =>
      s
        .replace(/^[\s>#|-]*(\d+\.\s*)?/, '')
        .replace(/[\s.!?:;|]+$/, '')
        .replace(/\s+/g, ' ')
        .toLowerCase(),
    )
    .filter((s) => s.length >= MIN_DUP);

// A skill named in prose must ship here or carry a link to where it lives.
function checkSkillRefs(file, prose, skills) {
  for (const line of prose.split(/\r?\n/)) {
    const names = [
      ...[...line.matchAll(/`([a-z0-9]+(?:-[a-z0-9]+)*)` skills?\b/g)].map((m) => m[1]),
      // `/admin` in a table of routes is a URL path; a command is run or named as one.
      ...[...line.matchAll(/(?:\b(?:run|use|invoke)s?\s+|\bthe\s+\w*\s*)`\/([a-z0-9]+(?:-[a-z0-9]+)*)`/gi)].map((m) => m[1]),
      ...[...line.matchAll(/`\/([a-z0-9]+(?:-[a-z0-9]+)*)`\s+(?:command|skill)/g)].map((m) => m[1]),
    ];
    for (const name of names) {
      if (skills.includes(name) || /https?:\/\//.test(line)) continue;
      fail(`${rel(file)}: "${name}" is not in this repo; link its source on the same line`);
    }
  }
}

async function checkTree(dir, skills) {
  const files = await listFiles(dir);
  const md = new Map();
  for (const file of files.filter((f) => f.endsWith('.md'))) {
    md.set(file, await readFile(file, 'utf8'));
  }

  // Every file must be reachable from SKILL.md, or no run of the skill ever reads it.
  const reached = new Set([path.join(dir, 'SKILL.md')]);
  const queue = [...reached];
  while (queue.length) {
    const file = queue.shift();
    if (!md.has(file)) continue;
    for (const target of await pointers(file, md.get(file), dir)) {
      if (reached.has(target)) continue;
      reached.add(target);
      queue.push(target);
    }
  }
  for (const file of files) {
    if (!reached.has(file)) fail(`${rel(file)}: orphan, no pointer from SKILL.md reaches it`);
  }

  // One meaning, one place.
  const seen = new Map();
  for (const [file, raw] of md) {
    const prose = stripFences(raw);
    checkSkillRefs(file, prose, skills);
    for (const sentence of sentences(prose)) {
      const first = seen.get(sentence);
      if (first) fail(`duplicated sentence in ${rel(first)} and ${rel(file)}: "${sentence.slice(0, 80)}"`);
      else seen.set(sentence, file);
    }
  }
}

async function checkSkill(dir, skills) {
  const name = path.basename(dir);
  const file = path.join(dir, 'SKILL.md');
  let md;
  try {
    md = await readFile(file, 'utf8');
  } catch {
    fail(`${rel(file)}: missing`);
    return;
  }

  if (!NAME.test(name)) fail(`${name}: folder name must be kebab-case`);

  const { data, body } = parseFrontmatter(md, rel(file));
  if (data.name !== name) fail(`${rel(file)}: name "${data.name}" != folder "${name}"`);

  const desc = data.description || '';
  if (desc.length < MIN_DESC) fail(`${rel(file)}: description too short (${desc.length})`);
  if (desc.length > MAX_DESC) fail(`${rel(file)}: description too long (${desc.length})`);
  if (!/\buse when\b/i.test(desc)) fail(`${rel(file)}: description needs a "Use when ..." trigger branch`);

  const lines = md.split(/\r?\n/).length;
  if (lines > MAX_LINES) fail(`${rel(file)}: ${lines} lines, cap is ${MAX_LINES}`);

  const prose = stripFences(body);

  const h1 = prose.match(/^# .+$/gm) || [];
  if (h1.length !== 1) fail(`${rel(file)}: expected exactly one H1, found ${h1.length}`);

  for (const pattern of SLOP) {
    if (pattern.test(prose)) fail(`${rel(file)}: slop marker ${pattern}`);
  }

  await checkTree(dir, skills);
}

const exists = async (p) => {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
};

async function checkScripts(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') await checkScripts(full);
      continue;
    }
    if (!entry.name.endsWith('.mjs')) continue;
    try {
      execFileSync(process.execPath, ['--check', full], { stdio: 'pipe' });
    } catch (error) {
      fail(`${rel(full)}: syntax error\n${error.stderr}`);
    }
  }
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    fail(`${rel(file)}: ${error.message}`);
    return null;
  }
}

async function checkManifests(skills) {
  const plugin = await readJson(path.join(ROOT, '.claude-plugin/plugin.json'));
  const market = await readJson(path.join(ROOT, '.claude-plugin/marketplace.json'));
  if (!market) return;

  if (!market.name || !market.owner?.name) fail('.claude-plugin/marketplace.json: needs name and owner.name');
  if (!Array.isArray(market.plugins) || market.plugins.length === 0) {
    fail('.claude-plugin/marketplace.json: needs a non-empty plugins array');
    return;
  }

  for (const entry of market.plugins) {
    if (!entry.name || !entry.source) {
      fail(`.claude-plugin/marketplace.json: plugin "${entry.name}" needs name and source`);
      continue;
    }
    if (!NAME.test(entry.name)) fail(`.claude-plugin/marketplace.json: plugin name "${entry.name}" must be kebab-case`);
    const source = path.resolve(ROOT, entry.source);
    if (!(await exists(source))) {
      fail(`.claude-plugin/marketplace.json: source "${entry.source}" does not exist`);
      continue;
    }
    const listed = (await readdir(path.join(source, 'skills')).catch(() => []));
    if (listed.length === 0) fail(`.claude-plugin/marketplace.json: "${entry.source}" has no skills/ folder`);
    if (plugin && plugin.name !== entry.name) {
      fail(`plugin.json name "${plugin.name}" != marketplace entry "${entry.name}"`);
    }
  }

  if (plugin && !plugin.description) fail('.claude-plugin/plugin.json: needs a description');

  const readme = await readFile(path.join(ROOT, 'README.md'), 'utf8').catch(() => '');
  for (const skill of skills) {
    if (!readme.includes(skill)) fail(`README.md: skill "${skill}" is not listed`);
  }
}

async function main() {
  const skillsDir = path.join(ROOT, 'skills');
  const entries = await readdir(skillsDir, { withFileTypes: true }).catch(() => []);
  const skills = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  if (skills.length === 0) fail('skills/: no skills found');
  if (new Set(skills).size !== skills.length) fail('skills/: duplicate skill folders');

  for (const skill of skills) {
    await checkSkill(path.join(skillsDir, skill), skills);
  }

  await checkScripts(path.join(ROOT, 'scripts'));
  await checkScripts(path.join(ROOT, 'tests'));
  for (const skill of skills) await checkScripts(path.join(skillsDir, skill));
  await checkManifests(skills);

  if (errors.length) {
    console.error(`validate: ${errors.length} problem(s)\n`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  console.log(`validate: ${skills.length} skill(s) OK — ${skills.join(', ')}`);
}

await main();

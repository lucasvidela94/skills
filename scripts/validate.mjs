#!/usr/bin/env node
// Mechanical gate for this repo. Runs on every push and on pre-commit.
// Usage: node scripts/validate.mjs

import { readFile, readdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const errors = [];
const fail = (msg) => errors.push(msg);
const rel = (p) => path.relative(ROOT, p);

const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_LINES = 500;
const MIN_DESC = 80;
const MAX_DESC = 1024;
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

async function checkSkill(dir) {
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

  // Fenced examples are content, not structure: keep them out of the checks.
  const prose = body.replace(/```[\s\S]*?```/g, '');

  const h1 = prose.match(/^# .+$/gm) || [];
  if (h1.length !== 1) fail(`${rel(file)}: expected exactly one H1, found ${h1.length}`);

  for (const pattern of SLOP) {
    if (pattern.test(prose)) fail(`${rel(file)}: slop marker ${pattern}`);
  }

  // Relative links and backticked paths must resolve, or they rot.
  for (const m of prose.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|#)/.test(href)) continue;
    const target = path.join(dir, href.split('#')[0]);
    if (!(await exists(target))) fail(`${rel(file)}: broken link ${href}`);
  }
  for (const m of prose.matchAll(/`((?:scripts|references|assets)\/[^`\s]+)`/g)) {
    const target = path.join(dir, m[1]);
    if (!(await exists(target))) fail(`${rel(file)}: missing file ${m[1]}`);
  }
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
    await checkSkill(path.join(skillsDir, skill));
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

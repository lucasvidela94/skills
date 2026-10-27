// Integrity of the useful-tests evidence: rows, levels, citations, and counts agree.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const ROOT = path.resolve(import.meta.dirname, '..');
const SKILL = path.join(ROOT, 'skills/useful-tests');
const LEVELS = /^(Measured|Practical experience|Opinion)\b/;

const read = (file) => readFile(file, 'utf8');
const stripFences = (md) => md.replace(/```[\s\S]*?```/g, '');

async function skillDocs() {
  const docs = new Map([['SKILL.md', await read(path.join(SKILL, 'SKILL.md'))]]);
  for (const name of await readdir(path.join(SKILL, 'references'))) {
    if (name.endsWith('.md')) docs.set(`references/${name}`, await read(path.join(SKILL, 'references', name)));
  }
  return docs;
}

// Source rows are the table lines that start with a number: | 12 | [title](url) | ... | Level |
async function rows() {
  const md = await read(path.join(SKILL, 'references/evidence.md'));
  return md
    .split('\n')
    .filter((line) => /^\| \d+ \|/.test(line))
    .map((line) => {
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      return { id: Number(cells[0]), source: cells[1], level: cells.at(-1), line };
    });
}

test('sources are numbered 1..N with no gaps or repeats', async () => {
  const ids = (await rows()).map((r) => r.id);
  assert.ok(ids.length > 0, 'no source rows found in evidence.md');
  assert.deepEqual(ids, ids.map((_, i) => i + 1));
});

test('every source has a link and a known evidence level', async () => {
  for (const row of await rows()) {
    assert.match(row.source, /\]\(https?:\/\/[^)]+\)/, `row ${row.id} has no link`);
    assert.match(row.level, LEVELS, `row ${row.id} level "${row.level}"`);
  }
});

test('every bracketed citation points to an existing source', async () => {
  const max = (await rows()).length;
  for (const [file, md] of await skillDocs()) {
    for (const m of stripFences(md).matchAll(/\[(\d+(?:,\s*\d+)*)\](?!\()/g)) {
      for (const n of m[1].split(/,\s*/).map(Number)) {
        assert.ok(n >= 1 && n <= max, `${file} cites [${n}], evidence.md has ${max} sources`);
      }
    }
  }
});

test('every "N sources" claim matches the table', async () => {
  const max = (await rows()).length;
  const docs = await skillDocs();
  docs.set('README.md', await read(path.join(ROOT, 'README.md')));
  let claims = 0;
  for (const [file, md] of docs) {
    for (const m of md.matchAll(/\b(\d+) sources\b/g)) {
      claims += 1;
      assert.equal(Number(m[1]), max, `${file} claims ${m[1]} sources, evidence.md has ${max}`);
    }
  }
  assert.ok(claims > 0, 'no "N sources" claim found; the README and SKILL.md should state the count');
});

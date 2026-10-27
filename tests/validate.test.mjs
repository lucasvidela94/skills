// Contract tests for the repo gate: each rule must go red on the defect it exists for.
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const run = promisify(execFile);
const CLI = path.resolve(import.meta.dirname, '../scripts/validate.mjs');

const SKILL = `---
name: demo
description: Demo skill for the validator contract tests. Use when checking that the gate passes a clean skill and fails a broken one.
---

# Demo

Read [the guide](references/guide.md) before starting.
`;

const GUIDE = `# Guide

The guide explains one thing, once, and links nowhere else.
`;

// A clean repo with one skill; each test overrides the files it breaks.
async function repo(files = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'validate-'));
  const all = {
    '.claude-plugin/plugin.json': JSON.stringify({ name: 'skills', description: 'Demo' }),
    '.claude-plugin/marketplace.json': JSON.stringify({
      name: 'demo',
      owner: { name: 'Demo' },
      plugins: [{ name: 'skills', source: './' }],
    }),
    'README.md': '# Skills\n\n- demo\n',
    'skills/demo/SKILL.md': SKILL,
    'skills/demo/references/guide.md': GUIDE,
    ...files,
  };
  for (const [file, data] of Object.entries(all)) {
    if (data === null) continue;
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), data);
  }
  await mkdir(path.join(root, 'scripts'), { recursive: true });
  await mkdir(path.join(root, 'tests'), { recursive: true });
  return root;
}

async function validate(files) {
  const root = await repo(files);
  try {
    const { stdout } = await run(process.execPath, [CLI, root]);
    return { code: 0, out: stdout };
  } catch (error) {
    return { code: error.code, out: error.stderr };
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('a clean skill passes', async () => {
  const { code, out } = await validate();
  assert.equal(code, 0, out);
});

test('a reference file no pointer reaches fails as an orphan', async () => {
  const { code, out } = await validate({ 'skills/demo/references/lost.md': '# Lost\n\nNobody links here.\n' });
  assert.equal(code, 1);
  assert.match(out, /references\/lost\.md: orphan/);
});

test('a file reached only through another reference is not an orphan', async () => {
  const { code, out } = await validate({
    'skills/demo/references/guide.md': `${GUIDE}\nThe details are in \`deep.md\`.\n`,
    'skills/demo/references/deep.md': '# Deep\n\nReached from the guide.\n',
  });
  assert.equal(code, 0, out);
});

test('a broken link inside a reference file fails', async () => {
  const { code, out } = await validate({
    'skills/demo/references/guide.md': `${GUIDE}\nSee [missing](missing.md).\n`,
  });
  assert.equal(code, 1);
  assert.match(out, /references\/guide\.md: broken link missing\.md/);
});

test('the same sentence in two files fails as duplication', async () => {
  const twice = 'The expected value comes from the requirement and never from the code under test.';
  const { code, out } = await validate({
    'skills/demo/SKILL.md': `${SKILL}\n${twice}\n`,
    'skills/demo/references/guide.md': `${GUIDE}\n${twice}\n`,
  });
  assert.equal(code, 1);
  assert.match(out, /duplicated sentence/);
});

test('a pointer to a skill outside the repo needs a link on the same line', async () => {
  const bare = await validate({ 'skills/demo/SKILL.md': `${SKILL}\nRun the \`ghost-skill\` skill first.\n` });
  assert.equal(bare.code, 1);
  assert.match(bare.out, /"ghost-skill" is not in this repo/);

  const linked = await validate({
    'skills/demo/SKILL.md': `${SKILL}\nRun the \`ghost-skill\` skill first ([source](https://example.com/ghost-skill)).\n`,
  });
  assert.equal(linked.code, 0, linked.out);
});

test('a slash command outside the repo needs a link on the same line', async () => {
  const { code, out } = await validate({ 'skills/demo/SKILL.md': `${SKILL}\nThen run \`/ghost-command\`.\n` });
  assert.equal(code, 1);
  assert.match(out, /"ghost-command" is not in this repo/);
});

test('a script run from a fenced command is reached', async () => {
  const { code, out } = await validate({
    'skills/demo/SKILL.md': `${SKILL}\n\`\`\`bash\nnode scripts/check.mjs https://site.com/\n\`\`\`\n`,
    'skills/demo/scripts/check.mjs': 'console.log("ok");\n',
  });
  assert.equal(code, 0, out);
});

test('a URL path in a routes table is not a slash command', async () => {
  const { code, out } = await validate({
    'skills/demo/SKILL.md': `${SKILL}\n| Route | Indexed |\n| --- | --- |\n| \`/admin\` | no |\n`,
  });
  assert.equal(code, 0, out);
});

test('a pointer to a skill in the repo passes without a link', async () => {
  const { code, out } = await validate({
    'skills/demo/SKILL.md': `${SKILL}\nThe \`demo\` skill can call itself.\n`,
  });
  assert.equal(code, 0, out);
});

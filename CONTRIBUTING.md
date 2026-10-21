# Contributing

One skill per folder under `skills/`, kebab-case, with a `SKILL.md` that has
`name` and `description` frontmatter.

## Before a PR

```bash
node scripts/validate.mjs   # structure, frontmatter, links, slop markers, manifests
node --test tests/*.test.mjs          # auditor contract tests
```

Both run in CI on every push.

## What the validator expects

- `name` in the frontmatter equals the folder name, and is kebab-case
- the description is 80–1024 characters and names the branches that should fire
  it (`Use when ...`), because the description is the only thing the agent sees
  before deciding to load the skill
- exactly one `H1`, under 500 lines
- every relative link and every backticked `scripts/…` path resolves
- no `TODO`, `TBD`, `FIXME`, `lorem ipsum`, or placeholder text
- the skill appears in `README.md`

Scripts in a skill should be runnable with plain `node` and no install step.
Anything with a network contract gets a test under `tests/`.

## Commits

Present tense, one concern per commit. The pre-commit hook runs the validator:

```bash
git config core.hooksPath .githooks
```

<div align="center">
  <h3>Agent skills</h3>
  <p>Portable skills for Claude Code, Codex, OpenCode and Cursor.<br>
  One folder per skill, no runtime, and a CI gate instead of good intentions.</p>
  <p>
    <a href="https://github.com/lucasvidela94/skills/actions/workflows/ci.yml"><img src="https://github.com/lucasvidela94/skills/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/lucasvidela94/skills?color=8FAE8B&labelColor=1b1b1b" alt="license"></a>
    <a href="https://skills.sh/lucasvidela94/skills"><img src="https://skills.sh/b/lucasvidela94/skills" alt="skills.sh"></a>
  </p>
</div>

## Install

```bash
npx skills add lucasvidela94/skills -g
```

The CLI asks which skills and which agents to install to. Add `--list` to see
what is in the repo first, or install one skill into one agent:

```bash
npx skills add lucasvidela94/skills --list
npx skills add lucasvidela94/skills --skill seo-on-page -a claude-code -g
```

### Claude Code plugin marketplace

Inside Claude Code, register the repo once, then install the plugin:

```
/plugin marketplace add lucasvidela94/skills
/plugin install skills@lucasvidela94
```

Skills arrive namespaced (`/skills:seo-on-page`) and update with the marketplace.

### Manual

Copy the folder you want into your agent's skills directory:

```bash
cp -R skills/seo-on-page ~/.claude/skills/        # Claude Code
cp -R skills/seo-on-page ~/.config/opencode/skills/  # OpenCode
```

## Skills

| Skill | What it does | Ships |
| --- | --- | --- |
| [seo-on-page](skills/seo-on-page/SKILL.md) | On-page SEO pass over a site: per-page title and meta description, canonicals, OG images, semantic HTML, a real 404, robots.txt, llms.txt, and the sitemap. | [`scripts/audit.mjs`](skills/seo-on-page/scripts/audit.mjs) |

### seo-on-page

An eight-step pass with a checkable exit per step. The spine is the canonical:
every page declares which URL owns it, and the sitemap, robots, OG tags and 404
either respect that or contradict it.

The auditor checks a single URL or a whole sitemap and exits non-zero on any
failure, so it drops into CI as-is:

```bash
node skills/seo-on-page/scripts/audit.mjs https://example.com/
node skills/seo-on-page/scripts/audit.mjs https://example.com/sitemap.xml
```

It verifies status, title and description length, self-referencing canonical,
`og:url` matching the canonical, `og:image` reachable as an image, `og:image:alt`,
`noindex`, `h1` count, and repeated titles, descriptions or canonicals across
pages.

## The gate

Every push runs `node scripts/validate.mjs`, `node --test tests/*.test.mjs`, and a real
install of the repo with the skills CLI. The validator refuses a skill that:

- has no `SKILL.md`, or a frontmatter `name` that differs from its folder
- has a description shorter than 80 characters or without a `Use when` trigger
- has zero or several `H1`s, or runs past 500 lines
- links to a file that does not exist
- carries slop markers (`TODO`, `TBD`, `FIXME`, `lorem ipsum`, placeholder text)
- ships a `.mjs` that does not parse
- is missing from this README

The manifests are checked too: every marketplace entry resolves to a folder with
a `skills/` directory, and its name matches `plugin.json`. Run the same gate
locally with `node scripts/validate.mjs`, or once via
`git config core.hooksPath .githooks` on every commit.

## Layout

```text
skills/<skill-name>/
  SKILL.md          # frontmatter + instructions
  scripts/          # optional, referenced from SKILL.md
.claude-plugin/     # Claude Code plugin + marketplace manifests
scripts/validate.mjs
tests/
```

## License

MIT. See [LICENSE](LICENSE).

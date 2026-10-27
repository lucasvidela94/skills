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
| [seo-on-page](skills/seo-on-page/SKILL.md) | On-page SEO pass over a site: per-page title and meta description, canonicals, OG images, semantic HTML, a real 404, robots.txt, optional llms.txt, and the sitemap. | [`scripts/audit.mjs`](skills/seo-on-page/scripts/audit.mjs) |
| [geo-readiness](skills/geo-readiness/SKILL.md) | Audit for generative engines (GEO/AEO/LLMO): AI crawler access, server-rendered content, extractable evidence, entity corroboration, and measurement. Labels every recommendation with its evidence level. | [`scripts/geo-audit.mjs`](skills/geo-readiness/scripts/geo-audit.mjs) |

### seo-on-page

An eight-step pass with a checkable exit per step. The spine is the canonical:
every page declares which URL owns it, and the sitemap, robots, OG tags and 404
either respect that or contradict it.

The auditor checks a single URL or a whole sitemap and exits non-zero on any
failure, so it drops into CI as-is:

```bash
node skills/seo-on-page/scripts/audit.mjs https://example.com/
node skills/seo-on-page/scripts/audit.mjs https://example.com/sitemap.xml
node skills/seo-on-page/scripts/audit.mjs http://localhost:4321/ --ignore-host
```

A sitemap index is followed into its child sitemaps. `--ignore-host` compares the
canonical by path only, for a local build whose canonicals point at production.

It verifies status, title and description length, self-referencing canonical,
`og:url` matching the canonical, `og:image` reachable as an image, `og:image:alt`,
`noindex`, `h1` count, and repeated titles, descriptions or canonicals across
pages.

### geo-readiness

The follow-up question: given that the site is indexable, can a generative
engine cite it? It assumes the SEO pass and delegates there instead of repeating
canonicals and sitemaps.

The auditor reports robot access per crawler (`OAI-SearchBot`, `bingbot`,
`PerplexityBot`, `Claude-SearchBot`), server-HTML word count, tables,
blockquotes, outbound sources, numbers, `sameAs` entries, and Bing
`noarchive`/`nocache` directives:

```bash
node skills/geo-readiness/scripts/geo-audit.mjs https://example.com/
node skills/geo-readiness/scripts/geo-audit.mjs https://example.com/sitemap.xml --json
```

Counts are a floor, not a score: whether a page is citable is a human call, and
the report has to carry an evidence label (strong, moderate, weak) next to every
recommendation. The skill opens by sending you to `seo-on-page` when its
auditor does not pass.

## The gate

Every push runs `node scripts/validate.mjs`, `node --test tests/*.test.mjs`, and a real
install of the repo with the skills CLI. The validator refuses a skill that:

- has no `SKILL.md`, or a frontmatter `name` that differs from its folder
- has a description shorter than 80 characters or without a `Use when` trigger
- has zero or several `H1`s, or runs past 500 lines
- links to a file that does not exist, from `SKILL.md` or from any reference
- ships a file no pointer from `SKILL.md` reaches, directly or through a reference
- repeats a sentence of 60+ characters, within a file or across its files
- names a skill or slash command that is not in this repo without linking its source on the same line
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

## Research

[research/geo-aeo-llmo.md](research/geo-aeo-llmo.md) — what the evidence says about
GEO/AEO/LLMO, with sources, and why `llms.txt` is optional in `seo-on-page`.

## License

MIT. See [LICENSE](LICENSE).

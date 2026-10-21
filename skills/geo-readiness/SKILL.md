---
name: geo-readiness
description: Audits whether generative engines can find, cite and reuse a site's content (GEO/AEO/LLMO) — AI crawler access, server-rendered content, extractable evidence, entity corroboration, and measurement. Use when a client asks to appear in ChatGPT, AI Overviews, Copilot or Perplexity, when auditing AI visibility, or when deciding what to change after an SEO pass.
license: MIT
---

# GEO readiness

A generative answer cites a page it already retrieved. That sentence is the
skill: **retrieval is the gate, citation is the prize.** The audit works on both,
in that order, and labels every recommendation with the strength of the evidence
behind it.

Step 0 is not optional. The `seo-on-page` skill covers indexability; if its
auditor does not pass, fix that first, because nothing downstream can be cited.
This skill delegates there instead of repeating canonicals, sitemaps and 404s.

## Step 1 — Scope the question

Collect 5–10 real questions a buyer would ask, in their words, and the engines
that matter: Google AI Overviews and AI Mode, ChatGPT search, Copilot,
Perplexity. Name the business outcome (a call, a quote request, a visit to a
service page).

Generic "we want AI visibility" produces generic work. A named prompt produces a
page to fix.

**Done when** the prompt list and the engines are written down, and each prompt
maps to the page that should be the answer.

## Step 2 — Check access, not intentions

Run the auditor:

```bash
node scripts/geo-audit.mjs https://site.com/
node scripts/geo-audit.mjs https://site.com/sitemap.xml --json
```

It reports, per bot, whether robots.txt allows the page: `Googlebot`,
`OAI-SearchBot`, `bingbot`, `PerplexityBot`, `Claude-SearchBot`. Then confirm the
bots actually arrive, in server logs or Cloudflare AI Crawl Control.

Three traps:

- `GPTBot` controls training. ChatGPT search inclusion is `OAI-SearchBot`, so
  blocking the first does not remove the site from answers.
- `NOARCHIVE` on Bing excludes the content from Copilot answers.
- `NOCACHE` reduces Copilot citations to URL, title and snippet.

A block is a business decision, not a bug. State it in the report either way.

**Done when** every bot has a verdict (allowed, blocked, or never seen) backed by
a robots.txt rule or a log line.

## Step 3 — Serve the content without JavaScript

Most AI crawlers do not execute JavaScript. The auditor counts the words in the
server HTML, so a page that renders its text on the client shows a thin number.

**Done when** every page in scope shows its main content in the server HTML,
confirmed with the auditor's word count or `curl -s <url> | wc -w`.

## Step 4 — Inventory what is citable

Answers lift what is easy to lift: a one-line definition, a figure with a source,
a comparison table, a direct quotation. The auditor counts tables, blockquotes,
outbound source links and numbers per page. Counts are a floor, not a score: a
page can have all four and still say nothing worth citing.

Per priority page, list what exists and write the missing piece. A page with a
strong point of view and no extractable evidence is a page an answer cannot use.

**Done when** each page in scope has a list of citable elements and the specific
paragraph to add or rewrite.

## Step 5 — Corroborate the entity

Answers repeat what the web says about a brand, including mentions without a
link. Check the `Organization` JSON-LD with `sameAs`, an about page, an author
with credentials, and third-party surfaces: directories, reviews, trade press,
Reddit and YouTube threads. The auditor lists schema types and `sameAs` entries.

**Done when** every claim about the company has a source outside its own domain,
or is written down as missing.

## Step 6 — Measure before changing anything

Wire the baseline first, otherwise the report is an opinion:

- Search Console → Generative AI performance report: impressions in AI Overviews
  and AI Mode, by page, country and device.
- Bing Webmaster Tools → AI Performance: citations and cited pages in Copilot.
  Observational, not causal.
- Server logs and referrers: `chatgpt.com`, `perplexity.ai`,
  `copilot.microsoft.com`.
- The Step 1 prompts, run three times per engine with paraphrases. Record date,
  engine, whether the site is cited, and in which position. One screenshot is
  not a measurement: run-to-run variance is high and source overlap between
  tools is low.

**Done when** there is a dated baseline table and a place where it gets re-run.

## Step 7 — Report with evidence levels

Every recommendation carries one label, taken from the 2023–2026 survey of 45
studies:

| Label | What earns it |
| --- | --- |
| Strong | Reproducible in controlled settings: query–document relevance, position in context |
| Moderate | Extractable evidence (figures, definitions, comparisons), recency, document structure |
| Weak | Fluency, authoritative tone, formatting recipes |

**Done when** every item carries a label and a source, and the report states what
cannot be measured yet.

## Skip these

- `llms.txt` as a visibility lever. Google ignores it, and 97% of published files
  receive zero requests (Ahrefs, 137,000 domains). Keep it when agents read the
  site's docs, and present it as housekeeping.
- Chunking content for machines.
- Rewriting copy in an "AI-friendly" style.
- Paid or inauthentic mentions.
- Special schema.org markup for AI.
- Tools claiming access to Google's internal metrics.

## Guardrails

- Every recommendation carries a strong/moderate/weak label. Unlabeled advice is
  the failure this skill exists to prevent.
- The auditor's output is attached to the report, not summarized away.
- The deliverable is readiness plus measurement. Placement is not promised,
  because no technique in the literature shows a stable, cross-platform causal
  effect on organic discovery.
- `llms.txt` is reported as informational and never scored.
- A blocked bot is reported as a decision with its tradeoff, not as a defect.

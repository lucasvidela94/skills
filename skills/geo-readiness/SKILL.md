---
name: geo-readiness
description: GEO/AEO/LLMO audit — whether generative engines (ChatGPT, AI Overviews, Copilot, Perplexity) can retrieve and cite a site. Use when a client asks to appear in AI answers, when auditing AI visibility or AI crawler access, or when deciding what to change after an SEO pass.
license: MIT
---

# GEO readiness

A generative answer cites a page it already retrieved. That sentence is the
skill: **retrieval is the gate, citation is the prize.** The audit works on both,
in that order, and labels every recommendation with the strength of the evidence
behind it. Paths under `scripts/` are relative to this skill's folder, not to
the project.

## Step 0 — Indexable first

Indexability is the `seo-on-page` skill: canonicals, sitemaps and 404s live
there. A page that cannot be indexed cannot be cited, so its auditor runs first.

**Done when** the `seo-on-page` auditor exits 0 on the pages in scope.

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

A block is a business decision: report it with its tradeoff, as a decision
rather than a defect.

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

Every recommendation carries one label, taken from the survey of 45 studies
(Martinez, July 2026):

| Label | What earns it |
| --- | --- |
| Strong | Reproducible in controlled settings: query–document relevance, position in context |
| Moderate | Extractable evidence (figures, definitions, comparisons), recency, document structure |
| Weak | Fluency, authoritative tone, formatting recipes |

**Done when** every item carries a label and a source, the auditor's output is
attached unabridged, and the report states what cannot be measured yet.

## Out of scope

The effort goes to Steps 2–6. These have no evidence behind them, and a request
for one gets that answer:

- `llms.txt` as a visibility lever. Google ignores it, and 97% of published files
  receive zero requests (Ahrefs, 137,000 domains). Report it as informational
  housekeeping for agent-read docs, never scored.
- Chunking content for machines.
- Rewriting copy in an "AI-friendly" style.
- Paid or inauthentic mentions.
- Special schema.org markup for AI.
- Tools claiming access to Google's internal metrics.

## Guardrails

- The deliverable is readiness plus measurement. Placement is not promised,
  because no technique in the literature shows a stable, cross-platform causal
  effect on organic discovery.
- An unlabeled recommendation is the failure this skill exists to prevent.

# GEO, AEO and LLMO: what the evidence supports

Research as of 21 October 2026. Primary sources at the end. The short version:
**the three names describe the same work, Google calls it SEO, and most of the
"hacks" being sold have no evidence behind them.** What does have evidence is
boring: be indexed, be retrievable, and have something worth citing.

## 1. The names

GEO (*generative engine optimization*), AEO (*answer engine optimization*) and
LLMO (*large language model optimization*) are three labels for one goal: raising
the chance that a generated answer retrieves you, cites you, or uses you.

Google says it outright in its official guide: "optimizing for generative AI
search is optimizing for the search experience, and thus still SEO". Ahrefs
reached the same conclusion in April 2025, and Google's 2026 guide repeats it in
a section titled *Mythbusting generative AI search*.

There is a real difference, and it is not the name: visibility is no longer a
position in a list but a **chain of stages**, and one tactic can win a stage and
lose another. That idea orders everything below.

## 2. How it actually works

Generative engines do not "know" about your site: they retrieve documents, put
them in context and write. Each stage has its own probability:

1. **Activation**: the user asks something that triggers a web search (not every
   chat prompt does).
2. **Crawl and index**: the relevant bot can reach and render the page.
3. **Retrieval**: your URL makes the candidate set.
4. **Reranking and context**: it enters the model's window, at some position.
5. **Citation and prominence**: the answer names you, links you, or uses you to
   support a claim.
6. **Absorption and click**: the user picks you.

The most important conclusion in the literature (a July 2026 survey of 45
studies): **almost all evidence measures stages 4 to 6. Almost none measures
stages 2 to 3.** A paper can improve your citation *once you have already been
retrieved* and say nothing about whether you will be retrieved.

### Who crawls what

It is not one bot, it is several, and blocking one does not block another:

| Engine | Bots | What it controls |
| --- | --- | --- |
| Google Search / AI Overviews / AI Mode | `Googlebot`, `Google-Extended` | `Googlebot` feeds the index; `Google-Extended` controls training and Gemini use |
| ChatGPT search | `OAI-SearchBot`, `ChatGPT-User`, `GPTBot` | `OAI-SearchBot` decides whether you appear in search answers; `GPTBot` is training; `ChatGPT-User` is a user-triggered visit (robots.txt may not apply) |
| Bing / Copilot | `bingbot` | Bing indexes and grounds Copilot and the grounding APIs |
| Perplexity | `PerplexityBot`, `Perplexity-User` | search crawl vs user visit |
| Claude | `ClaudeBot`, `Claude-SearchBot`, `Claude-User` | crawl, search and user visit |

Blocking `GPTBot` does not remove you from ChatGPT search; `OAI-SearchBot` does
that (OpenAI notes robots.txt changes can take ~24 hours to apply). And on Bing
some directives kill citations without looking like it: `NOARCHIVE` excludes
content from Copilot answers and `NOCACHE` limits it to URL, title and snippet.

The full per-operator user-agent list is in Cloudflare's docs (April 2026) and
works as a log checklist: `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`,
`Claude-SearchBot`, `Claude-User`, `PerplexityBot`, `Perplexity-User`, `bingbot`,
`Googlebot`, `Google-CloudVertexBot`, `Bytespider`, `CCBot`, `meta-externalagent`,
`Applebot`, `Amazonbot`, `DuckAssistBot`, `MistralAI-User`.

## 3. The evidence, ranked

The critical survey (Martinez, July 2026) produced the table the field was
missing: level of support per lever.

| Lever | Support | Condition |
| --- | --- | --- |
| Query–document relevance | Strong in controlled settings | Well-defined intent, no fabrication |
| Position in context | Strong | Only once you have been retrieved |
| Extractable evidence (figures, definitions, comparisons) | Moderate to strong | Verifiable and attributable |
| Recency (prices, dates) | Moderate | Time-sensitive queries |
| Document structure (headings, tables) | Moderate and heterogeneous | The effect shifts per stage; do not assume its sign |
| Fluency / simplification | Weak to moderate | Domain- and engine-specific |
| Authoritative tone | Weak and unstable | Mistaking confidence for evidence is the classic error |
| Keyword stuffing | Null or negative | Multiple benchmarks |
| Fixed recipes / "ideal format" | Generalizes poorly | — |

### The famous 40%

The foundational paper (Aggarwal et al., KDD 2024) measured visibility with five
documents **already placed in context**. The numbers, normalized to 100:

| Intervention | Visibility |
| --- | --- |
| Baseline | 19.3 |
| Keyword stuffing | 17.7 |
| Cite sources | 24.6 |
| Statistics addition | 25.2 |
| Quotation addition | 27.2 (~41% relative) |

Three things almost nobody mentions when quoting that 40%:

- It is a gain **inside the context**, not in discoverability. It does not mean
  "40% more clicks" or "40% better odds of being retrieved".
- It is **redistributive**: under `Cite Sources`, the fifth source gains 115% and
  the first loses 30%. No new pie; the gain comes out of someone else's share.
- **Keyword stuffing makes the metric worse.** The classic SEO tactic that gets
  carried over by inertia is precisely the one that does not work.

The survey adds the uncomfortable finding: rewriting to maximize citations can
**hurt retrieval**. You win stage 5 and lose stage 3.

## 4. What you can ignore

Google's official guide (2026) has a *mythbusting* section and names the things
circulating as "AEO/GEO" advice:

- **`llms.txt` and "special" files**: Google Search does not use them. They
  neither help nor hurt visibility there. John Mueller called the file "a
  temporary crutch" for code tools reading developer documentation.
- **"Chunking"**: no need to break content into tiny pieces for AI to understand
  it.
- **Rewriting for AI**: no special format required; systems understand synonyms.
- **Inauthentic mentions**: buying appearances is not a strategy.
- **Special schema.org markup**: no markup is required for AI. Structured data
  still earns rich results, not AI visibility.
- **Tools claiming to use Google's internal metrics**: none of them have access.

### The `llms.txt` case

It is the cleanest example of hype with evidence against it. The Ahrefs study
(137,210 domains, May 2026):

- 28% of domains publish `llms.txt`.
- **97% of those files received zero requests.**
- Of the 3% that did, 19.5% of fetches came from AI tools; 12% came from GEO/AEO
  tools and researchers looking at themselves.
- No AI bot goes looking for `llms.txt` when the file does not exist.

Operational conclusion: it is cheap, it does no harm, and it helps code tools and
agents that read documentation. It is not a step in a search visibility plan, and
no client should be promised anything for having one.

## 5. What to do instead

Two layers. The first is what the `seo-on-page` skill already covers; the second
is where the real headroom is.

**Layer 1 — table stakes (without this, nothing else counts):**

- Indexable by `Googlebot` and by `OAI-SearchBot` / `bingbot` / `PerplexityBot`.
- Content in the server-rendered HTML: most AI crawlers do not execute
  JavaScript.
- Canonicals, sitemap of canonicals, real 404, crawlable internal links,
  semantic HTML.
- Real `lastmod` and IndexNow on Bing (Microsoft documents the sitemap as the
  discovery channel for Copilot).

**Layer 2 — what the evidence actually supports:**

- **Non-commodity content.** Google puts it first: a unique point of view,
  first-hand experience, something a model cannot produce by default. It is also
  the only thing that cannot be copied.
- **Extractable evidence.** One-line definitions, figures with sources,
  comparison tables, direct quotations. Best evidence-to-effort ratio (quotation
  +41% relative in the paper, "moderate to strong" in the survey).
- **Cover sub-intents, not variants.** AI Mode and AI Overviews run *query
  fan-out*: one question becomes several. Cover that with sections inside one
  good page, not with twenty thin pages (which violates the scaled content abuse
  policy).
- **Entity and brand.** Who the company is, who signs the content, what it is
  known for. **Unlinked mentions** matter more in generative engines than in
  classic SEO; third-party listicles and reviews are citation surface.
- **Freshness where it matters.** Prices, dates, availability, versions.

**Layer 3 — distribution, the one people forget:** answers cite what is already
being discussed. Reddit, YouTube, forums, trade press and third-party comparisons
show up because they are in the corpus. Without presence outside your own domain,
on-page work has a ceiling.

## 6. How to measure it (and how not to sell smoke)

What officially exists today:

- **Search Console → Generative AI performance report**: since 31 August 2026,
  for every site. Impressions in AI Overviews and AI Mode, by page, country and
  device. It measures appearance, not clicks.
- **Bing Webmaster Tools → AI Performance**: citations and cited pages in Copilot
  and Bing summaries. Microsoft states it is observational, not causal.
- **Server logs**: requests per user agent and per path (`/robots.txt` marks
  robots reads). On Cloudflare, AI Crawl Control and the verified bot catalog.
- **Referrers**: `chatgpt.com`, `perplexity.ai`, `copilot.microsoft.com`. Low
  volume, low click intent, and the only part visible in analytics.

For prompt monitoring, the minimum protocol the survey proposes is stricter than
most commercial tools: **repeated runs, paraphrases of the same question,
multiple engines, a control, and human validation**. One ChatGPT screenshot is
not a measurement: run-to-run variance is high and source overlap between tools
is low.

And the number that frames the commercial conversation: the field experiment on
AI Overviews (Agarwal & Sen, 2026) found **39.8% fewer outbound clicks** and
**34.5% more zero-click searches**, with no measurable improvement in perceived
search quality. AI visibility is not a traffic channel; it is a brand and
decision channel. Selling it as a replacement for organic traffic is selling it
wrong.

## 7. How to explain it in a meeting

> "Showing up in ChatGPT or AI Overviews is not optimized with a special file: it
> is optimized by being indexable, understandable and citable. Google says so:
> it is SEO. What changes is that answers cite concrete evidence — figures,
> definitions, comparisons — and mention brands people talk about elsewhere. We
> measure impressions in AI Overviews from Search Console and citations in
> Copilot from Bing, and we tell you the truth: this moves brand and decisions
> more than it moves clicks."

## 8. What to build next

A `geo-readiness` skill that audits instead of promising:

1. Crawlability per bot (actual allow/deny, not the declared robots.txt).
2. Critical content in HTML without JavaScript.
3. Extractable evidence per page (sourced figures, definitions, tables).
4. Entity: about page, author, `sameAs`, third-party mentions.
5. Measurement wired before touching content: Search Console, Bing, logs,
   referrers.
6. Evidence level declared on every recommendation, taken from the survey's
   table — so the deliverable stops repeating unsupported hacks.

## Sources

- Aggarwal et al., *GEO: Generative Engine Optimization*, KDD 2024 — https://arxiv.org/abs/2311.09735
- Martinez, *Optimizing Visibility in Generative Engines: A Critical Survey of GEO (2023–2026)*, July 2026 — https://arxiv.org/html/2607.14035
- Google Search Central, *Optimizing your website for generative AI features*, 2026 — https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google Search Central, *AI Features and Your Website* — https://developers.google.com/search/docs/appearance/ai-features
- Google Search Console Help, *Generative AI performance report* — https://support.google.com/webmasters/answer/16984139
- OpenAI, *Overview of OpenAI Crawlers* — https://developers.openai.com/api/docs/bots
- Bing Webmaster Tools, *Webmaster Guidelines* — https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a
- Bing Webmaster Tools, *AI Performance* — https://www.bing.com/webmasters/help/ai-performance-9f8e7d6c
- Ahrefs, *We Analyzed 137K Sites: 97% of llms.txt Files Never Get Read*, October 2025 (May 2026 data) — https://ahrefs.com/blog/llmstxt-study/
- Ahrefs, *GEO, LLMO, AEO… It's All Just SEO*, April 2025 — https://ahrefs.com/blog/geo-is-just-seo/
- Agarwal & Sen, *The Impact of Google AI Overviews on Publisher Traffic*, SSRN, 2026 — https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6513059
- Cloudflare, *AI Crawl Control: Bot reference*, April 2026 — https://developers.cloudflare.com/ai-crawl-control/reference/bots/

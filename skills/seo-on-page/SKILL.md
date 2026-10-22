---
name: seo-on-page
description: Implements or audits on-page SEO for a site (per-page title and meta description, canonicals, OG images, semantic HTML, custom 404, robots.txt, optional llms.txt, and sitemap). Use when adding pages, when a page won't index or shares badly, or when preparing a site to launch.
license: MIT
---

# SEO on-page

A page competes as one URL. Everything else — sitemap, robots, OG, 404 — exists so crawlers and link previews find that URL and see it correctly. **Canonical** is the spine: each page declares which URL owns it, and every other piece of the site either respects that choice or contradicts it. When two pieces disagree (a sitemap listing a `noindex` URL, OG tags pointing at another host, a 404 answering `200`), the search engine picks a winner, and it usually picks wrong.

The work is the same for a new site and for an audit: Step 1 produces the inventory that orders everything else.

## Step 1 — Route inventory

Walk the project's router (pages directory, route table, CMS) and build a table:

| Route | Public | Canonical | Content source |
| --- | --- | --- | --- |
| `/` | yes | `https://site.com/` | `content/home.md` |
| `/admin` | no | — | — |

Anything non-public (admin, API, previews, internal search results) is marked private. That column later decides what robots.txt and the sitemap may include.

**Done when** every route in the project has a row, every public route has a canonical, and each row names where its content comes from.

## Step 2 — One source per page's head

Each head value comes from one place per route: the framework's metadata mechanism (a metadata export, layout props, CMS frontmatter). A title in the layout plus the same title hardcoded in the page is two sources, and one of them goes stale.

| Value | Rule |
| --- | --- |
| `title` | 50–60 characters, unique across the site. Pattern `<topic> · <brand>`, with the brand once, in the layout template rather than in every page. |
| `description` | 140–160 characters, specific to the page, carrying the concrete benefit. Different from the title and from every other page. |
| `link rel=canonical` | Absolute and self-referencing. No query string, no `index.html`, same scheme and host as the sitemap. |
| `og:title` / `og:description` | Built from the same data as title/description; tone may differ. Plain text, no HTML. |
| `og:url` | Identical to the canonical. |
| `og:type` | `website` on the home page and landings, `article` on posts. |
| `og:image` | Absolute, 1200×630, PNG or JPG (link previews do not accept every format). See Step 3. |
| `og:image:alt` | Describes the image for people who cannot see it. |
| `twitter:card` | `summary_large_image` when there is an OG image. |
| `html lang` | The content's real language. |

A route with no description written needs one written; a generic default belongs in the build fallback, never in published content.

**Done when** every public route emits title, description, canonical, `og:url`, and `og:image` as absolute URLs, with titles and descriptions unique and in range.

## Step 3 — OG images

Generate the image from the page's own head data (title, brand, colour) instead of drawing it by hand, so it changes when the title changes. Build-time generation and the framework's image generator both work, as long as the output is static.

- Exactly 1200×630, under 300 KB, text legible at 50% size.
- Truncate the title rather than letting the layout clip it.
- Brand colours and logo: this is the link's first impression, not a placeholder.
- Keep a default image at the root for routes without their own, and check it returns 200.
- With a very long title, shrink the body copy before shrinking the logo.

**Done when** every public route resolves to its own image (or the default) by absolute URL that returns 200 at 1200×630.

## Step 4 — Semantic HTML

Crawlers read the DOM, not the stylesheet.

- `header`, `nav`, `main`, `footer` as landmarks, with one `main` per page.
- One `h1` per page carrying the page's topic; `h2`/`h3` in order with no skipped levels.
- Navigation with `<a href>`: a link is a link. Actions are `<button>`.
- Images with an `alt` that describes the content; `alt=""` on decorative ones.
- `<ul>/<ol>` for lists, `<table>` for tabular data, a `<label>` bound to every form control.
- Key content in the server-rendered HTML: text that only appears after client-side JS has a version the crawler may never see.

**Done when** every page has one `main`, exactly one `h1`, no skipped heading levels, and every interactive control is a native element with an accessible name.

## Step 5 — The 404 page

A 404 is an exit, not a dead end.

- The server answers with a real **404 status**. A pretty page answering 200 is a soft 404, and it leaks junk into the index.
- No `canonical`, plus `noindex`: the page is not content.
- The same layout and navigation as the rest of the site.
- A clear message, a link home, links to the main sections, and search where one exists.
- No automatic redirect: people need to read what happened.

**Done when** `curl -sI https://site.com/does-not-exist` returns `HTTP/2 404` and the page offers at least the home page and the main sections.

## Step 6 — robots.txt (and an optional llms.txt)

`robots.txt` lives at the domain root, served as `text/plain`, and names the sitemap by absolute URL:

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: https://site.com/sitemap.xml
```

Block private paths and internal search results only. Assets (CSS, JS, images) stay reachable, since the crawler cannot render the page without them. Every `Disallow` that is not private gets justified against a row from the Step 1 inventory.

AI crawlers read the same file under their own names (`OAI-SearchBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`). Allow them where the site wants citations, and treat a block as a deliberate decision worth stating: a `User-agent: *` rule that locks out AI search also removes the site from those answers.

`llms.txt` is optional. It follows the [llmstxt.org](https://llmstxt.org) convention: a Markdown summary for coding tools and agents reading documentation. Google Search ignores it, and a study of 137,000 domains found 97% of published files receive zero requests, so it earns a place when agent-read docs are part of the product; it moves nothing in search.

```md
# Site name

> One line saying what the site is and who it is for.

## Pages
- [Product](https://site.com/product): what it solves, in one line.
- [Docs](https://site.com/docs): how to start.
```

**Done when** robots.txt returns 200 at the root, names the sitemap by absolute URL, and every `Disallow` maps to a private row in the inventory.

## Step 7 — Sitemap

The sitemap is the list of indexable canonicals. A URL in the sitemap that is not the canonical is noise.

- Public URLs only, answering 200, without `noindex` and without redirects.
- Absolute URLs on the same host as the canonicals.
- `lastmod` set to the real last content change, not the build date.
- Generated at build time from the route inventory, never edited by hand.
- Past 50,000 URLs or 50 MB, a sitemap index with child sitemaps.
- Referenced from `robots.txt`.

**Done when** the sitemap is generated from the routes, every `loc` returns 200 with a self-referencing canonical, and no private URL appears.

## Step 8 — Verification

Run the auditor over individual URLs or the whole sitemap:

```bash
node scripts/audit.mjs https://site.com/
node scripts/audit.mjs https://site.com/sitemap.xml
```

It follows a sitemap index into its child sitemaps. It checks status, title, description, canonical, `og:url`, `og:image`, `noindex`, and `h1` count, and names the reason behind every failure. To audit a local build or preview whose canonicals point at production, add `--ignore-host`: the canonical is then compared by path only. For what the script does not cover, run `curl -sI` against the 404 and robots.txt, and open one URL in an OG preview validator.

**Done when** every public inventory row passes all checks, or each remaining deviation is recorded with its reason.

## Guardrails

Gates, not opinions. The work is not done until these pass:

- `node scripts/audit.mjs <url|sitemap.xml>` exits 0 across every public URL.
- Each page carries a description written for that page. A build-time default is a fallback for routes nobody meant to publish, and the fix is writing the copy.
- The auditor fails on a repeated title, description, or canonical. Repetition is the fingerprint of generated filler, so the duplicate gets rewritten rather than accepted.
- Every `loc` in the sitemap returns 200. A failing URL is fixed or removed from the sitemap in the same change.
- A page that is not ready to be indexed stays out of the sitemap and out of the navigation, carrying `noindex` until the content exists.

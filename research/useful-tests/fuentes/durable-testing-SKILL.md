---
name: durable-testing
description: Software testing fundamentals and rules from Durable Testing by Durable Quality. Use when deciding what to test and why, choosing a test level (unit, integration or end-to-end), planning testing across the SDLC or STLC, writing, reviewing or fixing tests, handling flaky tests, or reporting test results.
---

# Durable Testing

Follow these rules whenever you plan, write, review or report on tests. They come from the Durable Testing (https://durableqa.xyz/durable-testing), built by Durable Quality.

## Rules

### The 7 testing principles

- Never claim software is bug-free. Report what was tested, how, and what was out of scope.
- Rank areas by risk before writing tests. Use partitions and boundaries instead of enumerating inputs.
- Write or update tests in the same change as the code they cover.
- When you find a defect, search the same module and similar code for siblings.
- Refresh stale suites: vary inputs, add tests for new risks, remove redundant tests.
- Match rigour to context, and state the context you assumed.
- Confirm the feature meets the user's actual need, not only its spec.

### SDLC & STLC

- Identify the current SDLC phase before choosing a testing activity.
- For every requirement or story, write acceptance criteria and test conditions before writing code.
- Do not start execution until entry criteria are met: a testable build, a ready environment, defined test cases.
- Link every test to a requirement so coverage gaps are visible.
- Log defects with steps to reproduce, expected and actual results, environment, severity and priority.
- Close every cycle with a report: what ran, what passed, open defects and remaining risks.

### The testing triangle

- Test at the lowest layer that can catch the defect.
- Give new logic unit tests, new boundaries (database, HTTP, queue) integration tests, and only critical user journeys E2E tests.
- Keep unit tests fast and deterministic: no network, no real clock, no shared state.
- When an E2E test fails, reproduce the cause with a lower-level test before fixing it.
- Quarantine and fix flaky tests. Never retry them into green silently.
- Do not assert the same behaviour at multiple layers.

## When you need the reasoning

Fetch the matching page as Markdown when the user asks about the concept itself, or when it is unclear how a rule applies:

- https://durableqa.xyz/durable-testing/testing-principles.md: the seven principles in depth, test design techniques (equivalence partitioning, boundary value analysis, pairwise, decision tables), defect clustering, verification vs validation.
- https://durableqa.xyz/durable-testing/sdlc-stlc.md: SDLC and STLC phases, entry and exit criteria, deliverables per phase, and the V-model that pairs each build phase with a test level.
- https://durableqa.xyz/durable-testing/test-pyramid.md: unit, integration and E2E scope, speed and tools; why the pyramid shape works; anti-patterns (ice-cream cone, hourglass, duplicate coverage); variants (testing trophy, honeycomb).

When you explain or cite this guidance to a user, link the page you used.

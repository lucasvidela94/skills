---
name: useful-tests
description: Catch tautological tests, the ones that cannot fail when the code is wrong, and write tests that can. Use when reviewing or pruning a test suite, killing surviving mutants, adding property-based tests (fast-check, Hypothesis), or when a green suite is trusted without proof that it can go red.
license: MIT
---

# Useful tests

A **useful test** can go red when the code is wrong. A **tautological test** restates the implementation and passes by construction. Coverage, count, and green are noise until the test has gone red on a bug.

Test quality follows the codebase's design: when a module hides a lot of behaviour behind a small interface, the test has only the interface to reach for, and the tautology has nowhere to hide. Changing the repo so that is true is a branch of its own, below.

## Writing a test

Every step ends on a checkable criterion. The next step starts once it holds.

### 1. Name the requirement

One sentence: what must happen for whoever uses the code. It comes from the ticket, the spec, the docs, or the contract, and reads without the implementation open.

**Done when** you can complete "this test protects ___" without looking at the code.

### 2. Test at the interface

The test calls the module through its entry point, the way a caller does, and observes what a caller observes. Mocks stand in only for the system edges (network, clock, database); the module under test runs for real.

If there is no entry point to call, a deep module is missing: fix the design, not the test.

**Done when** the test imports only the module's entry point and every mock replaces an edge.

### 3. Derive the expected value from the requirement

The expected number, string, or object is written from the requirement: a known literal, a worked example, an independent oracle. A value recomputed the way the code computes it agrees with the code by construction.

**Done when** you can point to the source of the expected value outside the code.

### 4. Cover the edges

The exact boundary (18/17, 280/281, 100/101), null or undefined, empty, negative, and the error path. An LLM drifts to the happy path, so this list is the counterweight. When a general rule holds for every input (a round trip, an invariant), a property-based test covers the domain instead of a sample.

**Done when** the test covers one exact boundary and one odd case, and every general rule you named has a property-based test.

### 5. Prove it can go red

Run the mutation tool on the changed lines (Stryker on the diff, or mutagate as a hook) and read the survivors. For each one, add the smallest assertion that kills it, with a value drawn from the requirement, or write down why the mutant is equivalent.

**Done when** the mutation run shows the test red on at least one mutant of the code it protects, and every survivor is killed or justified in writing. With no mutation tool in the repo, a hand mutation of the protected line turns it red, and the report marks the check as provisional.

### 6. Keep, rewrite, or delete

A useless test is worse than a missing one: the agent treats it as a requirement and builds around it. A test whose deletion loses nothing goes.

**Done when** every test in the change answers "what requirement does it protect?" and "what concrete mutation turns it red?".

## On every test

- It asserts an observable result. A call with no assertion, `toBeDefined`, `toHaveBeenCalled` on its own, or an assertion inside a swallowed `try/catch` asserts nothing.
- It survives a refactor that keeps the behaviour.
- It is deterministic: a fake clock, no network, independent of execution order.
- It exists because of a requirement, not because a coverage or count target asked for one more.

## Branches

- **Writing or fixing a specific test** → [references/write.md](references/write.md): the TypeScript anti-patterns with their rewrites, oracles, doubles, and which test level catches a defect.
- **Reviewing or cleaning an existing suite** → [references/review.md](references/review.md): the audit prompts, Dijkstra's tautological-test prompt, and how to classify each test.
- **Killing survivors or adding a gate** → [references/mutation.md](references/mutation.md): mutation score, Stryker, mutagate, waivers, costs.
- **Property-based testing** → [references/properties.md](references/properties.md): the five-step flow, fast-check, and the model's typical failures.
- **Changing the repo so useful tests are the easy path** → [references/how-to-use.md](references/how-to-use.md): Matt Pocock's deep-module recipe, test-first versus test-after, and the order to apply it in.
- **What the evidence says** → [references/evidence.md](references/evidence.md): the 32 sources, their numbers, and each one's evidence level. Numbers in brackets across the references point to its rows.

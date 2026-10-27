# Reviewing and cleaning a suite

The bar for every test under review is the set of **Done when** criteria in `SKILL.md` steps 1–6 plus its "On every test" list. The prompts below apply that bar at suite scale. The question that decides most cases: if you delete this test, what is lost? [25]

## The tautological-test prompt (Thomas Dijkstra)

This is the verbatim prompt, written for Claude Code. It asks for a markdown artifact and the magnitude of the problem.

> Create a dynamic workflow with the goal of finding tautological tests, tests that only re-assert the implementation. A tautological test is one that doesn't really test anything—it just restates the code it's supposed to be checking. example is a constant like X_POST_CHARACTER_LIMIT = 280 paired with a test that asserts expect(X_POST_CHARACTER_LIMIT).toBe(280). The test simply mirrors the implementation, so it can never catch a genuine bug; it only confirms that the number you wrote is the number you wrote. I want you to find as many as you can find possible and create a markdown artifact. And when you're done report to me the magnitude of it.
>
> — @thomasdijkstra, 2026-10-02. https://x.com/thomasdijkstra/status/2105986009045299255

## The audit-and-delete prompt

Adapted from [12, 23, 25]. The first pass classifies; deletion waits for the table.

> Review the tests under `<path>`. For each one, answer:
> 1. Which requirement does it protect?
> 2. Does the expected value come from the requirement or from the code?
> 3. Would it still pass if the function returned empty or null?
> 4. Does it import something internal instead of the module's entry point?
> 5. Which concrete mutation would make this test fail?
>
> Classify them as **keep**, **rewrite** (say how), and **delete** (say why). Leave every file untouched on this pass. Build a markdown table and tell me how many are in each group.

## What each group looks like

- **Keep**: names a requirement, observable assertion, independent expected value, survives refactoring. Leave it as it is.
- **Rewrite**: the goal is valid but the test looks in the wrong place. Two moves: raise its level (from the internal function to the module entry point, as in `how-to-use.md`) or replace the copied oracle with one from the requirement.
- **Delete**: it protects nothing. First check that no other test, and no agent instruction, treats it as a requirement. A useless test left in place becomes a false specification. [25]

## After the classification

1. Apply the changes one at a time and run the suite.
2. For every rewrite, run step 5 of `SKILL.md`: the test goes red on a mutant of the behaviour it claims to protect. The tooling is in `mutation.md`.
3. Run Dijkstra's prompt again. The review is done when it finds no tautological test left.

## The one-line rule for AGENTS.md

@ucalyd reports that with a weak harness the agent reward-hacks; the line "no tautological tests" in AGENTS.md "sounds stupid but works". [22]

This skill is the long version of that line. If a repo will only carry one sentence, make it: **every test calls the module's entry point and checks a value taken from the requirement**.

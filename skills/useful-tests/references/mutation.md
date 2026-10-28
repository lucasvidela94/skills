# Killing survivors: mutation testing

A **surviving mutant** is a change the code accepts and no test detects (`>=` became `>`, a `+` became `-`, a line was removed). It is the list of bugs your suite cannot see. The **mutation score** is the percentage of killed mutants over the code that changed.

The bar is the mutation score on the diff, not coverage. For every survivor: add an assertion that kills it, or justify it as equivalent. [1, 10, 11, 19]

## The tool, not the hand

Opus 5 has been seen deleting a line by hand to check its own test fails. [27] That is mutation testing with one mutant and no record; the mutation tool runs every operator and lists what survived. [28]

Meta's TestGen-LLM passes every generated test through filters in order: it compiles, it passes reliably across reruns, it adds something no other test had. A test that fails a filter is dropped before a human sees it. [2]

## The evidence that it works

- **Meta ACH**: 571 accepted tests; 277 would have been discarded if line coverage were the only criterion. 73% engineer acceptance. [1]
- **VXI**: a fixture with 100% line, branch, and function coverage killed only 3 of 6 mutants. All three survivors were boundary cases (`>=` vs `>`). Three boundary assertions (`isAdult(18)`, `discount(100)`, `shipping(50)`) took it to 6/6 while coverage stayed at 100%, adding no signal. [11]
- **Traditional criteria**: coverage and mutation trigger the fault in ~33-39% of cases, but actual detection is 1-2% because assertions do not capture it. [5]
- **Limit**: in a regression scenario (code assumed correct) coverage and mutation work; if the code already has the bug, they are not reliable indicators. [6]

## Tools

### Stryker (TS/JS)

```sh
npx stryker run --mutate <changed files>
```

Mutate only what changed. The full suite runs in CI, nightly or on risky changes. [11]

### mutagate (hook)

A hook for Claude Code, Codex, OpenCode, and Pi. Every time the agent writes a test, mutagate mutates the code in the background and tells the agent which bugs slipped through ("`>=` became `>`; no test noticed"). Below the threshold the agent cannot finish, for a bounded number of retry rounds. [10]

- Runners: Stryker (TS/JS, .NET), mutmut (Python), PIT (Java/Kotlin), gomutants (Go).
- It is beta: read the [README](https://github.com/keyboardsamurai/mutagate) for the current config keys and defaults before writing `.mutagate/config.json`.
- An advise mode reports without blocking; start there on a repo with no baseline.
- Waivers: the agent proposes one with a reason, the human approves it. A waiver binds to the exact mutant, so moving the line invalidates it.
- Set the threshold from your repo's baseline. The 80% default is a starting point, not a target. [10, 11]

### The other gates

- **Module boundary**: dependency-cruiser. `*.test.ts` may import a module's entry point and nothing beside it. `how-to-use.md` has the setup. [17]
- **Lint**: a test with no `expect`, `expect(CONST).toBe(literal)`, or an empty `try/catch` inside a test is an error.
- **CI**: diff-scoped mutation on every PR; full mutation nightly. [11]

A rule that must hold every time belongs in an executable check, not in "the model remembers". [11]

## The prompt for strengthening with survivors

Adapted from [1, 10, 11]:

> Run `npx stryker run --mutate <changed files>`. For every surviving mutant, add the smallest assertion that kills it, with an expected value drawn from the requirement. If you believe a mutant is equivalent, explain it and leave it alive. Leave the production code as it is.

## Limits and noise

- The mutation score can be gamed too, and an unsupervised agent drifts back to chasing the number. Review the new assertions, not just the score. [5, 6]
- A killed mutant proves the test looks at that line, not that the test is right. When a behaviour changes on purpose, the mutation run cannot say whether the code or the test is wrong: the requirement decides. Mutation is strongest at finding tests to delete. [33]
- Equivalent mutants create noise. There must be a justified exit, such as mutagate's human-approved waiver. [10, 11]
- Mutation runs cost time and CI: on a small fixture, 7.24x slower than regular tests (not generalizable). [11]

A false bug report from a misread property is a property-based problem; `properties.md` covers it.

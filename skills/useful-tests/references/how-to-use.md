# Changing the repo so useful tests are the easy path (Matt Pocock)

The thesis: **test quality follows the codebase's design**. A tautological test is not a prompt accident; it is what the codebase lets someone write. Change the codebase and the useful test becomes the easy path.

Quotes are verbatim from the 2026 posts, with links. The three skills named below live in Matt Pocock's repo, [github.com/mattpocock/skills](https://github.com/mattpocock/skills), and ship separately from this one.

## 1. Blame the codebase, not the agent

> "Don't blame the agent for writing the bad test. Blame the codebase for allowing the bad test to be written."
>
> — @mattpocockuk, 2026-10-12. https://x.com/mattpocockuk/status/2109589900706083024

Use it when bad tests appear: the question is not "which prompt failed?" but "which interface let this test in?". A module with many small functions and exposed internal state invites detail testing. A deep module does not.

The counterpoint: the DeepSWE runs where agent tests added nothing were on well-designed repos such as FastAPI, so design alone does not explain them. [15, 33] Matt's recipe narrows what a test can reach; the fresh context of step 3 in `SKILL.md` narrows what its author knows. A repo needs both.

## 2. The four-step recipe

> "1. Pull more of your code into deep modules
> 2. Force your tests only to test code at the interface of the module (with dependency-cruiser in TS, for instance)
> 3. Tell automated review to push tests up
> 4. Use /improve-codebase-architecture to move tests into deep modules"
>
> — @mattpocockuk, 2026-10-13. https://x.com/mattpocockuk/status/2109974442302480670

How that maps to tools:

1. **Deep modules**: a lot of behaviour behind a small interface. The vocabulary (module, interface, depth, seam, adapter, leverage, locality) is in the `codebase-design` skill ([source](https://github.com/mattpocock/skills/tree/main/skills/engineering/codebase-design)).
2. **dependency-cruiser**: the `setup-ts-deep-modules` skill ([source](https://github.com/mattpocock/skills/tree/main/skills/in-progress/setup-ts-deep-modules), marked in progress) installs the rules that make tests import only entry points. Without it, one dependency-cruiser rule does the job: `*.test.ts` may import a module's `index.ts`, never a file beside it.
3. **Automated review**: tell the reviewer to push tests up ("this test touches `lib/helpers.ts`; rewrite it against `index.ts`"). The audit prompt in `review.md` asks exactly that.
4. **Moving tests**: when the repo already has tests against internals, the `improve-codebase-architecture` skill ([source](https://github.com/mattpocock/skills/tree/main/skills/engineering/improve-codebase-architecture)) finds the deepening opportunities and moves them.

## 3. Better codebase, better tests

> "My experience is that the quality of tests created depends on the module design of the codebase. I.e. better codebase, better tests. IMO you should test in larger units, and enforce those units with dependency checkers. Tautological tests are indeed a plague, but IMO banning all tests is the wrong idea."
>
> — @mattpocockuk, 2026-10-08. https://x.com/mattpocockuk/status/2108159719189692635

Two consequences:

- **Larger units**: one test per observable module behaviour, not one per private function.
- **Banning tests is not the fix**. The DeepSWE eval shows that banning them does not lower success, but that does not prove tests are useless: it proves the tests the agent invents alone restate its own interpretation. With an entry point to call and an external oracle, they do add value. [15]

## 4. How to know the tests work: mutation

> "No, but do mutation testing"
>
> — @mattpocockuk, 2026-10-13, answering whether there is another way to validate tests. https://x.com/mattpocockuk/status/2110088400942383325

Green validates nothing. Mutation score does: if `>=` becomes `>` and no test notices, the test was not looking. The procedure is in `mutation.md`.

## 5. TDD: a guide, not a ceremony

> "Yes I am starting to agree with you that enforcing TDD is a fool's game. But as you say, tests are still good. And, conversely, saying 'use TDD' is still probably good even if you don't enforce a strict RGR methodology."
>
> — @mattpocockuk, 2026-10-08. https://x.com/mattpocockuk/status/2108168235707429237

@VanTanev adds the mechanism in the thread: "TDD enforced on the agent leads to worse performance. Instructions to build properly based / oracle / fuzzing based tests (with no mandate to write test first) seems to catch real bugs." https://x.com/VanTanev/status/2108167711238815809

Use it: write the failing test first when it helps you think through the requirement. When the agent already knows what to build, the test can come after; the independent oracle and the mutation check are the parts every test keeps.

## Order of application in an existing repo

1. Run the audit in `review.md` and classify: keep, rewrite, delete. Nothing is deleted on this pass.
2. Group the tests touching internals: those are candidates to move behind an entry point. Where there is no entry point, a deep module is missing.
3. Install the interface gate (dependency-cruiser) and the diff mutation gate (`mutation.md`).
4. Only then let the agent write new tests: the codebase now turns red on slop.

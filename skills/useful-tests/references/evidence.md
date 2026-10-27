# Evidence

Evidence levels:

- **Measured**: numbers from an experiment, a paper, or production use.
- **Practical experience**: someone did it and reports how it went, without formal measurement.
- **Opinion**: a criterion or recommendation, without data.

X dates are in UTC. Links were opened on 2026-10-27, except where a row or the last section says otherwise. The raw copies (full tweets, READMEs, abstracts) are kept in the repo under `research/useful-tests/`, outside the skill.

## Which rule rests on what

Strongest first; the numbers are rows below.

1. Mutation score on the diff, not coverage, as the bar: measured. [1, 11]
2. Assertions are where detection fails, so the oracle comes from the spec: measured. [5, 7, 8]
3. Property-based testing with a reflection step finds real bugs: measured. [3, 4]
4. Filter generated tests by compile, stable pass, and added value: measured. [2]
5. Unguided agent tests can add nothing: measured, not peer-reviewed. [15]
6. LLM tests skew to the happy path: measured. [9]
7. Deep modules and tests at the interface: practical experience and opinion. [16, 17, 18]
8. A one-line "no tautological tests" rule in AGENTS.md, and test-first as a guide rather than a mandate: practical experience. [20, 21, 22]

## Papers and studies

| # | Source | Author | Date | Summary | Evidence |
|---|---|---|---|---|---|
| 1 | [Mutation-Guided LLM-based Test Generation at Meta (ACH)](https://arxiv.org/abs/2501.12862). Also the [Meta Engineering post](https://engineering.fb.com/2025/02/05/security/revolutionizing-software-testing-llm-powered-bug-catchers-meta-ach/) | Foster, Harman et al. (Meta) | Jan 2025 (FSE 2025) | The LLM generates mutants that matter, then tests that kill them. 571 tests came out and engineers accepted 73%. **277 of those tests would have been discarded if line coverage were the only criterion.** | Measured |
| 2 | [Automated Unit Test Improvement using LLMs at Meta (TestGen-LLM)](https://arxiv.org/abs/2402.09171) | Alshahwan, Harman et al. (Meta) | Feb 2024 (FSE 2024) | Every test passes automatic filters in order: compiles, passes without being flaky, adds coverage. 75% compile, 25% add something, and 73% of those are accepted. They rejected a test that raised coverage but had no assertion. | Measured |
| 3 | [Agentic Property-Based Testing](https://arxiv.org/abs/2510.09907), with the [Anthropic post](https://www.anthropic.com/research/property-based-testing) and the [repo](https://github.com/mmaaz-git/agentic-pbt) | Maaz, DeVoe, Hatfield-Dodds, Carlini | Oct 2025 / 2026-01-14 | A Claude Code agent infers properties, writes Hypothesis tests, then reflects: "is it trivial?". Run on 100 packages. Of the reviewed reports, 56% were valid bugs, 86% among the top-ranked. Patches merged in NumPy and AWS. | Measured |
| 4 | [A Claude Code command for Hypothesis](https://hypothesis.works/articles/claude-code-plugin/) | DeVoe, Maaz, Hatfield-Dodds, Carlini | 2025-11-01 | The `/hypothesis` command: explore the code, see how it is used, write the properties, reflect on failures. Documents two model failures: unnecessary generator restrictions and misreading properties. | Practical experience |
| 5 | [How effective are traditional test criteria at detecting bugs in LLM generated code?](https://arxiv.org/html/2609.09315v1) | (arXiv 2609.09315) | Sep 2026 | Tested 5 LLMs with 6,000+ faulty programs. Coverage and mutation trigger the fault in 33-39% of cases, but **actual detection is 1-2%** because assertions do not capture it. Specification-derived oracles improve detection by 6.6% on average. | Measured |
| 6 | [Do Coverage and Mutation Scores of LLM-Generated Test Suites Correlate with Their Effectiveness?](http://dl.acm.org/doi/10.1145/3832093) | (ACM PACMSE, replication) | 2026 | Coverage and mutation work in a regression scenario, where the code is assumed correct. If the code already contains the bug, they do not work as indicators. | Measured |
| 7 | [Do LLMs Generate Useful Test Oracles?](https://doi.org/10.1109/ase63991.2025.00031) | (ASE 2025) | 2025 | Measured 13,866 oracles in Java. LLM oracles have a 43% mutation score; human oracles 45%. LLMs struggle with complex oracles. | Measured |
| 8 | [Assertion Generation Strategies for LLM-Based Test Oracles](https://repository.tudelft.nl/record/uuid:f3877914-bd2e-4007-945b-c0db271d27c8) | TU Delft | 2026 | The best strategy is giving the LLM the assertions the developer already wrote ("augmentation"). Chain-of-thought detects more real bugs. | Measured |
| 9 | [Beyond Coverage and Mutation: A Blind-Spot Analysis of LLM-Generated Unit Tests](https://arxiv.org/abs/2610.32548) | (arXiv 2610.32548) | 2026 | Analyzed 14,320 LLM tests. Null, negative, and empty cases are covered only 24-39% of the time, and catch blocks almost never. Tests have a happy-path bias. | Measured |

## Tools, skills, and articles

| # | Source | Author | Date | Summary | Evidence |
|---|---|---|---|---|---|
| 10 | [mutagate](https://github.com/keyboardsamurai/mutagate) and its [tweet](https://x.com/keyboardsamurai/status/2107541729985585538) | Antonio Agudo (@keyboardsamurai) | 2026-10-06 | A hook for Claude Code, Codex, OpenCode, and Pi. Every time the agent writes a test, it mutates the code and will not let it finish if it kills fewer than 80% of mutants (2 rounds). Uses Stryker, mutmut, PIT, gomutants, and Stryker.NET. Beta. | Practical experience (it has its own install eval, not a quality eval) |
| 11 | [VXI Notes: Using Mutation Testing to Check Coding Agent Tests](https://vxi.me/en/posts/ai-generated-tests-mutation-testing/) | VXI | 2026-10-07 | Built a fixture with 100% coverage that killed only 3 of 6 mutants. Three boundary assertions took it to 6/6. Recommends mutating only what changed and not copying 80% blindly. | Measured (small fixture) |
| 12 | [ub-mode (SKILL.md)](https://github.com/unclebob/ub-mode) and the [tweet that spread it](https://x.com/RoundtableSpace/status/2115062205116772676) | Robert C. Martin | Oct 2026 | Uncle Bob's skill. It includes "Test Behavior, Not Implementation", the rule "If the test would still pass when every function returned nothing, throw it out", and a mutator step that kills survivors. | Opinion / practical experience |
| 13 | [Uncle Bob on mutation testing with Claude](https://x.com/unclebobmartin/status/2027126394510069933) | @unclebobmartin | 2026-02-26 | Says mutation testing used to be expensive and now it is "one more Claude agent working down a list". | Practical experience |
| 14 | [Durable Testing](https://durableqa.xyz/durable-testing) with its [SKILL.md](https://durableqa.xyz/durable-testing/skills/durable-testing/SKILL.md) and the [tweet](https://x.com/chriszeuch/status/2108963708240023720) | Chris Zeuch | 2026-10-07/10 | 19 rules for AGENTS.md: test at the lowest layer that catches the defect, use partitions and boundaries, never retry flaky tests until they pass, and do not assert the same thing at several layers. | Opinion |

## X posts

| # | Post | Author | Date | Summary | Evidence |
|---|---|---|---|---|---|
| 15 | [DeepSWE eval: banning tests](https://x.com/kunchenguid/status/2108030810691629403) | Kun Chen | 2026-10-08 | Banning the agent from writing tests did not lower success (not significant) and saved time and tokens (significant). His intuition is that most tests restate the implementation. | Measured (own eval, not peer-reviewed) |
| 16 | [Blame the codebase](https://x.com/mattpocockuk/status/2109589900706083024) | Matt Pocock | 2026-10-12 | A bad agent test is the codebase's fault for allowing it, not the agent's. | Opinion |
| 17 | [Four-step recipe](https://x.com/mattpocockuk/status/2109974442302480670) | Matt Pocock | 2026-10-13 | Use deep modules, test only at the module interface (with dependency-cruiser), tell automated review to push tests up, and use /improve-codebase-architecture. | Opinion |
| 18 | [Better code, better tests](https://x.com/mattpocockuk/status/2108159719189692635) | Matt Pocock | 2026-10-08 | Test in larger units and enforce them with dependency checkers. Banning tests is a mistake. | Practical experience |
| 19 | ["do mutation testing"](https://x.com/mattpocockuk/status/2110088400942383325) | Matt Pocock | 2026-10-13 | His answer to how to validate whether tests work. | Opinion |
| 20 | [Forced TDD](https://x.com/mattpocockuk/status/2108168235707429237) | Matt Pocock | 2026-10-08 | Enforcing strict TDD is "a fool's game", though saying "use TDD" still helps. | Opinion |
| 21 | [Property, oracle, and fuzzing > forced TDD](https://x.com/VanTanev/status/2108167711238815809) | @VanTanev | 2026-10-08 | Enforcing TDD on the agent makes results worse. Instructions for property-, oracle-, or fuzzing-based tests catch real bugs. | Practical experience |
| 22 | ["no tautological tests" in AGENTS.md](https://x.com/ucalyd/status/2106255962449539329) | @ucalyd | 2026-10-03 | With a weak harness, the agent reward-hacks. The AGENTS.md line "sounds stupid but works". | Practical experience |
| 23 | [Prompt to hunt tautological tests](https://x.com/thomasdijkstra/status/2105986009045299255) | Thomas Dijkstra | 2026-10-02 | A full prompt for Claude Code to produce a markdown artifact of tautological tests and the magnitude of the problem. It is reproduced in full in `review.md`. | Practical experience |
| 24 | [Contract tests vs implementation detail](https://x.com/IglxReal/status/2106373868935888910) | @IglxReal | 2026-10-03 | Ask for contract tests, not implementation-detail tests. Claude is "one of the worst offenders". | Opinion |
| 25 | [Useless tests become requirements](https://x.com/raffi_001/status/2105239303651520729) | @raffi_001 | 2026-09-30 | They are worse than risky tests because the agent treats them as requirements and builds around them. | Opinion |
| 26 | [The expected value comes from the requirement](https://x.com/georgebearden/status/2108532419523489961) | George Bearden | 2026-10-09 | "a test's expected value should come from the requirement, not from the code". The full article is linked in a reply that was not opened. | Opinion |
| 27 | [Delete a line to test the test](https://x.com/sean_j_roberts/status/2080868075591667898) | Sean Roberts | 2026-07-25 | Saw Opus 5 delete a line of code to check that its test failed. It is manual mutation. | Practical experience |
| 28 | [Use the mutation tool, not hand deletion](https://x.com/dkubb/status/2081242011923825078) | Dan Kubb | 2026-07-26 | Hand mutation does not scale. Better to tell the LLM to run the mutation testing tool. | Opinion |
| 29 | [50 green tests on a broken calculator](https://x.com/myfear/status/2114014287270150657) | Markus Eisele | 2026-10-24 | Gave 50 tests to a deliberately broken Java pricing calculator and all passed. There is an X article that was not opened. | Practical experience |
| 30 | [Mutation testing is essential](https://x.com/cjimti/status/2021498582222934394) | Craig Johnston | 2026-02-11 | "AI loves to construct tautological tests". | Opinion |
| 31 | [Stryker.js: 847 mutants, 73% kill rate](https://x.com/MingtaKaivo/status/2033228989511205248) | @MingtaKaivo | 2026-03-15 | In an FFT module, 27% of mutants survived. | Practical experience |
| 32 | [Arkency talk: mutant on LLM tests](https://x.com/szymonfiedler/status/2015725372030030169) | Szymon Fiedler | 2026-01-26 | Announces a talk on using mutation testing (Mutant, in Ruby) to validate AI-written tests in legacy code. | Practical experience (announcement) |

## Tools cited (not opened; names for reference)

- Stryker (JS/TS, .NET), mutmut (Python), PIT (Java/Kotlin), gomutants: the runners mutagate uses, according to its README.
- Hypothesis (Python) and fast-check (TS): property-based testing.
- dependency-cruiser (TS): limits tests to the module interface. Matt cites it.

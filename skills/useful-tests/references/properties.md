# Property-based testing

A property is a statement that must hold for every valid input: `parse(serialize(x)) === x`, "the total is never negative", "sorting twice changes nothing". The framework searches for a counterexample, so one test covers an input domain instead of a hand-picked list.

Prefer property-based testing when a general rule exists and the examples would only sample it. [3, 4, 21]

## The five-step flow

The same loop used by Anthropic's agent and the Hypothesis `/hypothesis` command ([source](https://hypothesis.works/articles/claude-code-plugin/)): [3, 4]

1. **Read and understand the target**: read the code, pull the relevant documentation, and explore how the rest of the codebase calls it.
2. **Propose properties grounded in that**: function-specific and cross-function invariants.
3. **Write the property-based tests** in Hypothesis (Python) or fast-check (TS).
4. **Run and reflect**: if it failed, did the test find a real bug, or is the test wrong? If it passed, is it testing anything worthwhile, or is it trivial?
5. **Report**: a confirmed bug gets a formatted report with a minimal counterexample.

## The prompt

Adapted from that command's flow and Anthropic's agent: [3, 4]

> 1. Read `<module>` and how it is used in the repo.
> 2. Propose properties based on types, docs, and real usage.
> 3. Write them with fast-check, without over-restricting the generators.
> 4. Run them and reflect. If it failed, is it a real bug or is the property wrong? If it passed, does it test anything or is it trivial?
> 5. Report the bugs with a minimal counterexample.

## fast-check (TypeScript)

```ts
import fc from "fast-check";

it("parse(serialize(x)) returns x", () => {
  fc.assert(fc.property(arbOrder, (o) => expect(parse(serialize(o))).toEqual(o)));
});

it("the total is never negative", () => {
  fc.assert(fc.property(fc.array(arbItem), (items) => total(items) >= 0));
});
```

Pin the seed and cap the number of examples inside the test when the result must be reproducible.

## Shapes of a good property

- **Round trip**: `parse(serialize(x)) === x`.
- **Invariant**: a value that cannot change, such as non-negativity or a sum preserved.
- **Idempotence**: running twice gives the same state as running once.
- **Ordering**: the output respects a known order.
- **Oracle**: compare against an obviously correct, independent implementation.

## What the model gets wrong

- "AI models like to write strategies with unnecessary restrictions, like limiting the maximum length of a list even when the property should hold for all lengths." [4]
- "By far the most fundamental failure mode is that the model might simply misunderstand a property in the code." [4]
- It can wrap the whole test in a `try/catch`; removing it once revealed a real bug. [3]

## What it found

- 100 popular Python packages. Of 984 bug reports, 50 reviewed manually: 56% valid, 32% valid and reportable. With a ranking rubric, the top 21: 86% valid, 81% reportable. [3]
- 5 bugs reported, 4 with patches, 3 merged: NumPy (`wald`, negative inputs), AWS Lambda Powertools (`slice_dictionary`), tokenizers (invalid HSL). [3]
- One false positive: `dateutil.easter`, a subtle semantics mistake. [3, 4]

## When a property fails

Classify before you patch: a real bug, a wrong property, or an invalid input generator. A false bug report wastes more time than a missing test. For a real bug, capture the minimal counterexample in the report and add it as a regression test.

`evidence.md` has the source for every number here.

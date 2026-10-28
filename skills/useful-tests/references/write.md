# Writing a test

The detail behind steps 2–4 of `SKILL.md`, with the source number from `evidence.md` in brackets.

## Oracles

- The oracle can be a literal, a worked example, or a simple independent implementation. It cannot share the code's logic. [26, 5, 15]
- The classic trap: `expect(calculateTotal(items)).toBe(items.reduce((s, i) => s + i.price, 0))`. The formula is the code's formula, so the test passes even when the code is wrong. Write `15`.
- "If the test would still pass when every function returned nothing, throw it out." [12]
- A test whose requirement you cannot name stays unwritten. When an honest test is impractical, say so in the report instead of writing a weak one. [14, 12]

## Bug first

When a bug arrives, the test comes before the fix:

1. Reproduce the bug with whatever shows it: logs, a script against the running system, the user's steps.
2. Write the test that goes red on it, at the lowest layer that still shows the failure.
3. Fix the code until that test goes green, and keep it as the regression test.

A test that went red on the real bug has already passed step 5 of `SKILL.md`: the bug was the mutant. Then search the same module for siblings of the bug. [14]

## Doubles

- An in-memory double beats a mock with wiring expectations: `expect(repo.save).toHaveBeenCalledWith(...)` checks the internals, `await app.findUser("Ana")` checks the observable effect. [14]
- Contract tests over implementation-detail tests: the contract is what a caller relies on. [24, 12]

## Which level catches the defect

From Durable Testing [14]:

- Test at the lowest layer that can catch the defect: unit tests for new logic, integration tests for new boundaries (database, HTTP, queue), end-to-end only for critical user journeys.
- Assert each behaviour at one layer. The same assertion at three layers triples the maintenance and adds no signal.
- Quarantine a flaky test and fix it. A retry that turns it green hides the defect it found.
- Use equivalence partitions and boundaries to pick inputs instead of enumerating them.

The reasoning behind each rule, for when it is unclear how one applies: [testing principles](https://durableqa.xyz/durable-testing/testing-principles.md), [test pyramid](https://durableqa.xyz/durable-testing/test-pyramid.md).

## TypeScript anti-patterns

### 1. Restating a constant

```ts
export const X_POST_CHARACTER_LIMIT = 280;
it("limit", () => expect(X_POST_CHARACTER_LIMIT).toBe(280)); // ❌ can never fail on a bug

// ✅ test the behaviour that uses the constant
it("rejects posts of 281 characters", () => {
  expect(validatePost("a".repeat(281)).ok).toBe(false);
  expect(validatePost("a".repeat(280)).ok).toBe(true); // the exact boundary
});
```

### 2. The expected value is computed with the implementation's own logic

```ts
it("applies the discount", () => {
  const total = 200;
  expect(applyDiscount(total)).toBe(total * 0.9); // ❌ copies the code's formula
});
// ✅ the value comes from the requirement: "purchases over $100 get 10% off"
it("200 with the discount is 180", () => expect(applyDiscount(200)).toBe(180));
it("100 has no discount", () => expect(applyDiscount(100)).toBe(100)); // boundary
```

### 3. Testing the mock instead of the code

```ts
vi.mock("./repo");
it("saves the user", async () => {
  await createUser({ name: "Ana" });
  expect(repo.save).toHaveBeenCalledWith({ name: "Ana" }); // ❌ verifies internal wiring
});
// ✅ with an in-memory repo, check the observable effect
it("the created user can be read back", async () => {
  const app = makeApp({ repo: inMemoryRepo() });
  await app.createUser({ name: "Ana" });
  expect(await app.findUser("Ana")).toMatchObject({ name: "Ana" });
});
```

### 4. No real assertion, or swallowing the error

```ts
it("processes", () => { process(input); });                 // ❌ coverage only
it("processes", () => { try { process(bad) } catch {} });  // ❌ the try hides the bug [3]
it("exists", () => expect(process).toBeDefined());          // ❌
```

### 5. A giant snapshot as the only assertion of the logic

```ts
it("renders", () => expect(calc(x)).toMatchSnapshot()); // ❌ freezes whatever is there, right or wrong
```

Keep snapshots for output whose exact shape is the contract (a CLI's help text, a serialized format), and assert the logic with values.

Property-based tests have their own flow in `properties.md`.

## @mattpocockuk 2026-10-12T10:20:01.000Z https://x.com/mattpocockuk/status/2109589900706083024
Don't blame the agent for writing the bad test

Blame the codebase for allowing the bad test to be written
Links: []

## @mattpocockuk 2026-10-13T11:48:03.000Z https://x.com/mattpocockuk/status/2109974442302480670
@coskar4422 1. Pull more of your code into deep modules
2. Force your tests only to test code at the interface of the module (with dependency-cruiser in TS, for instance)
3. Tell automated review to push tests up
4. Use /improve-codebase-architecture to move tests into deep modules
Links: []

## @mattpocockuk 2026-10-08T11:36:59.000Z https://x.com/mattpocockuk/status/2108159719189692635
My experience is that the quality of tests created depends on the module design of the codebase

I.e. better codebase, better tests

IMO you should test in larger units, and enforce those units with dependency checkers.

Tautological tests are indeed a plague, but IMO banning all tests is the wrong idea.
Links: []

## @mattpocockuk 2026-10-13T19:20:52.000Z https://x.com/mattpocockuk/status/2110088400942383325
@nadimkabir No, but do mutation testing
Links: []

## @mattpocockuk 2026-10-08T12:10:49.000Z https://x.com/mattpocockuk/status/2108168235707429237
@VanTanev @kunchenguid Yes I am starting to agree with you that enforcing TDD is a fool's game

But as you say, tests are still good.

And, conversely, saying "use TDD" is still probably good even if you don't enforce a strict RGR methodology.
Links: []

## @ucalyd 2026-10-03T05:32:08.000Z https://x.com/ucalyd/status/2106255962449539329
asking an agent with a weak harness to write tests is a failed game. it will reward hack its way to write tautological tests that have no impact/steer towards code quality.

"no tautological tests" in AGENTS.md sounds stupid but works
Links: []

## @thomasdijkstra 2026-10-02T11:39:26.000Z https://x.com/thomasdijkstra/status/2105986009045299255
Good prompt for claude code to get rid of slop tests in your test suite that only re-assert the implementation:
---
Create a dynamic workflow with the goal of finding tautological tests, tests that only re-assert the implementation.

 A tautological test is one that doesn't really test anything—it just restates the code it's supposed to be checking. example is a constant like X_POST_CHARACTER_LIMIT = 280 paired with a test that asserts expect(X_POST_CHARACTER_LIMIT).toBe(280). The test simply mirrors the implementation, so it can never catch a genuine bug; it only confirms that the number you wrote is the number you wrote.

I want you to find as many as you can find possible and create a markdown artifact. And when you're done report to me the magnitude of it.
Links: []

## @IglxReal 2026-10-03T13:20:39.000Z https://x.com/IglxReal/status/2106373868935888910
@shcallaway @sazabi I can almost guarantee this is your agents writing implementation-detail tests, when you want contract tests, I believe Claude is one of the worst offenders when it comes to writing useless tests.
Links: []

## @raffi_001 2026-09-30T10:12:18.000Z https://x.com/raffi_001/status/2105239303651520729
@PovilasKorop Risky tests you can find and fix. Useless tests are worse, because the agent may start treating them as requirements and builds around them.
Links: []

## @VanTanev 2026-10-08T12:08:44.000Z https://x.com/VanTanev/status/2108167711238815809
The only thing I would say is that in my experience, the type of tests and how they're written matters.

TDD enforced on the agent leads to worse performance.

Instructions to build properly based / oracle / fuzzing based tests (with no mandate to write test first) seems to catch real bugs.
Links: []

## @georgebearden 2026-10-09T12:17:58.000Z https://x.com/georgebearden/status/2108532419523489961
UNIT TESTING STRATEGIES FROM A VERY SMART, VERY SENIOR ENGINEER™
…and how to stop your AI agents from writing tautological tests

In 2020, I had the great fortune of working with a Very Smart, Very Senior Engineer™ (oh you thought the title was about myself?? As if!). One of the things they did in PR reviews that has stuck with me over the years: pointing out that a test's expected value should come from the requirement, not from the code, or it will pass even when the code is wrong.

I've carried this philosophy with me ever since, and a recent talk from @mattpocockuk  helped connect some dots that had been missing. I wrote up what I learned, including how to keep AI agents from writing tests that break the rule. Link in reply 👇
Links: []

## @chriszeuch 2026-10-10T16:51:45.000Z https://x.com/chriszeuch/status/2108963708240023720
Level up your foundational knowledge with Durable Testing

Comes with the /durable-testing skill to help you get the conversation started with your agent https://t.co/MqKWn6OFVm
Links: ['https://twitter.com/code_kartik/status/2108697560257110267']

## @kunchenguid 2026-10-08T03:04:45.000Z https://x.com/kunchenguid/status/2108030810691629403
ok it's official... AI-written unit tests and integration tests are empirically proven to be unhelpful. you should tell your agents to stop writing tests by themselves

on the deepswe eval set, banning sonnet 5.5 high from writing any tests actually resulted in slightly higher success rate (non stat-sig), with less time and token spent (stat-sig). this is pretty hard empirical evidence

across the tests that were written by the "tests allowed" baseline arm, 65% of them were unit tests, 35% were integration tests, neither bucket resulted in any improvement compared to not writing any tests at all

i also picked a random sample of 44 tasks subset where i completely disabled executing even existing tests - it also did not affect success rate at all

i spot checked many tests written in the baseline arm, and my intuition is that most tests are simply a repetition of the implementation

agent-written tests do not add any value because both the implementation and the tests were simply the agent's interpretation of our intent. the tests aren't any more accurate than the implementation itself

i suspect we can still extract some value from unit tests and integration tests if we describe them ourselves when we believe we can articulate our intent better through test cases than through requirements. but i have not proven this yet

also worth noting, during deepswe eval the agent wrote almost no e2e tests (only 17, compared to 3000+ unit/integration tests written). so this analysis does not prove nor disprove the value of e2e tests - i will do another eval specifically for that
Links: ['https://x.com/kunchenguid/status/2108030810691629403/photo/1']

## @keyboardsamurai 2026-10-06T18:41:19.000Z https://x.com/keyboardsamurai/status/2107541729985585538
You ask your coding agent for tests. They come back green. Then you read them and half assert nothing that could ever fail.

I got tired of that, so I built mutagate. Mutation testing as a hook for Claude Code and Codex CLI. Open source, beta 0.9.0, and I want your feedback. https://t.co/jUMiOECfju
Links: ['https://x.com/keyboardsamurai/status/2107541729985585538/photo/1']

## @myfear 2026-10-24T15:20:57.000Z https://x.com/myfear/status/2114014287270150657
I gave a deliberately broken Java pricing calculator 50 tests. Every one passed.

So, what do your AI-generated tests actually prove?

Three examples of checking the requirements, assertions, and inputs before trusting a green build. https://t.co/d1YiTwL7cU
Links: ['https://x.com/i/article/2114013324249636864']

## @RoundtableSpace 2026-10-27T12:45:00.000Z https://x.com/RoundtableSpace/status/2115062205116772676
Uncle Bob, the author of Clean Code, just wrote a skill that makes AI agents code the way he would.

ub-mode makes your agent make it work first, then make it right: tests first, fix root causes, subtract before you add. Then it runs hard quality checks, including mutation testing that catches code your tests don't really cover.

Copy SKILL.md into ~/.claude/skills/ub-mode/ and run /ub-mode. Works in Claude Code, Cursor and Grok.

https://t.co/yreAWtmCmN
Links: []

## @sean_j_roberts 2026-07-25T04:09:44.000Z https://x.com/sean_j_roberts/status/2080868075591667898
I watched Opus 5 delete a line of code to prove the test it wrote actually tested what it thought it was testing earlier today

I've worked with a lot of developers who never did that
Links: []

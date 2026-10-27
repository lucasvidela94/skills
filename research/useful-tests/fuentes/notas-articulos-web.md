# Extractos de artículos web leídos (27-10-2026)

Extractos textuales en inglés, sacados de las páginas al leerlas. Los resúmenes están en referencias.md.

## Anthropic, "Finding bugs across the Python ecosystem with Claude and property-based testing" (14-01-2026)
URL: https://www.anthropic.com/research/property-based-testing
Proceso del agente:
1. Read and understand the target, by reading code, pulling relevant documentation, and exploring how it relates to the rest of the codebase.
2. Propose properties grounded in these findings.
3. Write corresponding property-based tests in Hypothesis.
4. Run the tests and reflect: if it failed, has the test truly discovered a bug, or does the test need to be adjusted? If it succeeded, is the test testing anything worthwhile, or is it simply trivial?
5. If the agent is confident it has found a real bug, it writes out a formatted bug report.
- "the agent realized that it had wrapped the whole test in a try-catch block. After removing that, the test failed, and the agent found a bug."
- Of 984 bug reports, 50 reviewed manually: 56% valid, 32% valid and reportable. With a ranking rubric, top-scoring: 86% valid, 81% reportable.
- Bugs con patch mergeado: numpy wald (negativos), aws-lambda-powertools slice_dictionary, tokenizers (HSL inválido). dateutil easter: falso positivo (semántica sutil).

## Hypothesis, "A Claude Code command for Hypothesis" (01-11-2025)
URL: https://hypothesis.works/articles/claude-code-plugin/
Flujo de /hypothesis:
1. Explore the provided code and identify candidate properties.
2. Explore how the codebases calls that code in practice.
3. Grounded in this understanding, write corresponding Hypothesis tests.
4. Run the new Hypothesis tests, and reflect on any failures. Is it a genuine bug, or is the test incorrect?
Fallas observadas: "AI models like to write strategies with unnecessary restrictions, like limiting the maximum length of a list even when the property should hold for all lengths". "By far the most fundamental failure mode is that the model might simply misunderstand a property in the code."

## VXI Notes, "Are AI-Generated Tests Reliable? Using Mutation Testing to Check Coding Agent Tests" (07-10-2026)
URL: https://vxi.me/en/posts/ai-generated-tests-mutation-testing/
- Fixture chico: suite verde con 100% de cobertura de líneas, ramas y funciones; mató solo 3 de 6 mutantes (50%). Los 3 sobrevivientes eran de borde (>= vs >).
- Agregando 3 asserts en los bordes (isAdult(18), discount(100), shipping(50)): 6/6 mutantes muertos; la cobertura siguió en 100% y no aportó señal.
- Costo: loop de mutación 7,24x más lento que los tests comunes en ese fixture (no generalizable).
- "I would not copy '80%' into every repository." Recomienda: mutar solo el código que cambió el agente, suite completa en CI.
- "once a rule must happen every time, it should gradually move out of 'the model should remember' and into an executable check."

## Meta, ACH: "Mutation-Guided LLM-based Test Generation at Meta" (arXiv 2501.12862, FSE 2025)
URL: https://arxiv.org/abs/2501.12862 y https://engineering.fb.com/2025/02/05/security/revolutionizing-software-testing-llm-powered-bug-catchers-meta-ach/
- "Of these 571 tests, 277 would have been discarded had we chosen to focus solely on the line coverage test adequacy criterion, underlining the importance of mutation testing over such coverage."
- 73% de aceptación por ingenieros; 36% relevantes para privacidad.

## Meta, TestGen-LLM: "Automated Unit Test Improvement using Large Language Models at Meta" (arXiv 2402.09171, FSE 2024)
URL: https://arxiv.org/abs/2402.09171
- Filtros: compila → pasa de forma estable (no flaky) → aumenta cobertura. 75% compila, 57% pasa estable, 25% suma cobertura.
- 73% de las recomendaciones aceptadas para producción. Un diff rechazado: "the test case did not include any assertion" (subía cobertura sin assert).

## "How effective are traditional test criteria at detecting bugs in LLM generated code?" (arXiv 2609.09315)
URL: https://arxiv.org/html/2609.09315v1
- Tasa de disparo de fallas: statement 32,9%, branch 38,9%, mutation 32,2%; tasa de detección real ~1-2% porque los oráculos (asserts) no capturan el mal comportamiento.
- Oráculos derivados de la especificación/prompt: mejora promedio ~6,6% en detección; "the continued need for human oversight, particularly in the construction and validation of test assertions."

## "Do Coverage and Mutation Scores of LLM-Generated Test Suites Correlate with Their Effectiveness?" (ACM, replicación)
URL: http://dl.acm.org/doi/10.1145/3832093
- Cobertura y mutación sirven para comparar en contexto de regresión (código asumido correcto); no son indicadores confiables cuando el código ya tiene el bug.

## "Do LLMs Generate Useful Test Oracles?" (ASE 2025)
URL: https://doi.org/10.1109/ase63991.2025.00031
- Oráculos de LLM: mutation score promedio 43% vs 45% de los humanos, en 13.866 oráculos de 135 proyectos Java posteriores al corte de entrenamiento.

## TU Delft, "An Empirical Study of Assertion Generation Strategies for LLM-Based Test Oracles"
URL: https://repository.tudelft.nl/record/uuid:f3877914-bd2e-4007-945b-c0db271d27c8
- "Assertion Augmentation" (darle al LLM los asserts existentes del dev) es la mejor en mutation score; Chain-of-Thought detecta más bugs reales.

## "Beyond Coverage and Mutation: A Blind-Spot Analysis of LLM-Generated Unit Tests" (BlindSpotEval)
URL: https://arcxiv.org/abs/2610.32548
- 14.320 tests de 4 LLMs: null 34,8%, negativos 23,8%, vacíos 38,8% vs >93% para booleanos. Catch blocks: 0,100 de adecuación. Sesgo de camino feliz.

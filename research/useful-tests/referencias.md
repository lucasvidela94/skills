# Referencias

Niveles de evidencia:
- **Dato medido**: hay números de un experimento, un paper o un uso en producción.
- **Experiencia práctica**: alguien lo hizo y cuenta cómo le fue, sin medición formal.
- **Opinión**: un criterio o una recomendación, sin datos.

Las fechas de X están en UTC. Todos los links se abrieron el 27-10-2026.

## Papers y estudios

| # | Fuente | Autor | Fecha | Resumen | Evidencia |
|---|---|---|---|---|---|
| 1 | [Mutation-Guided LLM-based Test Generation at Meta (ACH)](https://arxiv.org/abs/2501.12862). También está el [post de Meta Engineering](https://engineering.fb.com/2025/02/05/security/revolutionizing-software-testing-llm-powered-bug-catchers-meta-ach/) | Foster, Harman y otros (Meta) | ene 2025 (FSE 2025) | El LLM genera mutantes que importan y después tests que los matan. Salieron 571 tests y los ingenieros aceptaron el 73%. **277 de esos tests se habrían descartado si el criterio fuera solo cobertura de líneas.** | Dato medido |
| 2 | [Automated Unit Test Improvement using LLMs at Meta (TestGen-LLM)](https://arxiv.org/abs/2402.09171) | Alshahwan, Harman y otros (Meta) | feb 2024 (FSE 2024) | Cada test pasa por filtros automáticos en orden: compila, pasa sin ser flaky y suma cobertura. Del 75% que compila se llega al 25% que suma algo, y el 73% de esos se aceptó. Rechazaron un test que subía la cobertura pero no tenía ningún assert. | Dato medido |
| 3 | [Agentic Property-Based Testing](https://arxiv.org/abs/2510.09907), con su [post en Anthropic](https://www.anthropic.com/research/property-based-testing) y el [repo](https://github.com/mmaaz-git/agentic-pbt) | Maaz, DeVoe, Hatfield-Dodds, Carlini | oct 2025 / 14-01-2026 | Un agente de Claude Code infiere propiedades, escribe tests con Hypothesis y después reflexiona: "¿es trivial?". Lo corrieron en 100 paquetes. De los reportes revisados, el 56% eran bugs válidos, y el 86% entre los mejor rankeados. Tienen patches mergeados en NumPy y AWS. | Dato medido |
| 4 | [A Claude Code command for Hypothesis](https://hypothesis.works/articles/claude-code-plugin/) | DeVoe, Maaz, Hatfield-Dodds, Carlini | 01-11-2025 | Es el comando `/hypothesis`: explora el código, mira cómo se usa, escribe las propiedades y reflexiona sobre las fallas. Documenta dos fallas del modelo: pone límites innecesarios en las estrategias y malinterpreta propiedades. | Experiencia práctica |
| 5 | [How effective are traditional test criteria at detecting bugs in LLM generated code?](https://arxiv.org/html/2609.09315v1) | (arXiv 2609.09315) | sep 2026 | Probaron 5 LLMs con más de 6.000 programas con fallas. Cobertura y mutación disparan la falla en alrededor del 33-39% de los casos, pero **la detección real es del 1-2%** porque los asserts no la capturan. Los oráculos que salen de la especificación mejoran la detección en un 6,6% en promedio. | Dato medido |
| 6 | [Do Coverage and Mutation Scores of LLM-Generated Test Suites Correlate with Their Effectiveness?](http://dl.acm.org/doi/10.1145/3832093) | (ACM PACMSE, replicación) | 2026 | Cobertura y mutación sirven en un escenario de regresión, donde el código se asume correcto. Si el código ya tiene el bug, no sirven como indicador. | Dato medido |
| 7 | [Do LLMs Generate Useful Test Oracles?](https://doi.org/10.1109/ase63991.2025.00031) | (ASE 2025) | 2025 | Midieron 13.866 oráculos en Java. Los del LLM tienen un mutation score del 43% y los humanos del 45%. Al LLM le cuestan los oráculos complejos. | Dato medido |
| 8 | [Assertion Generation Strategies for LLM-Based Test Oracles](https://repository.tudelft.nl/record/uuid:f3877914-bd2e-4007-945b-c0db271d27c8) | TU Delft | 2026 | Lo que mejor anda es pasarle al LLM los asserts que ya escribió el dev ("augmentation"). Con chain-of-thought detecta más bugs reales. | Dato medido |
| 9 | [Beyond Coverage and Mutation: Blind-Spot Analysis of LLM-Generated Unit Tests](https://arcxiv.org/abs/2610.32548) | (ArcXiv 2610.32548) | 2026 | Analizaron 14.320 tests de LLM. Los casos con null, negativos y vacíos se cubren solo entre el 24% y el 39% de las veces, y los catch casi nada. Los tests tienen sesgo de camino feliz. | Dato medido |

## Herramientas, skills y artículos

| # | Fuente | Autor | Fecha | Resumen | Evidencia |
|---|---|---|---|---|---|
| 10 | [mutagate](https://github.com/keyboardsamurai/mutagate) y su [tuit](https://x.com/keyboardsamurai/status/2107541729985585538) | Antonio Agudo (@keyboardsamurai) | 06-10-2026 | Es un hook para Claude Code, Codex, OpenCode y Pi. Cada vez que el agente escribe un test, muta el código y no lo deja terminar si mata menos del 80% de los mutantes (con 2 rondas). Usa Stryker, mutmut, PIT, gomutants y Stryker.NET. Está en beta. | Experiencia práctica (tiene una eval propia de instalación, no de calidad) |
| 11 | [VXI Notes: Using Mutation Testing to Check Coding Agent Tests](https://vxi.me/en/posts/ai-generated-tests-mutation-testing/) | VXI | 07-10-2026 | Armó un fixture con 100% de cobertura que solo mata 3 de 6 mutantes. Con 3 asserts de borde llega a 6/6. Recomienda mutar solo lo que cambió y no copiar el 80% a ciegas. | Dato medido (fixture chico) |
| 12 | [ub-mode (SKILL.md)](https://github.com/unclebob/ub-mode) y el [tuit que lo difundió](https://x.com/RoundtableSpace/status/2115062205116772676) | Robert C. Martin | oct 2026 | Es la skill de Uncle Bob. Incluye "Test Behavior, Not Implementation", la regla "If the test would still pass when every function returned nothing, throw it out" y un paso con mutator para matar sobrevivientes. | Opinión / experiencia práctica |
| 13 | [Uncle Bob sobre mutation testing con Claude](https://x.com/unclebobmartin/status/2027126394510069933) | @unclebobmartin | 26-02-2026 | Dice que el mutation testing antes era caro y que ahora es "one more Claude agent working down a list". | Experiencia práctica |
| 14 | [Durable Testing](https://durableqa.xyz/durable-testing) con su [SKILL.md](https://durableqa.xyz/durable-testing/skills/durable-testing/SKILL.md) y el [tuit](https://x.com/chriszeuch/status/2108963708240023720) | Chris Zeuch | 07/10-10-2026 | Son 19 reglas para AGENTS.md: testear en la capa más baja que agarre el defecto, usar particiones y bordes, no reintentar tests flaky hasta que pasen y no afirmar lo mismo en varias capas. | Opinión |

## Posts de X

| # | Post | Autor | Fecha | Resumen | Evidencia |
|---|---|---|---|---|---|
| 15 | [Eval DeepSWE: prohibir tests](https://x.com/kunchenguid/status/2108030810691629403) | Kun Chen | 08-10-2026 | Prohibirle al agente escribir tests no bajó el éxito (la diferencia no es significativa) y ahorró tiempo y tokens (eso sí es significativo). Su intuición es que la mayoría de los tests repiten la implementación. | Dato medido (es una eval propia y no es peer-reviewed) |
| 16 | [Culpá al código](https://x.com/mattpocockuk/status/2109589900706083024) | Matt Pocock | 12-10-2026 | "Blame the codebase for allowing the bad test to be written". | Opinión |
| 17 | [Receta en 4 pasos](https://x.com/mattpocockuk/status/2109974442302480670) | Matt Pocock | 13-10-2026 | Usar deep modules, testear solo en la interfaz del módulo (con dependency-cruiser), pedirle a la revisión automática que suba los tests de nivel y usar /improve-codebase-architecture. | Opinión |
| 18 | [Mejor código, mejores tests](https://x.com/mattpocockuk/status/2108159719189692635) | Matt Pocock | 08-10-2026 | Testear en unidades más grandes y hacerlas cumplir con dependency checkers. Prohibir los tests le parece un error. | Experiencia práctica |
| 19 | ["do mutation testing"](https://x.com/mattpocockuk/status/2110088400942383325) | Matt Pocock | 13-10-2026 | Es su respuesta a cómo validar si los tests sirven. | Opinión |
| 20 | [TDD forzado](https://x.com/mattpocockuk/status/2108168235707429237) | Matt Pocock | 08-10-2026 | Forzar TDD estricto le parece "a fool's game", aunque decir "use TDD" igual ayuda. | Opinión |
| 21 | [Property, oráculo y fuzzing > TDD forzado](https://x.com/VanTanev/status/2108167711238815809) | @VanTanev | 08-10-2026 | Forzarle TDD al agente empeora los resultados. Las instrucciones de tests basados en propiedades, oráculos o fuzzing agarran bugs reales. | Experiencia práctica |
| 22 | ["no tautological tests" en AGENTS.md](https://x.com/ucalyd/status/2106255962449539329) | @ucalyd | 03-10-2026 | Con un harness débil, el agente hace reward hacking. La línea en AGENTS.md "sounds stupid but works". | Experiencia práctica |
| 23 | [Prompt para cazar tests tautológicos](https://x.com/thomasdijkstra/status/2105986009045299255) | Thomas Dijkstra | 02-10-2026 | Es un prompt completo para que Claude Code arme un markdown con los tests tautológicos y la magnitud del problema. Está entero en fuentes/tuits-x-seeds.md. | Experiencia práctica |
| 24 | [Contract tests vs implementation-detail](https://x.com/IglxReal/status/2106373868935888910) | @IglxReal | 03-10-2026 | Pedir tests de contrato y no de detalle de implementación. Dice que Claude es "one of the worst offenders". | Opinión |
| 25 | [Tests inútiles que pasan a ser requisitos](https://x.com/raffi_001/status/2105239303651520729) | @raffi_001 | 30-09-2026 | Son peores que los tests riesgosos porque el agente los toma como requisitos y construye alrededor de ellos. | Opinión |
| 26 | [El esperado sale del requisito](https://x.com/georgebearden/status/2108532419523489961) | George Bearden | 09-10-2026 | "a test's expected value should come from the requirement, not from the code". El artículo completo está linkeado en un reply que no abrí. | Opinión |
| 27 | [Borrar una línea para probar el test](https://x.com/sean_j_roberts/status/2080868075591667898) | Sean Roberts | 25-07-2026 | Vio a Opus 5 borrar una línea del código para comprobar que su test fallaba. Es mutación manual. | Experiencia práctica |
| 28 | [Usar la herramienta de mutación, no borrar líneas a mano](https://x.com/dkubb/status/2081242011923825078) | Dan Kubb | 26-07-2026 | Lo de mutar a mano no escala. Es mejor decirle al LLM que corra la herramienta de mutation testing. | Opinión |
| 29 | [50 tests verdes sobre una calculadora rota](https://x.com/myfear/status/2114014287270150657) | Markus Eisele | 24-10-2026 | Le dio 50 tests a una calculadora de precios en Java rota a propósito y pasaron todos. Hay un artículo en X que no abrí. | Experiencia práctica |
| 30 | [Mutation testing es esencial](https://x.com/cjimti/status/2021498582222934394) | Craig Johnston | 11-02-2026 | "AI loves to construct tautological tests". | Opinión |
| 31 | [Stryker.js: 847 mutantes, 73% kill rate](https://x.com/MingtaKaivo/status/2033228989511205248) | @MingtaKaivo | 15-03-2026 | En un módulo FFT, el 27% de los mutantes sobrevivió. | Experiencia práctica |
| 32 | [Charla de Arkency: mutant sobre tests de LLM](https://x.com/szymonfiedler/status/2015725372030030169) | Szymon Fiedler | 26-01-2026 | Anuncia una charla sobre usar mutation testing (Mutant, en Ruby) para validar tests escritos por IA en código legacy. | Experiencia práctica (anuncio) |

## Herramientas citadas (no las abrí, solo como referencia de nombres)
- Stryker (JS/TS, .NET), mutmut (Python), PIT (Java/Kotlin), gomutants: son los runners que usa mutagate, según su README.
- Hypothesis (Python) y fast-check (TS): para property-based testing.
- dependency-cruiser (TS): para limitar a los tests a la interfaz del módulo. Lo cita Matt.

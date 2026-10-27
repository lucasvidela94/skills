# Que la IA escriba tests útiles y no basura: referencias

Junté esto el 27-10-2026 de X, papers, blogs y repos. Solo puse links que abrí.

## Archivos
- `README.md`: este índice y el resumen.
- `referencias.md`: las 32 fuentes, con link, autor, fecha, un resumen y el nivel de evidencia.
- `doc-base-skill.md`: material crudo para tu skill. Tiene reglas, antipatrones en TS, prompts y un checklist.
- `fuentes/`: copias de lo que leí.
  - Los tuits completos, incluido el prompt de Dijkstra.
  - Los READMEs de mutagate, agentic-pbt y ub-mode.
  - Las SKILL.md de ub-mode y durable-testing.
  - Los abstracts de los papers.
  - Extractos de los artículos.

## Resumen: qué funciona, ordenado por evidencia

### 1. Usar mutation testing en vez de cobertura como criterio (dato medido)
- En Meta, con ACH, 277 de 571 tests útiles se habrían tirado si el criterio fuera solo cobertura.
- En el fixture de VXI, la suite tenía 100% de cobertura y mataba solo el 50% de los mutantes. Con 3 asserts de borde llegó al 100%.
- Lo más útil es pasarle al agente la lista de mutantes que sobrevivieron, por ejemplo "`>=` pasó a `>` y ningún test se dio cuenta", y no solo el porcentaje.
- Herramienta lista para usar: **mutagate**, un hook que no deja terminar al agente hasta matar el 80% de los mutantes.

### 2. El problema real son los asserts, no la ejecución (dato medido)
- Un estudio de 2026 muestra que cobertura y mutación disparan la falla en alrededor del 33% de los casos, pero el test la detecta solo en el 1-2%.
- Los oráculos que salen de la especificación o de los asserts existentes del dev mejoran eso.
- Regla práctica: el valor esperado sale del requisito, nunca del código.

### 3. Property-based testing con el agente (dato medido)
- El agente de Anthropic con Hypothesis encontró bugs reales en NumPy y AWS, con patches mergeados.
- La clave es un paso de reflexión: "si pasó, ¿testea algo o es trivial?".
- En TS, el equivalente es fast-check.

### 4. Filtros automáticos antes de que un humano mire (dato medido)
- TestGen-LLM de Meta filtra en orden: compila, pasa estable, suma algo.
- Rechaza los tests sin assert, aunque suban la cobertura.

### 5. Los tests escritos por el agente sin guía pueden no aportar nada (dato medido, no peer-reviewed)
- En la eval DeepSWE de Kun Chen, prohibir tests no bajó el éxito y ahorró tokens.
- No dice "no testees": dice que los tests que inventa solo el agente repiten su propia interpretación.

### 6. Diseño del código: deep modules y tests en la interfaz (experiencia práctica y opinión)
- Es lo de Matt Pocock: con módulos profundos y tests limitados a la interfaz (usando dependency-cruiser), el tautológico casi no tiene dónde meterse.

### 7. Reglas en AGENTS.md (experiencia práctica)
- "no tautological tests" funciona, según @ucalyd.
- Pedir tests de contrato y no de implementación.
- Forzar TDD estricto empeora los resultados, según @VanTanev y Matt.
- Lo que deba pasar siempre conviene pasarlo de una regla escrita a un check ejecutable, como un hook o CI.

### Advertencias
- El mutation score también es un proxy. No es confiable si el código ya tiene el bug.
- Es caro: en un fixture chico, 7 veces más lento. Conviene mutar solo lo que cambió.
- Sin vigilancia, el agente puede volver a "perseguir el número" con el mutation score.
- Los LLM tienen sesgo de camino feliz: cubren poco null, vacíos, negativos y excepciones.

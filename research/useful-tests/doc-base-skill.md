# Material base para tu skill de testing

No es una SKILL.md terminada. Es material para que armes la tuya. La fuente de cada idea está entre corchetes, con el número de `referencias.md`.

## 1. Reglas candidatas

**Origen del valor esperado**
- El valor esperado de un test sale del requisito, del contrato o de la documentación. Nunca sale de leer la implementación. [26, 5, 15]
- Si no podés explicar qué requisito protege el test, no lo escribas. [14, 12]

**Qué testear**
- Prohibido el test tautológico: el que solo repite una constante, un mock o la lógica del código. [22, 23]
- Testeá en la interfaz pública del módulo, como lo usa quien lo llama. No testees funciones internas. [17, 18, 12]
- Escribí tests de contrato y no de detalle de implementación. Un refactor que no cambia el comportamiento no tiene que romper ningún test. [24, 12]
- "If the test would still pass when every function returned nothing, throw it out." [12]
- Cubrí bordes y casos raros a propósito: el valor límite exacto, null o undefined, vacío, negativo y el camino de error o excepción. [9, 11]
- Si existe una propiedad general, preferí property-based (fast-check en TS) a ejemplos sueltos. Por ejemplo: ida y vuelta (parse/serialize), invariantes, idempotencia, orden o comparación con un oráculo simple. [3, 4, 21]
- No pongas límites innecesarios en los generadores, como un largo máximo de lista si la propiedad vale para cualquiera. [4]

**Cómo medir y cuándo terminar**
- La métrica es el mutation score sobre el código que cambió, no la cobertura. Para cada mutante sobreviviente: agregá un assert que lo mate, o justificá que es equivalente. [1, 10, 11, 19]
- Antes de dar un test por bueno, rompé el código a propósito y verificá que el test falla. Mejor con la herramienta de mutación que a mano. [27, 28]
- Todo test tiene al menos un assert sobre el resultado observable. Un test que solo ejecuta código no cuenta. [2]
- Tiene que compilar, pasar estable y aportar algo. Si no aporta, se borra. [2]
- No subas tests para inflar una métrica, sea cobertura o cantidad. [15, 22]

**Mocks y TDD**
- Mockeá solo los bordes del sistema (red, reloj, base de datos) y nunca el módulo que estás testeando. [14]
- No fuerces TDD estricto. "Escribí el test que falla primero" está bien como guía, sin ser una ceremonia obligatoria. [20, 21]
- Si un test honesto es impracticable, no escribas uno malo. Avisá. [12]

## 2. Antipatrones en TS

```ts
// 1. Repetir una constante
export const X_POST_CHARACTER_LIMIT = 280;
it("limit", () => expect(X_POST_CHARACTER_LIMIT).toBe(280)); // ❌ nunca va a fallar por un bug

// ✅ testear el comportamiento que usa la constante
it("rechaza posts de 281 caracteres", () => {
  expect(validatePost("a".repeat(281)).ok).toBe(false);
  expect(validatePost("a".repeat(280)).ok).toBe(true); // el borde exacto
});
```

```ts
// 2. El valor esperado se calcula con la misma lógica que la implementación
it("aplica descuento", () => {
  const total = 200;
  expect(applyDiscount(total)).toBe(total * 0.9); // ❌ copia la fórmula del código
});
// ✅ el valor sale del requisito: "compras de más de $100 tienen 10% off"
it("200 con descuento queda en 180", () => expect(applyDiscount(200)).toBe(180));
it("100 no tiene descuento", () => expect(applyDiscount(100)).toBe(100)); // borde
```

```ts
// 3. Testear el mock y no el código
vi.mock("./repo");
it("guarda el usuario", async () => {
  await createUser({ name: "Ana" });
  expect(repo.save).toHaveBeenCalledWith({ name: "Ana" }); // ❌ verifica el cableado interno
});
// ✅ con un repo en memoria, ver el efecto observable
it("el usuario creado se puede leer", async () => {
  const app = makeApp({ repo: inMemoryRepo() });
  await app.createUser({ name: "Ana" });
  expect(await app.findUser("Ana")).toMatchObject({ name: "Ana" });
});
```

```ts
// 4. Sin assert real, o tragándose el error
it("procesa", () => { process(input); });                 // ❌ solo cobertura
it("procesa", () => { try { process(bad) } catch {} });  // ❌ el try oculta el bug [3]
it("existe", () => expect(process).toBeDefined());        // ❌
```

```ts
// 5. Snapshot gigante como único assert de la lógica
it("render", () => expect(calc(x)).toMatchSnapshot()); // ❌ congela lo que haya, aunque esté mal
```

```ts
// ✅ property-based con fast-check
import fc from "fast-check";
it("parse(serialize(x)) devuelve x", () => {
  fc.assert(fc.property(arbOrder, (o) => expect(parse(serialize(o))).toEqual(o)));
});
it("el total nunca es negativo", () => {
  fc.assert(fc.property(fc.array(arbItem), (items) => total(items) >= 0));
});
```

## 3. Gates ejecutables

Son mejores que las reglas que el modelo tiene que acordarse. [11]
- **Mutación sobre el diff**: Stryker en TS, con `--mutate` limitado a los archivos que cambiaron, o mutagate como hook de Claude Code o Codex. Definí el umbral según la línea base de tu repo; no copies el 80% a ciegas. [10, 11]
- **Límite de módulos**: con dependency-cruiser, prohibir que los archivos `*.test.ts` importen rutas internas del módulo y permitirles solo el entry point. [17]
- **Lint**: un test sin `expect`, `expect(CONST).toBe(literal)` o un `try/catch` vacío dentro de un test se marcan como error.
- **CI**: la suite de mutación completa corre nocturna o en cambios de riesgo, y la versión acotada al diff corre en cada PR. [11]

## 4. Prompts

**Detectar tautológicos.** Es el prompt textual de Thomas Dijkstra [23]:
> Create a dynamic workflow with the goal of finding tautological tests, tests that only re-assert the implementation. A tautological test is one that doesn't really test anything—it just restates the code it's supposed to be checking. example is a constant like X_POST_CHARACTER_LIMIT = 280 paired with a test that asserts expect(X_POST_CHARACTER_LIMIT).toBe(280). The test simply mirrors the implementation, so it can never catch a genuine bug; it only confirms that the number you wrote is the number you wrote. I want you to find as many as you can find possible and create a markdown artifact. And when you're done report to me the magnitude of it.

**Auditar y borrar.** Es una adaptación mía de las ideas de [12, 23, 25]:
> Revisá los tests de `<ruta>`. Para cada uno, respondé:
> 1. ¿Qué requisito protege?
> 2. ¿El valor esperado sale del requisito o del código?
> 3. ¿Seguiría pasando si la función devolviera vacío o null?
> 4. ¿Toca algo interno en lugar de la interfaz pública?
> 5. ¿Qué mutación concreta haría fallar este test?
>
> Clasificalos en **conservar**, **reescribir** (decí cómo) y **borrar** (decí por qué). No borres nada todavía. Armá una tabla en markdown y decime cuántos hay en cada grupo.

**Fortalecer con los sobrevivientes.** Adaptado de [1, 10, 11]:
> Corré `npx stryker run --mutate <archivos cambiados>`. Por cada mutante que sobrevivió, agregá el assert mínimo que lo mate, con un valor esperado que salga del requisito. Si creés que un mutante es equivalente, explicalo y no lo fuerces. No toques el código de producción.

**Property-based.** Adaptado del flujo de `/hypothesis` y del de Anthropic [3, 4]:
> 1. Leé `<módulo>` y cómo se usa en el repo.
> 2. Proponé propiedades basadas en tipos, docs y uso real.
> 3. Escribilas con fast-check, sin restringir los generadores de más.
> 4. Correlas y reflexioná. Si falló, ¿es un bug real o la propiedad está mal? Si pasó, ¿testea algo o es trivial?
> 5. Reportá los bugs con un contraejemplo mínimo.

## 5. Checklist de revisión de un test
- [ ] Nombra un comportamiento o requisito, no una función interna.
- [ ] El valor esperado no se calcula con la misma lógica del código.
- [ ] Usa solo la interfaz pública del módulo.
- [ ] Tiene al menos un assert sobre un resultado observable. No vale `toBeDefined` ni solo `toHaveBeenCalled`.
- [ ] Cubre el borde exacto y algún caso raro: null, vacío, negativo o error.
- [ ] No tiene try/catch ni snapshots que tapen el resultado.
- [ ] Mockea solo los bordes externos.
- [ ] Mata al menos un mutante que antes sobrevivía, o justifica por qué no.
- [ ] Un refactor que no cambia el comportamiento no lo rompe.
- [ ] Es determinístico: sin reloj real, sin red y sin orden de ejecución.
- [ ] Si lo borrás, ¿se pierde algo? Si no se pierde nada, se borra.

## 6. Límites para tener en cuenta
- El mutation score también se puede "gamear". Hay que revisar los asserts nuevos, no solo el número. [6, 5]
- Los mutantes equivalentes generan ruido. Tiene que haber una salida justificada, como el waiver con aprobación humana de mutagate. [10, 11]
- El LLM puede malinterpretar una propiedad sutil y reportar un falso bug, como pasó con dateutil y easter. [3, 4]
- Correr la mutación tiene un costo en tiempo y CI. [11]

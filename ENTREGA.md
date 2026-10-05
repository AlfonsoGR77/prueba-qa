# Entrega de la prueba técnica QA — Alfonso González

🎥 **Video (≤ 15 min):** https://youtu.be/y5NR9Tyr6_E

| | |
|---|---|
| **Empieza aquí** | [`qa/README.md`](qa/README.md): índice, resultados, entorno y uso de IA |
| **Resumen ejecutivo** | [`qa/01-plan-de-pruebas.md`](qa/01-plan-de-pruebas.md#resumen-ejecutivo): **no liberar todavía** (2 defectos de severidad Alta y 1 regla de negocio incumplida) |
| **Defectos** | [`qa/05-defectos.md`](qa/05-defectos.md): 8 defectos con capturas anotadas, causa raíz y test que los detecta |
| **Playwright** | [`e2e/README.md`](e2e/README.md): `npm run setup` (una vez) y luego `npm test` |

Este archivo y las carpetas `qa/`, `e2e/` y `.github/` son **nuevos**. También agregué tests unitarios (archivos `*_test.go`, `*.test.ts(x)`). **No se modificó ningún archivo existente del repositorio.** Se verifica con:

```bash
git diff --name-status 15765d9..HEAD   # solo aparecen archivos con estado A (agregado)
```

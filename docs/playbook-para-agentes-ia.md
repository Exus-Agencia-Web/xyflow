# Playbook para agentes de IA

## Objetivo operativo

Entregar cambios correctos con el menor riesgo posible en un monorepo multi-framework.

## Protocolo de trabajo recomendado

1. **Clasificar tarea**: React, Svelte, System o infraestructura.
2. **Mapear alcance**:
   - API pública afectada.
   - Componentes/hooks implicados.
   - Ejemplo existente para validar.
3. **Cambiar en capa mínima**:
   - Preferir `react` o `svelte` si es específico.
   - Usar `system` solo si el cambio es común a ambos.
4. **Validar**:
   - `pnpm lint`
   - `pnpm build`
   - tests aplicables (`pnpm test:react` / `pnpm test:svelte`)
5. **Verificar compatibilidad**:
   - Si se toca `system`, revisar impacto en ambos frameworks.

## Heurísticas de decisión

- Si un bug aparece en React y Svelte, empezar por `packages/system`.
- Si afecta render/UI de framework específico, empezar por `packages/react` o `packages/svelte`.
- Para regresiones de interacción, revisar primero ejemplos `Interaction`, `Overview`, `Stress`.
- Para edge paths o geometría, revisar utilidades exportadas de `@xyflow/system`.

## Checklist de calidad para PRs

- Cambio mínimo y localizado.
- Sin ruptura de APIs públicas sin justificación explícita.
- Sin dependencias nuevas innecesarias.
- Lint/build/tests ejecutados y documentados.
- Ejemplo reproducible asociado al cambio.

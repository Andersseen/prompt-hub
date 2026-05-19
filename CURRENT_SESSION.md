# Sesión Actual — Prompt Hub

> Este archivo se actualiza al final de cada sesión. Indica qué se hizo, qué está pendiente y cuál es el siguiente paso.

---

## Estado actual del proyecto

- Plan de mejoras creado: `IMPROVEMENTS_PLAN.md`
- **Fase 1 completada al 100%**
- **Fase 2 completada al 100%**
- **Fase 3 completada al 100%**
- Próxima fase a trabajar: **Fase 4 — Pulido & Performance**

---

## Historial de sesiones

### Sesión inicial
- **Fecha:** 2026-05-19
- **Fase:** —
- **Resumen:** Se analizó el proyecto completamente. Se creó el plan y este archivo.
- **No se modificó código fuente.**

### Sesión Fase 1 (completa)
- **Fecha:** 2026-05-19
- **Fase:** 1 — Crítico & Urgente
- **Resumen:** Reactividad inmutable, manejo de errores, Promise.all en refresh, validación Zod.
- **Tests:** `pnpm check` pasa.

### Sesión Fase 2 (completa)
- **Fecha:** 2026-05-19
- **Fase:** 2 — Arquitectura & Testing
- **Resumen:** AppDatabase inyectable, 7 stores especializados, tests de RoleStore y WorkspaceStore.
- **Tests:** `pnpm check` pasa (15 tests).

### Sesión Fase 3 (completa)
- **Fecha:** 2026-05-19
- **Fase:** 3 — Calidad & Robustez
- **Resumen:**
  - **3.1 CanDeactivate / dirty check:** Se creó `dirty-check.guard.ts` con interfaz `HasDirtyCheck`. Los 3 editores separados (agent, template, framework) emiten `dirtyChange` comparando `draft` vs `input` original. Los 3 editores inline (skills, roles, blocks) calculan `isDirty` comparando `editing*` signal vs el item original del store. Todas las 6 rutas de edición tienen `canDeactivate: [dirtyCheckGuard]`. Si hay cambios sin guardar, aparece `window.confirm` al navegar.
  - **3.2 Debounce en búsqueda y filtros:** `WorkspaceStore` ahora tiene `setSearch(value)` y `setTagFilter(value)` con `setTimeout` de 200ms. El dashboard usa estos métodos en lugar de setear signals directamente.
  - **3.3 Indicador de "saving":** Añadido `saving = signal(false)` en `WorkspaceStore`. Todos los métodos `save*`, `duplicate` y `delete` setean `saving(true)` al inicio y `saving(false)` en `finally`. Los 7 botones Save (3 editores separados + 3 inline + settings) ahora tienen `[disabled]="store.saving()"`.
  - **3.4 Manejo de errores en parseImport:** Ya implementado en Fase 1.4 (try/catch para JSON/YAML malformado + Zod safeParse).
- **Tests:** `pnpm check` pasa (typecheck, lint, vitest 15 tests, build).
- **Archivos nuevos:**
  - `src/app/core/guards/dirty-check.guard.ts`
- **Archivos modificados:**
  - `src/app/app.routes.ts`
  - `src/app/core/services/workspace-store.service.ts`
  - `src/app/features/agents/agents-page.component.ts`
  - `src/app/features/agents/agent-editor.component.ts`
  - `src/app/features/templates/templates-page.component.ts`
  - `src/app/features/templates/template-editor.component.ts`
  - `src/app/features/frameworks/frameworks-page.component.ts`
  - `src/app/features/frameworks/framework-editor.component.ts`
  - `src/app/features/skills/skills-page.component.ts`
  - `src/app/features/roles/roles-page.component.ts`
  - `src/app/features/prompt-blocks/prompt-blocks-page.component.ts`
  - `src/app/features/settings/settings-page.component.ts`
  - `src/app/features/dashboard/prompt-hub-dashboard.component.ts`

---

## Próxima sesión: Fase 4.1 — Centralizar configuración de rutas/navegación

### Objetivo
Eliminar duplicación de mapeos de rutas, labels e iconos en múltiples archivos.

### Archivos a revisar
1. `src/app/app.routes.ts`
2. `src/app/features/dashboard/prompt-hub-dashboard.component.ts`
3. `src/app/core/services/workspace-store.service.ts`

### Criterios de aceptación
- [ ] Crear `src/app/core/models/navigation.ts` con array `APP_SECTIONS` centralizado.
- [ ] Derivar rutas, labels y títulos de ese array.
- [ ] `pnpm check` pasa.

### Notas / Bloqueos
- _Vacío por ahora._

---

## Checklist global del plan

- [x] **Fase 1 — Crítico & Urgente**
  - [x] 1.1 Reactividad inmutable en editores
  - [x] 1.2 Manejo de errores en WorkspaceStore
  - [x] 1.3 Race condition en refresh()
  - [x] 1.4 Validación robusta de importación (Zod)
- [x] **Fase 2 — Arquitectura & Testing**
  - [x] 2.1 Inyectar AppDatabase
  - [x] 2.2 Refactor WorkspaceStore (God Object)
  - [x] 2.3 Formularios reactivos en editores — pospuesto, patrón draft es suficiente
  - [x] 2.4 Tests unitarios de stores críticos
- [x] **Fase 3 — Calidad & Robustez**
  - [x] 3.1 CanDeactivate / dirty check
  - [x] 3.2 Debounce en búsqueda
  - [x] 3.3 Indicador de "saving"
  - [x] 3.4 Manejo de errores en parseImport
- [ ] **Fase 4 — Pulido & Performance**
  - [ ] 4.1 Centralizar navegación
  - [ ] 4.2 Migraciones Dexie
  - [ ] 4.3 Tests E2E flujos críticos
  - [ ] 4.4 Optimizar refresh()

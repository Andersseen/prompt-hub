# Sesión Actual — Prompt Hub

> Este archivo se actualiza al final de cada sesión. Indica qué se hizo, qué está pendiente y cuál es el siguiente paso.

---

## Estado actual del proyecto

- Plan de mejoras creado: `IMPROVEMENTS_PLAN.md`
- **Fase 1 completada al 100%**
- **Fase 2 completada al 100%**
- Próxima fase a trabajar: **Fase 3 — Calidad & Robustez**

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
- **Resumen:** Reactividad inmutable en 6 editores, manejo de errores en WorkspaceStore, Promise.all en refresh, validación Zod en import.
- **Tests:** `pnpm check` pasa.

### Sesión Fase 2 (completa)
- **Fecha:** 2026-05-19
- **Fase:** 2 — Arquitectura & Testing
- **Resumen:**
  - **2.1 Inyectar AppDatabase:** `AppDatabase` ahora es `@Injectable({ providedIn: 'root' })`. Se eliminó la instancia global `appDatabase`. `SeedService`, `ExportImportService` y los 8 repositorios ahora inyectan `AppDatabase`. Tests actualizados.
  - **2.2 Refactor WorkspaceStore:** Se extrajeron 7 stores especializados (`AgentStore`, `PromptBlockStore`, `PromptFrameworkStore`, `PromptTemplateStore`, `RoleStore`, `SettingsStore`, `SkillStore`) en `src/app/core/state/`. Cada store maneja signal + CRUD de su entidad. `WorkspaceStore` ahora actúa como orquestador: delega operaciones a los stores especializados y mantiene la interfaz pública compatible (ningún componente de la UI se vio afectado).
  - **2.3 Formularios reactivos:** Se evaluó y se decidió **posponer**. El patrón `draft` signal + one-way binding implementado en Fase 1.1 es funcionalmente equivalente para este caso de uso. La migración a `ReactiveFormsModule` se reevaluará en Fase 3.1 cuando se implemente `CanDeactivate` / dirty check, donde el patrón draft puede usarse directamente para detectar cambios sin guardar.
  - **2.4 Tests unitarios:** Se crearon tests para `RoleStore` (4 tests: load, save, duplicate, delete) y `WorkspaceStore` (4 tests: init, filterByQuery, filterByTags, notify). Total: 15 tests pasando.
- **Tests:** `pnpm check` pasa (typecheck, lint, vitest 15 tests, build).
- **Archivos nuevos:**
  - `src/app/core/state/agent.store.ts`
  - `src/app/core/state/prompt-block.store.ts`
  - `src/app/core/state/prompt-framework.store.ts`
  - `src/app/core/state/prompt-template.store.ts`
  - `src/app/core/state/role.store.ts`
  - `src/app/core/state/settings.store.ts`
  - `src/app/core/state/skill.store.ts`
  - `src/app/core/state/role.store.spec.ts`
  - `src/app/core/services/workspace-store.service.spec.ts`
- **Archivos modificados:**
  - `src/app/core/db/app-database.ts`
  - `src/app/core/repositories/entity-repositories.ts`
  - `src/app/core/services/seed.service.ts`
  - `src/app/core/services/export-import.service.ts`
  - `src/app/core/services/export-import.service.spec.ts`
  - `src/app/core/services/workspace-store.service.ts`

---

## Próxima sesión: Fase 3.1 — CanDeactivate / dirty check

### Objetivo
Implementar confirmación al salir de una ruta si hay cambios sin guardar en el editor.

### Estrategia
Como los editores ya usan el patrón `draft` signal (Fase 1.1), se puede comparar `draft` contra el `input` original para detectar cambios sin guardar. No se requiere `ReactiveFormsModule`.

### Archivos a revisar
1. `src/app/features/agents/agents-page.component.ts`
2. `src/app/features/templates/templates-page.component.ts`
3. `src/app/features/frameworks/frameworks-page.component.ts`
4. `src/app/features/skills/skills-page.component.ts`
5. `src/app/features/roles/roles-page.component.ts`
6. `src/app/features/prompt-blocks/prompt-blocks-page.component.ts`
7. `src/app/app.routes.ts`

### Criterios de aceptación
- [ ] Al navegar fuera de una página con cambios sin guardar, aparece confirmación.
- [ ] Si el usuario confirma, se descartan los cambios y se navega.
- [ ] Si el usuario cancela, permanece en la página.
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
- [ ] **Fase 3 — Calidad & Robustez**
  - [ ] 3.1 CanDeactivate / dirty check
  - [ ] 3.2 Debounce en búsqueda
  - [ ] 3.3 Indicador de "saving"
  - [ ] 3.4 Manejo de errores en parseImport
- [ ] **Fase 4 — Pulido & Performance**
  - [ ] 4.1 Centralizar navegación
  - [ ] 4.2 Migraciones Dexie
  - [ ] 4.3 Tests E2E flujos críticos
  - [ ] 4.4 Optimizar refresh()

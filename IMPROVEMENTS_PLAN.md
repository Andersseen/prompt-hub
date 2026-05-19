# Plan de Mejoras — Prompt Hub

> **Filosofía:** Una fase a la vez, bien hecha. Sin nuevas features, solo arreglos, refactor y calidad.

---

## Índice

1. [Cómo usar este plan](#cómo-usar-este-plan)
2. [Fase 1 — Crítico & Urgente](#fase-1--crítico--urgente)
3. [Fase 2 — Arquitectura & Testing](#fase-2--arquitectura--testing)
4. [Fase 3 — Calidad & Robustez](#fase-3--calidad--robustez)
5. [Fase 4 — Pulido & Performance](#fase-4--pulido--performance)
6. [Registro de sesiones](#registro-de-sesiones)

---

## Cómo usar este plan

- En cada sesión se trabaja **una sola fase** (o incluso un solo punto dentro de una fase).
- Al finalizar la sesión, se actualiza `CURRENT_SESSION.md` con lo hecho y el siguiente paso.
- No saltar fases. Si algo bloquea, se documenta y se decide si continuar o pivotar.

---

## Fase 1 — Crítico & Urgente

> Objetivo: Eliminar bugs de reactividad, errores silenciosos y riesgos de integridad de datos.

### 1.1 Reactividad inmutable en editores
- **Problema:** Los editores (`agent-editor`, `template-editor`, `framework-editor`, etc.) mutan objetos recibidos por `input()` directamente (`a.name = ...`, `a.tags = ...`). Esto rompe la reactividad de signals y puede generar efectos secundarios impredecibles.
- **Acción:**
  1. Auditar todos los componentes `*-editor.component.ts`.
  2. Reemplazar mutaciones directas por emisión de copias/clones.
  3. Usar `structuredClone` en el componente padre al recibir el evento de guardado.
- **Archivos afectados:**
  - `src/app/features/agents/agent-editor.component.ts`
  - `src/app/features/templates/template-editor.component.ts`
  - `src/app/features/frameworks/framework-editor.component.ts`
  - `src/app/features/roles/roles-page.component.ts` (si tiene editor inline)
  - `src/app/features/skills/skills-page.component.ts`

### 1.2 Manejo de errores en operaciones async del `WorkspaceStore`
- **Problema:** `saveAgent`, `delete`, `duplicate`, etc. no tienen `try/catch`. Si IndexedDB falla (quota exceeded, transacción abortada), la app queda en estado `loading = true` o crashea sin feedback.
- **Acción:**
  1. Envolver todas las operaciones async del store en `try/catch`.
  2. En el `catch`, setear `loading.set(false)` y notificar el error via `toast`.
  3. Decidir si se propaga el error o se swallow (por ahora, log + toast).
- **Archivos afectados:**
  - `src/app/core/services/workspace-store.service.ts`

### 1.3 Race condition en `refresh()` y carga eficiente
- **Problema:** `refresh()` hace `await` secuenciales. Si se llama múltiples veces rápido, los resultados pueden llegar desordenados.
- **Acción:**
  1. Usar `Promise.all` para cargar repositorios independientes en paralelo.
  2. Considerar un flag interno `isRefreshing` para ignorar llamadas simultáneas.
- **Archivos afectados:**
  - `src/app/core/services/workspace-store.service.ts`

### 1.4 Validación robusta de importación
- **Problema:** `validateWorkspaceExport` solo chequea `id` y `name`. No valida tipos ni relaciones.
- **Acción:**
  1. Instalar `zod` como dependencia.
  2. Crear schemas Zod para cada entidad y `WorkspaceExport`.
  3. Reemplazar la validación manual por `WorkspaceExportSchema.parse(data)`.
  4. Mejorar mensajes de error para el usuario.
- **Archivos afectados:**
  - `src/app/core/services/export-import.service.ts`
  - Nuevo: `src/app/core/models/entity-schemas.ts`

---

## Fase 2 — Arquitectura & Testing

> Objetivo: Mejorar la estructura del código, testabilidad y cobertura de tests.

### 2.1 Inyectar `AppDatabase` en lugar de instancia global
- **Problema:** `ExportImportService` y `SeedService` importan `appDatabase` directamente. Dificulta testing con mocks.
- **Acción:**
  1. Convertir `appDatabase` en un provider inyectable (`InjectionToken` o clase `@Injectable`).
  2. Actualizar todos los servicios que lo usan para usar `inject(AppDatabase)`.
- **Archivos afectados:**
  - `src/app/core/db/app-database.ts`
  - `src/app/core/services/export-import.service.ts`
  - `src/app/core/services/seed.service.ts`
  - Tests relacionados

### 2.2 Refactor del `WorkspaceStore` (God Object)
- **Problema:** 178 líneas, mezcla estado de 7 entidades, lógica de filtrado, toast y loading.
- **Acción:**
  1. Crear stores especializados por feature: `AgentStore`, `TemplateStore`, etc.
  2. Cada store maneja solo signals, operaciones CRUD y filtros locales de su entidad.
  3. `WorkspaceStore` se convierte en orquestador: inyecta los stores especializados, coordina `init()` y `refresh()`, y mantiene estado global mínimo (`workspace`, `settings`, `loading`).
  4. Mover `filterByQuery` a un utility puro o a cada store.
- **Archivos nuevos:**
  - `src/app/core/state/agent.store.ts`
  - `src/app/core/state/template.store.ts`
  - `src/app/core/state/framework.store.ts`
  - `src/app/core/state/role.store.ts`
  - `src/app/core/state/skill.store.ts`
  - `src/app/core/state/block.store.ts`
- **Archivos modificados:**
  - `src/app/core/services/workspace-store.service.ts` → `src/app/core/state/workspace.store.ts`

### 2.3 Migrar editores a Formularios Reactivos (`ReactiveFormsModule`)
- **Problema:** Binding manual con mutación directa. Difícil de validar, testear y mantener.
- **Acción:**
  1. Implementar `FormGroup` en cada editor.
  2. Definir validadores (`Validators.required`, `maxLength`, etc.).
  3. Emitir el valor del formulario al guardar en lugar de mutar el input.
  4. Aprovechar para detectar estado "dirty" y más adelante implementar `CanDeactivate`.
- **Archivos afectados:**
  - Todos los `*-editor.component.ts`

### 2.4 Añadir tests unitarios de componentes críticos
- **Problema:** Solo hay tests de servicios. Los componentes no tienen cobertura.
- **Acción:**
  1. Testear `ImportExportPageComponent` con `@testing-library/angular`.
  2. Testear `AgentEditorComponent` con formulario reactivo.
  3. Testear `WorkspaceStore` con `fake-indexeddb`.
- **Archivos nuevos:**
  - `src/app/features/import-export/import-export-page.component.spec.ts`
  - `src/app/features/agents/agent-editor.component.spec.ts`
  - `src/app/core/state/workspace.store.spec.ts`

---

## Fase 3 — Calidad & Robustez

> Objetivo: Mejorar UX, evitar pérdida de datos y robustecer flujos.

### 3.1 Confirmación al salir con cambios sin guardar (`CanDeactivate`)
- **Problema:** Si editas un agente, cambias de ruta y vuelves, pierdes cambios.
- **Acción:**
  1. Implementar función `hasUnsavedChanges()` en editores (aprovechando el formulario reactivo).
  2. Crear guard `unsavedChangesGuard` que use `window.confirm` si hay cambios pendientes.
  3. Aplicar a rutas de edición.
- **Archivos nuevos:**
  - `src/app/core/guards/unsaved-changes.guard.ts`
- **Archivos modificados:**
  - `src/app/app.routes.ts`

### 3.2 Debounce en búsqueda y filtros
- **Problema:** `search` y `tagFilter` actualizan en cada keystroke.
- **Acción:**
  1. Implementar debounce de 200ms en `WorkspaceStore` o en componente de header.
  2. Puede hacerse con RxJS (`debounceTime`) o con un `setTimeout` limpio si se prefiere evitar RxJS en signals.
- **Archivos afectados:**
  - `src/app/core/services/workspace-store.service.ts` o `dashboard-header.component.ts`

### 3.3 Indicador de "saving" por operación
- **Problema:** Usuario no sabe si la operación de guardado está en curso.
- **Acción:**
  1. Añadir `savingEntityId = signal<string | null>(null)` en cada store especializado.
  2. Deshabilitar botón de guardar y mostrar spinner mientras `savingEntityId` coincide.
- **Archivos afectados:**
  - Componentes editores
  - Stores especializados

### 3.4 Mejorar manejo de errores en `parseImport`
- **Problema:** `JSON.parse` sin try/catch específico.
- **Acción:**
  1. Envolver `JSON.parse` en try/catch con mensaje amigable.
  2. Diferenciar errores de JSON malformado vs validación Zod.
- **Archivos afectados:**
  - `src/app/core/services/export-import.service.ts`

---

## Fase 4 — Pulido & Performance

> Objetivo: Refinar la experiencia, optimizar y documentar.

### 4.1 Centralizar configuración de rutas/navegación
- **Problema:** Mapeos de rutas duplicados en varios archivos.
- **Acción:**
  1. Crear `src/app/core/models/navigation.ts` con array `APP_SECTIONS` centralizado.
  2. Derivar tipos, labels e iconos de ahí.
- **Archivos afectados:**
  - `src/app/app.routes.ts`
  - `src/app/features/dashboard/prompt-hub-dashboard.component.ts`
  - `src/app/core/services/workspace-store.service.ts`

### 4.2 Migraciones de schema en Dexie
- **Problema:** `SCHEMA_VERSION` está hardcodeado sin migraciones reales.
- **Acción:**
  1. Definir versiones de schema en Dexie (`this.version(2).stores({...}).upgrade(...)`).
  2. Documentar cómo añadir migraciones futuras.
- **Archivos afectados:**
  - `src/app/core/db/app-database.ts`

### 4.3 Tests E2E para flujos críticos
- **Problema:** Solo 2 tests básicos.
- **Acción:**
  1. E2E: Crear agente → verificar en lista.
  2. E2E: Exportar → copiar → importar → verificar datos.
  3. E2E: Editar template → cambiar ruta → confirmar dirty check.
- **Archivos nuevos/modificados:**
  - `e2e/dashboard.spec.ts`

### 4.4 Revisar renders completos en `refresh()`
- **Problema:** `refresh()` recarga todo el workspace en signals.
- **Acción:**
  1. Evaluar si la carga por página/feature reduce re-renders innecesarios.
  2. Si no hay problema de performance real, documentar la decisión.

---

## Registro de sesiones

| Sesión | Fecha | Fase trabajada | Tareas completadas | Próxima sesión |
|--------|-------|----------------|-------------------|----------------|
| — | — | — | — | Ver `CURRENT_SESSION.md` |

> Nota: el registro detallado de cada sesión vive en `CURRENT_SESSION.md`.

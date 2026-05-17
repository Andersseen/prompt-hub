# Prompt Hub

Prompt Hub is a local-first workspace for building, organizing, reusing, importing and exporting structured prompts, skills, roles and agents.

The core idea is simple:

> Define once. Reuse anywhere.

It is designed for developers and AI-heavy workflows across tools like ChatGPT, Claude, Cursor, Windsurf, VS Code, GitHub Copilot, custom agents and CLI tools.

## Features

- Local-first storage with IndexedDB and Dexie
- No login, backend, auth, remote database or automatic sync
- Agents, roles, skills, prompt frameworks, prompt templates and reusable prompt blocks
- Seed workspace so the app does not start empty
- Markdown preview and copy-to-clipboard workflows
- JSON, YAML and Markdown export
- JSON/YAML import with replace strategy
- AnalogJS, Angular, TypeScript, Tailwind CSS, Volt UI and angular-movement
- Vitest, Testing Library, Playwright and Axe accessibility checks

## Tech Stack

- [AnalogJS](https://analogjs.org/)
- [Angular](https://angular.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Volt UI](https://www.npmjs.com/package/@voltui/components)
- [angular-movement](https://www.npmjs.com/package/angular-movement)
- [Dexie](https://dexie.org/)
- IndexedDB
- YAML and Markdown export formats

## Local-First Promise

Prompt Hub stores data locally in your browser using IndexedDB.

It does not include:

- backend services
- user accounts
- authentication
- remote database
- automatic cloud sync
- analytics

Export your workspace regularly if you want to move it to another browser or device.

## Getting Started

### Requirements

- Node.js `>=20.19.1`
- pnpm `>=10`

### Install

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open `http://localhost:5173/`.

If that port is busy, Vite will choose the next available port.

### Build

```bash
pnpm build
```

### Preview

```bash
pnpm preview
```

## Quality Checks

Run the full local check:

```bash
pnpm check
```

This runs:

- TypeScript typecheck
- ESLint
- Vitest
- production build

Run Playwright separately:

```bash
pnpm e2e
```

The E2E suite includes an Axe accessibility check for the dashboard shell.

## Project Structure

```txt
src/
  app/
    core/
      db/
      models/
      repositories/
      services/
      utils/
    features/
      dashboard/
      import-export/
      prompt-blocks/
      settings/
    pages/
    shared/
      ui/
```

## Export Formats

Prompt Hub supports:

- JSON for full workspace backups
- YAML for human-readable workspace backups
- Markdown for agents, skills, roles, prompt templates and workspace summaries

Current import strategy:

- Replace current workspace

Planned:

- Merge import strategy
- More granular entity import

## Development Principles

- Local-first by default
- No backend until there is a strong reason
- Small focused services
- Signals for local UI state
- Standalone Angular components
- Strict TypeScript
- Accessible UI with WCAG AA targets
- Portable export formats

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Security

Please report security concerns using the process described in [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)

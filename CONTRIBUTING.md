# Contributing

Thanks for your interest in improving Prompt Hub.

## Development Setup

```bash
pnpm install
pnpm dev
```

## Before Opening a Pull Request

Run:

```bash
pnpm check
pnpm e2e
```

## Pull Request Guidelines

- Keep changes focused and easy to review.
- Prefer small components and small services.
- Keep the app local-first. Do not add backend, auth or remote sync without an issue and design discussion.
- Add or update tests when behavior changes.
- Keep exports portable and human-readable.
- Follow the existing Angular, TypeScript and accessibility patterns.

## Commit Style

Use clear, imperative commit messages:

```txt
Add prompt block export preview
Fix workspace import validation
Refactor dashboard sidebar navigation
```

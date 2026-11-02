# Repository Guidelines

## Project Structure & Module Organization

This repository provides TypeScript helpers for k6 performance tests.

- `src/rest-util/` contains the current reusable REST client, header helpers, and shared request types. Export public APIs through `src/rest-util/index.ts`.
- `src/grpc-util/` contains the generic gRPC client, method typing, and its public `index.ts`.
- `src/rest/` contains older REST helpers. Prefer `src/rest-util/` for new work and avoid adding dependencies on the legacy directory.
- `src/token.ts` handles OAuth client-credentials tokens.
- `tests/` contains standalone k6 examples such as `rest-example-test.ts` and `grpc-example-test.ts`.
- Compiled output is configured for `dist/`; do not commit generated files or `node_modules/`.

## Build, Test, and Development Commands

- `npm ci` installs the exact dependency versions from `package-lock.json`.
- `npx tsc --noEmit` performs strict type-checking of files under `src/`.
- `npx prettier --check "src/**/*.ts" "tests/**/*.ts"` checks formatting.
- `npx prettier --write "src/**/*.ts" "tests/**/*.ts"` formats changed TypeScript files.

`npm test` is currently a placeholder and intentionally fails. The example tests use bundler-style imports; bundle them before executing with `k6 run <bundle.js>`. When adding a build or test runner, expose it through `package.json` scripts.

## Coding Style & Naming Conventions

Use strict TypeScript and four-space indentation. Prefer double quotes, trailing commas in multiline constructs, explicit return types for exported functions, and `import type` for type-only dependencies. Use:

- `PascalCase` for classes, interfaces, and type aliases.
- `camelCase` for variables, functions, and methods.
- kebab-case filenames, for example `grpc-client.ts`.

Keep utilities service-agnostic. Put service-specific endpoints, RPC names, payload types, and credentials in consuming tests rather than shared clients.

## Testing Guidelines

Name k6 scripts `*-test.ts`. Keep REST and gRPC scenarios separate, tag requests with stable operation names, and validate responses with k6 `check()`. Use environment variables such as `REST_BASE_URL`, `GRPC_ENDPOINT`, `CLIENT_ID`, and `CLIENT_SECRET`; defaults should only target safe public test services. Run `npx tsc --noEmit` before submitting changes.

## Commit & Pull Request Guidelines

History currently contains only `initial perf utils`, so no formal convention exists. Use short imperative subjects, optionally scoped, such as `grpc: support reflection-based clients`. Pull requests should describe behavior changes, list validation commands, link relevant issues, and document any new environment variables. Include representative k6 output for test-client changes; screenshots are unnecessary unless visual tooling is introduced.

## Security & Configuration

Never commit tokens, client secrets, private certificates, or internal endpoints. Pass authorization through environment variables or per-request gRPC metadata, and redact credentials from logs.

## Agent-Specific Instructions

Treat the repository as read-only by default. Reading and non-mutating diagnostics are allowed. Before creating, editing, deleting, renaming, formatting, or generating files, describe the proposed changes and obtain explicit user approval. After approval, make only the approved changes and ask again before expanding scope.

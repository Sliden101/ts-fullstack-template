# Contributing

Thanks for contributing. This document summarizes the workflow; see
[`AGENTS.md`](AGENTS.md) for architecture rules and commands.

## Setup

```bash
npm install
cp .env.example .env
docker compose up -d db
npm run db:migrate && npm run seed:admin
npm run dev
```

## Before you open a pull request

```bash
npm run lint
npm run typecheck
npm run test
```

All three must pass. If you changed the schema, commit the generated migration.
If you changed an architectural boundary, update or add an ADR.

## Conventions

- Conventional commit messages (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`).
- Keep pull requests small and single-purpose.
- New behavior needs a test at an existing seam (HTTP/GraphQL boundary, contract
  parsing, or rendered UI).
- Never commit secrets.

## Branching and releases

See [`docs/branching.md`](docs/branching.md).

# Branching and releases

## Branches

- `main` is always green and deployable. It is protected: changes land via pull
  request with CI passing.
- Work happens on short-lived branches named for the change, for example
  `feat/customer-import`, `fix/session-expiry`, `chore/bump-drizzle`.
- Rebase on `main` before merging. Keep pull requests small and single-purpose.

## Commits

Use conventional-commit prefixes so history is scannable and changelogs can be
generated later: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.

## Pull requests

- CI must pass: lint, typecheck, test, build, and the server e2e job.
- New behavior requires a test at an existing seam (see `AGENTS.md`).
- Schema changes include a committed migration and a note in `docs/database.md`
  if the workflow changes.
- Architecture changes update or add an ADR in `docs/adr/`.

## Releases

- Tag releases from `main`: `vX.Y.Z`.
- Deploy by building the images from the tag and applying migrations (see
  `docs/deployment.md`).
- Breaking wire-contract changes bump the major version and are rolled out with
  an expand → migrate → contract sequence.

## Using this as a template

`npm run init` can reset git history so a new project starts clean. After that,
follow the branching model above from the first commit.

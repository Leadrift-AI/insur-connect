# Contributing to Leadrift AI

Thanks for contributing! Please follow these rules to keep our workflow clean.

## Branching

* **main** → Production branch (stable, tagged releases only)
* **develop** → Integration branch (staging/testing)
* **feature/<scope>-<desc>** → New features
* **chore/<desc>** → Maintenance/cleanup
* **hotfix/<desc>** → Emergency production fixes

## Commits

We use **Conventional Commits**:

* `feat:` → New feature
* `fix:` → Bug fix
* `chore:` → Maintenance, cleanup
* `docs:` → Documentation
* `refactor:` → Refactoring
* `test:` → Adding or updating tests

Example:

```
git commit -m "feat(csv): add bulk import RPC with validation"
```

## Pull Requests

* **Target `develop`** (unless hotfix → `main`).
* Must pass CI (`CI / build`).
* All commits must be **signed**.
* For `main`: requires **1 approval**.
* For `develop`: requires CI, **0 approvals**.

PR checklist:

* [ ] Builds successfully (CI green)
* [ ] Screenshots/GIFs attached for UI changes
* [ ] Changelog entry updated if relevant
* [ ] Tests added/updated (if applicable)

## Releases

* `develop → main` PRs produce a release.
* Tag using **semantic versioning**:

  * `v0.1.x` → Patch fixes
  * `v0.2.0` → Minor features
* Update `CHANGELOG.md` with release notes.

## Security

* Do not commit secrets. Use `.env` and GitHub Actions secrets.
* Vulnerabilities → report via [SECURITY.md](SECURITY.md).
---
name: release
description: >
  Automated release for rfc-bcp47. One human approval ("yes" or override) plus
  CI watch — everything else is silent. Pre-flight runs npm-trust-cli --doctor
  to validate trust state; the actual publish happens via tag-triggered CI
  with OIDC + provenance. Invoke with /release after committing your work.
---

# Release

Three-phase flow. Each phase has a single goal and a clear stop condition.

- **Phase A** runs in silence if everything is green. Surface only failures.
- **Phase B** has the only routine human checkpoint: one summary, one answer.
- **Phase C** runs end-to-end after approval. Halt on first failure.

The orchestration here matches the npm-trust-cli release skill in spirit but
is simpler — rfc-bcp47 is a single-package library with no e2e and no
first-publish ceremony (already trust-bootstrapped at v1.2.0).

## Phase A — Pre-flight

### A.1 Working tree must be clean

```bash
git status --porcelain
```

If non-empty, **STOP**. Tell the user to commit or stash first. Do not
proceed.

### A.2 Local gates

```bash
pnpm run lint && pnpm test && pnpm run build
```

If any step fails, **STOP** and surface the error.

### A.3 Trust + environment doctor

```bash
pnpm exec npm-trust-cli --doctor --json --workflow release.yml
```

Parse the JSON. Branch on `summary` and `issues[].code`:

| Condition | Action |
|---|---|
| `summary.fail > 0` | **STOP**, surface the failing issue. Examples: `NODE_TOO_OLD`. |
| `WORKSPACE_NOT_DETECTED`, `REPO_NO_REMOTE`, `WORKFLOWS_NONE` | **STOP**. Release can't proceed without a workspace, remote, or workflow file. |
| `PACKAGE_NOT_PUBLISHED` for `rfc-bcp47` | **STOP** with a clear message. The package is at 1.2.0; if doctor reports it as unpublished something is wrong (network or auth). Do **not** try to bootstrap from local. |
| `AUTH_NOT_LOGGED_IN` | **Ignore.** Tag-triggered CI publishes via OIDC; local auth doesn't matter. |
| `PACKAGE_TRUST_DISCREPANCY` | **Ignore (informational).** rfc-bcp47 lives in this state — registry has provenance even when `npm trust list` is empty. Proceed. |
| `WORKFLOWS_AMBIGUOUS` | Should not fire — we passed `--workflow release.yml`. If it does, **STOP** and ask the user which workflow is the publish workflow. |
| Any other warn | Surface but proceed. |

Phase A passes silently for the typical case (single package, already
trusted, gates green). Move to Phase B.

## Phase B — Plan and confirm

### B.1 Find the latest tag

```bash
git tag --list 'v*' --sort=-v:refname | head -1
```

Call this `LATEST_TAG`. If empty, **STOP** — rfc-bcp47 is past its initial
release; no tag means something is misconfigured.

### B.2 Collect commits since `LATEST_TAG`

```bash
git log "${LATEST_TAG}..HEAD" --format='%H %s'
```

Parse each line as a conventional commit: `type(scope)?(!)?: subject`. Drop
commits that don't match the convention (typically merges).

Group the parsed commits into:

- **Breaking** — type ends with `!` OR body contains `BREAKING CHANGE:`
- **Features** — `feat`
- **Fixes** — `fix`
- **Performance** — `perf`
- **Reverts** — `revert`
- **Other** — `chore`, `docs`, `test`, `build`, `ci`, `style`, `refactor` (informational only; not surfaced to the user unless nothing else is present)

### B.3 Decide the bump

Highest applicable wins:

| Condition | Bump |
|---|---|
| Any Breaking commit | major |
| Any Features commit (and no Breaking) | minor |
| Any Fix / Performance / Revert commit (and no Features / Breaking) | patch |
| Only Other commits | **STOP** — nothing to release |

Call the result `NEXT_VERSION`.

### B.4 Render the CHANGELOG draft

Prepend a section to `CHANGELOG.md` (do not write yet — render in memory):

```markdown
## [NEXT_VERSION](https://github.com/gagle/rfc-bcp47/compare/LATEST_TAG...vNEXT_VERSION) (YYYY-MM-DD)

### Breaking Changes

- subject ([hash](https://github.com/gagle/rfc-bcp47/commit/hash))

### Features

- subject ([hash](https://github.com/gagle/rfc-bcp47/commit/hash))

### Bug Fixes

- subject ([hash](https://github.com/gagle/rfc-bcp47/commit/hash))

### Performance

- subject ([hash](https://github.com/gagle/rfc-bcp47/commit/hash))
```

Only include sections with entries.

### B.5 Show ONE summary, ask ONE question

Render to the user:

```
Release plan:
  Version       v{LATEST_VERSION} → v{NEXT_VERSION}  ({bump} — {N feat, M fix, ...})
  Commits       {N} since {LATEST_TAG}
                  {type}: {subject} ({hash})
                  ...
  Trust         ✓ already configured (provenance present for v{LATEST_VERSION})
  CHANGELOG     {first 4 lines visible; "expand" to show the full draft}

Proceed? (yes / version=X.Y.Z / edit changelog / abort)
```

Wait for the user's answer. **Do not act yet.**

- `yes` → continue to Phase C
- `version=X.Y.Z` → set `NEXT_VERSION = X.Y.Z`, re-render the summary at B.5, ask again
- `edit changelog` → open the CHANGELOG draft in `$EDITOR`, on save re-render summary, ask again
- `abort` → no state changes; end the skill

There is no fallback to multi-prompt mode. One summary, one answer.

## Phase C — Execute

After `yes` at B.5, run all of the following without further user interaction.
Halt on the first failure.

### C.1 Apply the CHANGELOG and version

1. Prepend the rendered CHANGELOG entry to `CHANGELOG.md`.
2. Update `package.json#version` to `NEXT_VERSION`.

### C.2 Commit

```bash
git add CHANGELOG.md package.json
git commit -m "chore: release v${NEXT_VERSION}"
```

### C.3 Push

```bash
git push
```

### C.4 Final pre-tag verification

Re-run gates against the bumped version. Aborts here are rare but not
hypothetical (a test that depends on `package.json#version`, for example).

```bash
pnpm run lint && pnpm test && pnpm run build
```

If anything fails, **STOP**. Recovery: fix the issue, restart the skill from
Phase A. The release commit is on origin but no tag has been pushed yet, so
the workflow won't run.

### C.5 Tag and push the tag

```bash
git tag "v${NEXT_VERSION}"
git push --tags
```

This triggers `.github/workflows/release.yml`, which runs lint → test → build
→ `pnpm publish --no-git-checks --provenance --access public` against the
GitHub OIDC token.

### C.6 Watch CI

```bash
gh run watch --exit-status
```

If CI fails, **STOP** and surface the error. The tag is on origin (intentional
record of intent); recovery is `gh run rerun <id>` after fixing the cause.
**Do not** bump version unless the tarball needs new content.

### C.7 Verify on the registry

```bash
npm view "rfc-bcp47@${NEXT_VERSION}" version
npm view "rfc-bcp47@${NEXT_VERSION}" dist.attestations
```

The second call should show `provenance: { predicateType: "https://slsa.dev/provenance/v1" }`.

### C.8 Final notification

Print to the user:

```
Released v${NEXT_VERSION} to npm.
  Tarball: https://www.npmjs.com/package/rfc-bcp47/v/${NEXT_VERSION}
  CI:      <gh run url>
```

End the skill.

## Failure modes and recovery

| Failure | Where | Recovery |
|---|---|---|
| Working tree dirty | A.1 | User commits or stashes; re-run skill from A.1 |
| Lint / test / build fail | A.2 or C.4 | User fixes; re-run skill from A.1 |
| `summary.fail > 0` in doctor | A.3 | Fix the underlying environment issue (e.g., upgrade Node); re-run from A.1 |
| Network failure on doctor | A.3 | Retry after restoring network; re-run from A.1 |
| User says `abort` | B.5 | No state changes; end |
| Commit fails | C.2 | Inspect, fix, re-run from A.1 (no commit was made) |
| Push fails (network or auth) | C.3 | Retry the push manually; if persistent, abort and clean up the local commit |
| Tag already exists | C.5 | **STOP** — someone else released this version; investigate before forcing |
| `git push --tags` fails | C.5 | Retry; check origin remote |
| CI fails | C.6 | `gh run rerun <id>` after fixing; do not bump version |
| `npm view` lags showing the new version | C.7 | Retry after a minute; the registry takes a moment to propagate |

## What this skill does NOT do

- Auto-rerun CI on failure (most failures need human investigation).
- Auto-fallback to classic publish (would lose provenance attestation).
- Auto-create `release.yml` or bootstrap trust on first run — those are the
  `setup-npm-trust` skill's job; this skill assumes the env is provisioned.
- Handle pre-release versions like `1.3.0-beta.1` — not in v1 of this flow.
- Push branches other than `main` — assumes you're on the canonical
  release branch.

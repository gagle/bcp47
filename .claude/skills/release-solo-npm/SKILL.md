---
name: release-solo-npm
description: >
  Designed for AI-driven solo dev. Tag-triggered npm release with OIDC
  provenance and ONE human approval — that's the
  only place a human is in the loop, and it's a structured selector,
  not a free-text prompt. Three phases: pre-flight (silent if green),
  plan (one AskUserQuestion), execute (silent through verification).
  Composes with /verify. Supports pre-release versions, public + custom
  registries, single-package + monorepo.
---

# Release

## Who this is for

You're a solo developer — or running a small group of LLM agents —
shipping an npm package. **PRs are disabled** in your repo
(issue/discussion-only contribution model). There's no committee to
review code, no second pair of human eyes. You want releases that are:

- **Boring**: tested, typed, provenanced, every time, no exceptions.
- **One-touch**: not a 15-step runbook, not a commit-message lottery.
- **Provable**: SLSA attestations on every tarball, traceable back to
  git.

This skill drives the whole flow end-to-end with **one** human
checkpoint (a structured `AskUserQuestion` selector — unmissable,
unmistakable). Type `/release-solo-npm`, review the plan once, click `Proceed`,
get a notification when the tarball is on npm with provenance.

## How it works

Three-phase flow. Each phase has a single goal and a clear stop
condition.

- **Phase A** runs in silence if everything is green. Surface only
  failures.
- **Phase B** has the only routine human checkpoint: one
  `AskUserQuestion` selector.
- **Phase C** runs end-to-end after approval. Halt on first failure.

## Configuration

This skill is customized for **rfc-bcp47** (single-package, tsdown,
vitest). Verification commands defer to `/verify`; the inline fallbacks
are `pnpm run lint`, `pnpm test`, `pnpm run build`.

## Phase A — Pre-flight

### A.1 Working tree must be clean

```bash
git status --porcelain
```

If non-empty, **STOP**. Tell the user to commit or stash first. Do not
proceed.

### A.2 Run /verify

Invoke the `/verify` skill. (If `/verify` is not installed, fall back
to running `pnpm run lint && pnpm test && pnpm run build` inline.)

If verification fails, **STOP** and surface the error.

### A.3 Trust + environment doctor

```bash
pnpm exec npm-trust --doctor --json --workflow release.yml
```

Parse the JSON. Branch on `summary` and `issues[].code`:

| Condition | Action |
|---|---|
| `summary.fail > 0` | **STOP**, surface the failing issue |
| `WORKSPACE_NOT_DETECTED`, `REPO_NO_REMOTE`, `WORKFLOWS_NONE` | **STOP** |
| `PACKAGE_NOT_PUBLISHED` for `rfc-bcp47` | **STOP** — first-publish ceremony needed; see `/setup-npm-trust` |
| `AUTH_NOT_LOGGED_IN` | **Ignore** — tag-triggered CI publishes via OIDC; local auth doesn't matter |
| `PACKAGE_TRUST_DISCREPANCY` | **Ignore (informational)** — registry has provenance even when `npm trust list` is empty |
| `WORKFLOWS_AMBIGUOUS` | Should not fire (`--workflow` was passed). If it does, **STOP** and ask the user which workflow is the publish workflow |
| `REGISTRY_PROVENANCE_CONFLICT` | **STOP** — surface the remedy: either remove `provenance: true` or change `registry` back to public npm |
| Any other warn | Surface but proceed |

Phase A passes silently for the typical case. Move to Phase B.

## Phase B — Plan and confirm

### B.1 Find the latest tag

```bash
git tag --list 'v*' --sort=-v:refname | head -1
```

Call this `LATEST_TAG`. If empty → first release; ask the user via
`AskUserQuestion`:

- header: `"First release"`
- options: `0.1.0` / `1.0.0` / `Override (specify)` / `Abort`

### B.2 Detect version mode

Parse `package.json#version`. Two modes:

- **Stable** — current version matches `^\d+\.\d+\.\d+$`
- **Pre-release** — current version matches `^\d+\.\d+\.\d+-[a-z]+\.\d+$`

The mode determines B.5's option set.

### B.3 Collect commits since `LATEST_TAG`

```bash
git log "${LATEST_TAG}..HEAD" --format='%H %s'
```

Parse each line as a conventional commit: `type(scope)?(!)?: subject`.
Drop commits that don't match the convention (typically merges).

Group:

- **Breaking** — type ends with `!` OR body contains `BREAKING CHANGE:`
- **Features** — `feat`
- **Fixes** — `fix`
- **Performance** — `perf`
- **Reverts** — `revert`
- **Other** — `chore`, `docs`, `test`, `build`, `ci`, `style`, `refactor` (informational only)

### B.4 Decide the bump (stable mode only)

Highest applicable wins:

| Condition | Bump |
|---|---|
| Any Breaking commit | major |
| Any Features commit (no Breaking) | minor |
| Any Fix / Performance / Revert commit (no Features / Breaking) | patch |
| Only Other commits | **STOP** — nothing to release |

Call the result `NEXT_VERSION`. (Pre-release mode skips this step —
B.5 offers explicit options instead.)

### B.5 Render summary + AskUserQuestion

Render this summary block to the chat (so it stays visible):

```
Release plan:
  Version       v{LATEST} → v{NEXT}  ({bump} — {N feat, M fix, ...})
  Commits       {N} since {LATEST_TAG}
                  {type}: {subject} ({hash})
                  ...
  Trust         ✓ already configured (provenance present)
                (or: "✗ skipped (custom registry)")
  CHANGELOG     {first 4 lines visible; "expand" to show full draft}
```

Then call the `AskUserQuestion` tool (load via
`ToolSearch query="select:AskUserQuestion"` if its schema isn't loaded).

**Stable mode** — current version matches `^\d+\.\d+\.\d+$`:

- header: `"Release"`
- question: `"Approve the release plan above?"`
- multiSelect: `false`
- options:
  1. `Proceed with v{NEXT}` — Run Phase C with the recommended bump
  2. `Override version` — Specify a different version (free-form;
     accepts pre-release strings like `1.3.0-beta.1` to start a
     pre-release line)
  3. `Edit changelog` — Open the CHANGELOG draft in `$EDITOR`
  4. `Abort` — No changes; end the skill

**Pre-release mode** — current version matches
`^\d+\.\d+\.\d+-[a-z]+\.\d+$`:

- header: `"Release"`
- question: `"Approve the release plan above?"`
- multiSelect: `false`
- options:
  1. `Bump pre-release counter` — e.g., `1.3.0-beta.1` → `1.3.0-beta.2`
  2. `Promote to stable` — e.g., `1.3.0-beta.n` → `1.3.0`
  3. `Override version` — Specify a different version
  4. `Abort` — No changes

Wait for the user's selection. **Do not act yet.** Then branch:

- `Proceed with v{NEXT}` / `Bump pre-release counter` / `Promote to
  stable` → continue to Phase C
- `Override version` → ask the user (free-form follow-up) for the new
  version, set `NEXT_VERSION = X.Y.Z`, re-render the summary, and call
  `AskUserQuestion` again
- `Edit changelog` → open `$EDITOR` on the CHANGELOG draft, on save
  re-render the summary and call `AskUserQuestion` again
- `Abort` → no state changes; end the skill

There is no fallback to free-text "yes/no" prompts. One summary, one
structured prompt, one answer.

### B.6 Render the CHANGELOG draft

Prepend a section to `CHANGELOG.md` (compute, do NOT write yet):

```markdown
## [v{NEXT}](https://github.com/gagle/rfc-bcp47/compare/v{LATEST}...v{NEXT}) (YYYY-MM-DD)

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

## Phase C — Execute

After approval at B.5, run all of the following without further user
interaction. Halt on the first failure.

### C.1 Apply CHANGELOG and version

1. Prepend the rendered CHANGELOG entry to `CHANGELOG.md`.
2. Update `package.json#version` to `NEXT_VERSION`.

### C.2 Commit

```bash
git add CHANGELOG.md package.json
git commit -m "chore: release v${NEXT_VERSION}"
```

### C.3 Push (commit only, no tag yet)

```bash
git push
```

### C.4 Final pre-tag verification

Re-invoke `/verify` against the bumped state. Aborts here are rare but
not hypothetical (e.g., a test that depends on `package.json#version`).

If anything fails, **STOP**. Recovery: fix the issue, restart from
Phase A. The release commit is on origin but no tag has been pushed
yet, so the workflow won't run.

### C.4.5 Wait for `ci.yml` to go green on the pushed commit

> **Optional block — strip if your repo has no separate `ci.yml`
> workflow that runs on push to `main`.**
>
> Keep this block if any of these are true:
>
> - Your `ci.yml` runs a **Node version matrix** that `release.yml`
>   doesn't (so ci.yml catches multi-version regressions before tag).
> - Your `ci.yml` runs **e2e tests** that need credentials/secrets and
>   you want to verify them remotely before tagging.
> - Your defense-in-depth model says "tag means CI green" — this is
>   what makes that true.

After pushing the commit at C.3 and confirming local `/verify` at C.4,
wait for the most recent `ci.yml` run on `main` to complete green:

```bash
RUN_ID=$(gh run list --workflow=ci.yml --branch=main --limit=1 --json databaseId --jq '.[0].databaseId')
gh run watch "$RUN_ID" --exit-status
```

If `ci.yml` fails, **STOP**. Recovery: fix the issue, restart from
Phase A. The release commit is on origin but no tag is pushed yet, so
nothing is published to npm.

### C.5 Tag and push the tag

```bash
git tag "v${NEXT_VERSION}"
git push --tags
```

This triggers `.github/workflows/release.yml` on the new tag.

### C.6 Watch CI

```bash
gh run watch --exit-status
```

If CI fails, **STOP** and surface the error. The tag is on origin
(intentional record of intent); recovery is `gh run rerun <id>` after
fixing the cause. **Do not** bump the version unless the tarball needs
new content.

### C.7 Verify on the registry

Read `package.json#publishConfig.registry`.

**If unset or `https://registry.npmjs.org/`** (default public npm):

```bash
npm view "rfc-bcp47@${NEXT_VERSION}" version
npm view "rfc-bcp47@${NEXT_VERSION}" dist.attestations
```

The second should show `provenance: { predicateType:
"https://slsa.dev/provenance/v1" }`.

**If custom registry**:

```bash
npm view "rfc-bcp47@${NEXT_VERSION}" version --registry $REG
```

Skip the dist.attestations check (provenance only works on public npm).

### C.8 Final notification

Print:

```
Released v${NEXT_VERSION} to npm.
  Tarball: https://www.npmjs.com/package/rfc-bcp47/v/${NEXT_VERSION}
  CI:      <gh run url>
```

End the skill.

## Failure modes and recovery

| Failure | Where | Recovery |
|---|---|---|
| Working tree dirty | A.1 | User commits or stashes; restart from A.1 |
| `/verify` fails | A.2, C.4 | Fix the issue; restart from A.1 |
| Doctor `summary.fail > 0` | A.3 | Fix the underlying environment issue (e.g., upgrade Node); restart |
| Network failure on doctor | A.3 | Retry after restoring network; restart from A.1 |
| User says `Abort` | B.5 | No state changes; end |
| Commit fails | C.2 | Inspect, fix, restart from A.1 (no commit was made) |
| Push fails (network or auth) | C.3 | Retry the push manually; if persistent, abort and clean up the local commit |
| Tag already exists | C.5 | **STOP** — someone else released this version; investigate before forcing |
| `git push --tags` fails | C.5 | Retry; check origin remote |
| CI fails | C.6 | `gh run rerun <id>` after fixing; do not bump version unless tarball needs new content |
| `npm view` lags showing the new version | C.7 | Retry after a minute; the registry takes a moment to propagate |

## What this skill does NOT do

- Auto-rerun CI on failure (most failures need human investigation).
- Auto-fallback to classic publish on CI failure (would lose provenance attestation).
- Auto-create `release.yml` or bootstrap trust on first run — those are
  the `/setup-npm-trust` skill's job (see
  [`gagle/npm-trust`](https://github.com/gagle/npm-trust)); this skill
  assumes the env is already provisioned.
- Push branches other than `main` — assumes you're on the canonical
  release branch.
- Auto-merge PRs — PRs are disabled in this workflow.

# Review Evaluation Criteria

Score each item as: **Blocker** (must fix before merge), **Major** (strong recommendation), **Minor** (nice to have), or **Nit** (style/preference).

## Correctness

- Does every code path execute without runtime errors? Check: uninitialized variables, signals, observables. If something is declared, verify it is assigned before use.
- Do function return types match what the function can actually return? Check for type assertions that lie.
- Are there off-by-one errors, missing null checks at system boundaries, or unhandled edge cases?

## Minimum change principle

- Does every changed line directly serve the task's acceptance criteria?
- Are there cosmetic changes (import reordering, whitespace, alphabetizing) mixed into the functional diff? Flag them -- they obscure the real changes and should be separate commits or excluded.
- Are there new abstractions (helpers, constants, types, files) that have only one consumer? Inline them unless there's a proven reuse case.
- Are there "while I'm here" improvements unrelated to the task?
- Does the diff address multiple tasks or unrelated concerns that should be separate? One task = one MR.
- Are there refactors to code that the task doesn't require changing? Renaming, restructuring, or cleaning up untouched code belongs in a dedicated refactor MR.
- Is the diff suspiciously large for the task scope? Count changed files and diff size relative to the acceptance criteria. Flag disproportionate changes.
- Can the changes be split into smaller, independently mergeable pieces? If a subset of changes can ship and provide value on its own, it should be separate.

## Naming and semantics

- Do new functions, variables, types, and files clearly communicate intent without requiring context?
- Are boolean checks expressed as readable predicates?
- Do filenames match the project's naming conventions? Check for typos.

## Modularity and encapsulation

- Is the new code placed at the correct architectural layer?
- Are new types/interfaces scoped to where they're needed, or leaked unnecessarily?
- If a new concept is introduced (type, union value, constant), does it follow the same pattern as existing siblings? If it deviates, is there a justified reason?

## Scalability and maintainability

- If this pattern is repeated for the next 5 similar features, does the architecture hold? Or does each addition require touching N files with copy-paste changes?
- Are there hardcoded values that should be derived from a single source of truth?
- Will auto-generated code overwrite manual changes on next generation cycle? Identify temporal coupling between repos.

## Reusability

- Does the diff introduce something that already exists in the codebase under a different name?
- Could the new code be reused, or is it unnecessarily coupled to a specific context?
- Are there opportunities to extend existing abstractions rather than creating parallel ones?

## Code smells

- Dead code: new exports with zero consumers, unreachable branches, types that collapse to existing types
- Implicit contracts: behavior that only works because of undocumented ordering, naming conventions, or coincidental data shapes
- Inconsistent patterns: same concept handled differently in different places within the same diff

## Test quality

- Is there a test for the happy path?
- Is there a test for the feature being absent/disabled? (negative case)
- Are assertions specific and semantic, or do they rely on brittle indices/positions?
- Do tests actually exercise the new code paths, or do they just assert the old behavior plus the new item appended?

## Enrichment with code-review-graph

If code-review-graph MCP tools are available, integrate structural findings from Phase 1 graph analysis into the evaluation:

- Flag high-risk changes identified by `detect_changes` that lack test coverage
- Flag affected execution flows that have no corresponding test changes
- Flag changes with large impact radius that aren't mentioned in the ticket scope
- Use graph-derived caller/callee data to verify consumer impact claims

## Output format

For each finding, provide:

1. **Severity**: Blocker | Major | Minor | Nit
2. **File:line** -- exact location
3. **What**: one-sentence description of the issue
4. **Why it matters**: the consequence if left as-is (runtime crash, tech debt, confusion, test gap)
5. **Suggestion**: concrete fix or question to the author

Group findings by severity. Lead with blockers.

At the end, provide a **summary verdict**: Approve / Approve with comments / Request changes -- with a one-paragraph justification.

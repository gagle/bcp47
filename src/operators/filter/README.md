# filter

Find **all** matching language tags per [RFC 4647 §3.3.2](https://www.rfc-editor.org/rfc/rfc4647#section-3.3.2) (Extended Filtering).

## When to use

You have a list of available locales and need to find **all** that match a user's language preference — not just the single best one. Use `filter` when you want a ranked list of options (e.g. showing all available translations). Use [`lookup`](../lookup/README.md) when you want exactly one best match.

**Problem**: Your available tags have varying levels of specificity — some include a script (`de-Latn-DE`), some don't (`de-DE`), some have variants (`de-DE-1996`). A user who wants `de-DE` should match all of these. Simple string prefix matching (`startsWith`) breaks on cases like `de-DE` matching `de-Deva` (wrong script), and doesn't handle wildcards or singleton boundaries.

**Solution**: `filter()` implements RFC 4647 Extended Filtering — a subtag-aware algorithm that walks through each position intelligently. It skips non-matching optional subtags (like script) to find deeper matches, supports `*` wildcards at any position, and respects singleton boundaries (extension markers like `-a-` or `-x-` block skipping).

## Signature

```ts
function filter(
  tags: ReadonlyArray<string>,
  patterns: ReadonlyArray<string> | string,
): Array<string>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `tags` | `ReadonlyArray<string>` | Available language tags to match against |
| `patterns` | `ReadonlyArray<string> \| string` | Language range(s) — single string or priority-ordered array |

Returns matching tags, deduplicated, ordered by pattern priority then tag order.

## Examples

### Subtag-aware matching

```ts
import { filter } from 'rfc-bcp47';

const tags = ['de-DE', 'de-Latn-DE', 'de-AT', 'de-DE-1996', 'en-US'];

// 'de-DE' matches tags with intermediate subtags (Latn) and trailing subtags (1996)
filter(tags, 'de-DE');
// ['de-DE', 'de-Latn-DE', 'de-DE-1996']

// Language-only range matches ALL tags with that language
filter(tags, 'de');
// ['de-DE', 'de-Latn-DE', 'de-AT', 'de-DE-1996']
```

### Wildcards

```ts
import { filter } from 'rfc-bcp47';

const tags = ['de-DE', 'de-Latn-DE', 'en-DE', 'fr-FR'];

// * in first position: any language for Germany
filter(tags, '*-DE');
// ['de-DE', 'de-Latn-DE', 'en-DE']

// * in middle position: German, any script, Germany
filter(tags, 'de-*-DE');
// ['de-DE', 'de-Latn-DE']
```

### Singleton boundaries prevent false matches

```ts
import { filter } from 'rfc-bcp47';

// The extension singleton 'x' acts as a barrier —
// 'DE' after 'x' is private-use data, not a region
filter(['de-x-DE'], 'de-DE');
// [] — no match, 'x' blocks skipping to reach 'DE'

// Without the singleton, the region matches normally
filter(['de-Latn-DE'], 'de-DE');
// ['de-Latn-DE'] — 'Latn' is skipped (non-matching, non-singleton)
```

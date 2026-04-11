# lookup

Pick the **single best** matching locale per [RFC 4647 §3.4](https://www.rfc-editor.org/rfc/rfc4647#section-3.4) (Lookup).

## When to use

You need exactly **one** locale for a user — the best available match for their preference. This is the classic content negotiation problem: the user wants `fr-CA`, you have `fr` and `en`, so you serve `fr`. Use `lookup` when you need a single answer. Use [`filter`](../filter/README.md) when you want all matching locales.

**Problem**: The user's preferred locale is often more specific than what you have available. `fr-CA` isn't in your list, but `fr` is. You need to progressively generalize the preference until you find a match — but you must also handle extension singletons (don't leave a dangling `-a` or `-x`), try multiple preferences in priority order, and fall back to a default when nothing matches.

**Solution**: `lookup()` implements RFC 4647 Lookup — it strips the rightmost subtag from the preference, tries again, and repeats until it finds an exact match or runs out of subtags. If the new rightmost subtag is a singleton (like `x` or `a`), it removes that too (never leaves a dangling singleton). Multiple preferences are tried in priority order.

## Signature

```ts
function lookup(
  tags: ReadonlyArray<string>,
  preferences: ReadonlyArray<string> | string,
  defaultValue?: string,
): string | null
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `tags` | `ReadonlyArray<string>` | Available language tags |
| `preferences` | `ReadonlyArray<string> \| string` | Language preference(s) in priority order |
| `defaultValue` | `string` | Returned when no match is found (default: `null`) |

Returns the first matching tag from the available set, or `defaultValue`/`null`.

## Examples

### Progressive truncation

```ts
import { lookup } from 'rfc-bcp47';

const available = ['en', 'en-US', 'fr', 'de'];

// Exact match
lookup(available, 'en-US');          // 'en-US'

// fr-CA not available → truncates to 'fr' → match
lookup(available, 'fr-CA');          // 'fr'

// Truncation sequence: zh-Hant-TW → zh-Hant → zh → (no match)
lookup(available, 'zh-Hant-TW');     // null

// Singletons are removed with their preceding subtag:
// en-US-x-custom → en-US-x → en-US (skip dangling singleton) → match
lookup(available, 'en-US-x-custom'); // 'en-US'
```

### Multiple preferences in priority order

```ts
import { lookup } from 'rfc-bcp47';

const available = ['en', 'fr', 'de'];

// Tries 'ja' first (no match), then 'fr-CA' → truncates to 'fr' → match
lookup(available, ['ja', 'fr-CA', 'en']); // 'fr'

// First preference matches immediately
lookup(available, ['de-DE', 'en']);        // 'de' (truncated from de-DE)
```

### Default fallback

```ts
import { lookup } from 'rfc-bcp47';

const available = ['en', 'fr', 'de'];

// No match → null
lookup(available, 'pt-BR');        // null

// No match → default value
lookup(available, 'pt-BR', 'en');  // 'en'
```

## Content negotiation with Accept-Language

```ts
import { acceptLanguage, lookup } from 'rfc-bcp47';

// Parse the browser's Accept-Language header, then find the best match
const preferences = acceptLanguage(request.headers['accept-language']);
const locale = lookup(supportedLocales, preferences.map((p) => p.tag), 'en');
```

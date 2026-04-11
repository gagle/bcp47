# acceptLanguage

Parse an HTTP `Accept-Language` header into ranked language preferences.

## When to use

Your server receives an `Accept-Language` header and needs to decide which locale to serve. This function handles the **parsing** step — extracting structured `{ tag, quality }` entries sorted by preference. Pair it with [`lookup`](../lookup/README.md) (single best match) or [`filter`](../filter/README.md) (all matches) to complete content negotiation.

**Problem**: The `Accept-Language` header is a comma-separated string with optional quality weights (`fr-CA, en-US;q=0.8, en;q=0.5`). You need to parse it into structured data, sort by preference descending, default missing quality to `1.0`, and silently skip malformed entries — all per [RFC 9110 §12.5.4](https://www.rfc-editor.org/rfc/rfc9110#section-12.5.4).

**Solution**: `acceptLanguage()` returns a sorted array of `{ tag, quality }` entries, ready to pass to `lookup()` or `filter()`.

## Signature

```ts
function acceptLanguage(header: string): ReadonlyArray<AcceptLanguage>

interface AcceptLanguage {
  readonly tag: string;
  readonly quality: number;
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `header` | `string` | The `Accept-Language` header value |

Returns entries sorted by quality descending. Equal-quality entries preserve their original order. Malformed entries (invalid quality values, bad syntax) are silently skipped.

## Examples

### Parse and sort by preference

```ts
import { acceptLanguage } from 'rfc-bcp47';

acceptLanguage('fr-CA, en-US;q=0.8, en;q=0.5, *;q=0.1');
// [
//   { tag: 'fr-CA', quality: 1.0 },  — no quality = default 1.0
//   { tag: 'en-US', quality: 0.8 },
//   { tag: 'en',    quality: 0.5 },
//   { tag: '*',     quality: 0.1 },  — wildcard = any language
// ]
```

### Malformed entries are skipped gracefully

```ts
import { acceptLanguage } from 'rfc-bcp47';

// Invalid quality values and malformed tags are silently dropped
acceptLanguage('en, bad!tag, fr;q=2, de;q=0.5');
// [
//   { tag: 'en', quality: 1.0 },  — valid
//   { tag: 'de', quality: 0.5 },  — valid
// ]
// 'bad!tag' skipped (invalid characters), 'fr;q=2' skipped (quality > 1)
```

### Full content negotiation with lookup

```ts
import { acceptLanguage, lookup } from 'rfc-bcp47';

// 1. Parse the browser's preferences
const preferences = acceptLanguage('fr-CA, en-US;q=0.8, en;q=0.5');

// 2. Find the best available locale
const available = ['en', 'en-US', 'fr', 'fr-CA', 'de'];
const best = lookup(available, preferences.map((p) => p.tag), 'en');
// 'fr-CA' — exact match for highest-priority preference
```

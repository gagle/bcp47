# extensionU, extensionT

Extract Unicode Locale (U) and Transformed Content (T) extension data from a parsed tag.

## When to use

Your application needs locale metadata beyond language/script/region — things like the user's preferred calendar system, collation order, numbering system, or the source language of a translation.

**Problem**: BCP 47 extensions pack structured key-value data into the tag string. Parsing `de-DE-u-co-phonebk-ca-buddhist` with `parse()` gives you the raw extension subtags (`['co', 'phonebk', 'ca', 'buddhist']`), but keys and values are interleaved — you still need to pair `co` with `phonebk` and `ca` with `buddhist`.

**Solution**: `extensionU()` and `extensionT()` extract the structured data from a parsed tag, returning typed objects with keys mapped to values. They take a `BCP47Tag` (not a string), so they compose with `parse()` without re-parsing.

- **extensionU** — [RFC 6067](https://www.rfc-editor.org/rfc/rfc6067): Unicode locale preferences (calendar, collation, currency, numbering system, timezone, etc.)
- **extensionT** — [RFC 6497](https://www.rfc-editor.org/rfc/rfc6497): Transformed content metadata (source language, transliteration scheme, input method)

## Signatures

```ts
function extensionU(tag: BCP47Tag): BCP47ExtensionU | null
function extensionT(tag: BCP47Tag): BCP47ExtensionT | null

interface BCP47ExtensionU {
  readonly attributes: ReadonlyArray<string>;
  readonly keywords: Record<string, string>;
}

interface BCP47ExtensionT {
  readonly source: string | null;
  readonly fields: Record<string, string>;
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `tag` | `BCP47Tag` | A parsed BCP 47 tag from `parse()` |

Returns the extracted extension data, or `null` if the tag has no matching extension.

## Examples

### Read Unicode locale preferences (U extension)

```ts
import { parse, extensionU } from 'rfc-bcp47';

// Extract calendar and collation preferences
const u = extensionU(parse('de-DE-u-co-phonebk-ca-buddhist')!);
// { attributes: [], keywords: { co: 'phonebk', ca: 'buddhist' } }

// Common U extension keys:
//   ca = calendar (buddhist, gregory, islamic, japanese, ...)
//   co = collation (phonebk, pinyin, stroke, ...)
//   nu = numbering system (arab, latn, ...)
//   cu = currency (EUR, USD, ...)

// A key with no value returns empty string (means 'true' per spec)
extensionU(parse('en-u-va')!);
// { attributes: [], keywords: { va: '' } }

// No U extension → null
extensionU(parse('en-US')!); // null
```

### Read transformed content metadata (T extension)

```ts
import { parse, extensionT } from 'rfc-bcp47';

// Source language of a translation: Japanese content translated from Italian
extensionT(parse('ja-t-it')!);
// { source: 'it', fields: {} }

// Transliteration mechanism: UN/GEGN romanization from 2007
extensionT(parse('und-t-und-latn-m0-ungegn-2007')!);
// { source: 'und-latn', fields: { m0: 'ungegn-2007' } }

// Common T extension keys:
//   d0 = destination transform (fwidth, ascii, ...)
//   m0 = transform mechanism (ungegn, bgn, ...)
//   s0 = source transform (ascii, npinyin, ...)

// No T extension → null
extensionT(parse('en-US')!); // null
```

## CLDR key references

Two typed constants map extension keys to human-readable descriptions from the [CLDR BCP 47 data](https://github.com/unicode-org/cldr/tree/main/common/bcp47):

```ts
import { UNICODE_LOCALE_KEYS, TRANSFORM_KEYS } from 'rfc-bcp47';

UNICODE_LOCALE_KEYS.ca; // 'Calendar'
UNICODE_LOCALE_KEYS.nu; // 'Numbering system'
TRANSFORM_KEYS.m0;      // 'Transform mechanism'
```

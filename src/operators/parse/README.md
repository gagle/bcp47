# parse

Parse a BCP 47 language tag string into a structured object.

## When to use

You have a language tag as a string — from an HTTP header, an HTML `lang` attribute, a database field, or user input — and you need to inspect or manipulate its individual parts.

**Problem**: Language tags look simple (`en-US`) but their structure is context-dependent. A subtag's meaning depends on its position and length: in `zh-Hant-TW`, `Hant` (4 letters) is a script, while `TW` (2 letters) is a region. In `de-DE-1996`, `1996` (digit-leading 4 chars) is a variant. Splitting on `-` gives you fragments with no semantics. You also need to detect grandfathered tags (`i-klingon`), private use tags (`x-custom`), and reject invalid input — all while normalizing casing.

**Solution**: `parse()` implements the full [RFC 5646 ABNF grammar](https://www.rfc-editor.org/rfc/rfc5646#section-2.1). It classifies every subtag by role and returns a typed discriminated union — `langtag`, `grandfathered`, or `privateuse` — so you can pattern-match on `tag.type`. Invalid input returns `null`, never throws.

## Signature

```ts
function parse(tag: string): BCP47Tag | null
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `tag` | `string` | A BCP 47 language tag string |

Returns a `BCP47Tag` discriminated union, or `null` if the tag is invalid. The union has three variants:

- `{ type: 'langtag', langtag: BCP47Langtag }` — standard language tags like `en-US`
- `{ type: 'grandfathered', grandfathered: BCP47Grandfathered }` — legacy tags like `i-klingon`
- `{ type: 'privateuse', privateuse: ReadonlyArray<string> }` — private-use tags like `x-app-v2`

## Examples

### Inspect a tag's components

```ts
import { parse } from 'rfc-bcp47';

// Parse a tag and access its structured parts
const tag = parse('zh-Hant-TW');

if (tag?.type === 'langtag') {
  tag.langtag.language; // 'zh'   — Chinese
  tag.langtag.script;   // 'Hant' — Traditional Han script
  tag.langtag.region;   // 'TW'   — Taiwan
  tag.langtag.variant;  // []     — no variants
}

// Case is normalized automatically during parsing
const tag2 = parse('EN-LATN-US');
// tag2.langtag.language → 'en' (lowercase)
// tag2.langtag.script   → 'Latn' (titlecase)
// tag2.langtag.region   → 'US' (uppercase)
```

### Handle all three tag types

```ts
import { parse } from 'rfc-bcp47';

const tag = parse(input);

switch (tag?.type) {
  case 'langtag':
    // Standard tag — access .langtag.language, .script, .region, etc.
    break;
  case 'grandfathered':
    // Legacy tag (e.g. 'i-klingon') — atomic, not decomposed into subtags
    tag.grandfathered.tag; // 'i-klingon'
    break;
  case 'privateuse':
    // Application-specific tag (e.g. 'x-app-internal')
    tag.privateuse; // ['app', 'internal']
    break;
}
```

### Validate user input

```ts
import { parse } from 'rfc-bcp47';

// null means invalid — no exceptions thrown
parse('en-US');   // BCP47Tag object
parse('en_US');   // null — underscores not valid
parse('');        // null — empty string
parse('en--US');  // null — consecutive hyphens
```

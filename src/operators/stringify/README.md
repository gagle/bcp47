# stringify

Convert a parsed `BCP47Tag` object back into a well-formatted language tag string.

## When to use

You have a `BCP47Tag` object — from `parse()` or `langtag()` — and need to serialize it back to a string. Common scenarios: you modified a tag's region or script and need the updated string, you need to normalize casing from an arbitrary source, or you built a tag programmatically with `langtag()` and need the string form.

**Problem**: After parsing and modifying tag components, reassembling the string requires correct ordering (language-extlang-script-region-variant-extension-privateuse) and [RFC 5646 §2.1.1 case conventions](https://www.rfc-editor.org/rfc/rfc5646#section-2.1.1) — language lowercase, script titlecase, region uppercase, everything else lowercase.

**Solution**: `stringify()` handles ordering and case normalization automatically. It is the inverse of `parse()`.

## Signature

```ts
function stringify(tag: BCP47Tag): string
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `tag` | `BCP47Tag` | A parsed BCP 47 tag object (from `parse()` or `langtag()`) |

Returns a formatted BCP 47 language tag string with proper case conventions.

## Examples

### Normalize casing from arbitrary input

```ts
import { parse, stringify } from 'rfc-bcp47';

// Input with inconsistent casing → properly formatted output
stringify(parse('ZH-hant-tw')!);   // 'zh-Hant-TW'
stringify(parse('EN-LATN-US')!);   // 'en-Latn-US'
stringify(parse('I-KLINGON')!);    // 'i-klingon'
stringify(parse('X-CUSTOM')!);     // 'x-custom'
```

### Modify a tag and serialize it back

```ts
import { parse, stringify } from 'rfc-bcp47';

const tag = parse('en-US')!;

if (tag.type === 'langtag') {
  // Change region from US to GB
  const modified = {
    ...tag,
    langtag: { ...tag.langtag, region: 'GB' },
  };
  stringify(modified); // 'en-GB'
}
```

### Build a tag with langtag() and convert to string

```ts
import { langtag, stringify } from 'rfc-bcp47';

stringify(langtag('fr', { region: 'CA' }));                // 'fr-CA'
stringify(langtag('ja', { region: 'JP', script: 'Jpan' })); // 'ja-Jpan-JP'
```

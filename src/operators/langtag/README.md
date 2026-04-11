# langtag

Build a `BCP47Tag` object programmatically without parsing a string.

## When to use

You are constructing a language tag from **known parts** — combining a user-selected language with a region in a locale picker, building tags from configuration, or generating tags in code. Use `langtag()` when you have the parts and need a tag object. Use `parse()` when you have a string from an external source.

**Problem**: Building a `BCP47Tag` manually requires setting all fields — `language`, `extlang: []`, `script: null`, `region: null`, `variant: []`, `extension: []`, `privateuse: []`. This is verbose, error-prone, and doesn't validate the subtags.

**Solution**: `langtag()` is a validated factory. You only specify what you need — it fills in defaults for everything else, normalizes casing, and validates every subtag against the RFC 5646 grammar. Invalid input throws `RangeError` (not `null`) because a builder receiving bad input is a programmer error, not a data problem.

## Signature

```ts
function langtag(language: string, options?: LangtagOptions): BCP47Tag
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `language` | `string` | Primary language subtag (2-8 ALPHA) |
| `options.extlang` | `ReadonlyArray<string>` | Extended language subtags (default: `[]`) |
| `options.script` | `string` | Script subtag (default: `null`) |
| `options.region` | `string` | Region subtag (default: `null`) |
| `options.variant` | `ReadonlyArray<string>` | Variant subtags (default: `[]`) |
| `options.extension` | `ReadonlyArray<BCP47Extension>` | Extension sequences (default: `[]`) |
| `options.privateuse` | `ReadonlyArray<string>` | Private-use subtags (default: `[]`) |

Returns a `BCP47Tag` with `type: 'langtag'`. Throws `RangeError` on invalid input.

## Examples

### Build from a locale picker

```ts
import { langtag, stringify } from 'rfc-bcp47';

// User selects language and region → build the tag
const tag = langtag('fr', { region: 'CA' });
stringify(tag); // 'fr-CA'

// Casing is normalized automatically
const tag2 = langtag('EN', { script: 'latn', region: 'us' });
stringify(tag2); // 'en-Latn-US'
```

### Build a tag with extensions

```ts
import { langtag, stringify } from 'rfc-bcp47';

// Tag with Unicode calendar extension
const tag = langtag('ja', {
  region: 'JP',
  extension: [{ singleton: 'u', subtags: ['ca', 'japanese'] }],
});
stringify(tag); // 'ja-JP-u-ca-japanese'
```

### Validation catches programmer errors

```ts
import { langtag } from 'rfc-bcp47';

langtag('en');                             // OK
langtag('!!!');                            // RangeError — invalid language
langtag('en', { region: 'TOOLONG' });     // RangeError — region must be 2 ALPHA or 3 DIGIT
langtag('en', { variant: ['a', 'a'] });   // RangeError — duplicate variant
langtag('aaaa', { extlang: ['bbb'] });    // RangeError — extlang only after 2-3 char language
```

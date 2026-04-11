# canonicalize

Normalize a BCP 47 tag to its canonical form per [RFC 5646 §4.5](https://www.rfc-editor.org/rfc/rfc5646#section-4.5).

## When to use

You are storing, comparing, or exchanging language tags and need a single consistent representation. Without canonicalization, the same language can be represented by multiple equivalent tags — and your system will treat them as different.

**Problem**: `iw` and `he` both mean Hebrew. `en-Latn-US` and `en-US` mean the same thing (Latin is English's default script). `zh-cmn` and `cmn` are equivalent. `BU` and `MM` both refer to Myanmar. If you store both forms, you get duplicate entries, broken lookups, and inconsistent API responses.

**Solution**: `canonicalize()` reduces all equivalent forms to a single canonical representation using [IANA registry](https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry) data. Run it on any tag before storing or comparing. It applies six transformations in one pass:

1. **Case normalization** — `EN-LATN-US` → `en-Latn-US`
2. **Deprecated subtag replacement** — languages (`iw` → `he`), regions (`BU` → `MM`), variants (`heploc` → `alalc97`)
3. **Extlang promotion** — `zh-cmn` → `cmn`, `zh-yue` → `yue`
4. **Suppress-script removal** — `en-Latn` → `en` (Latn is the default script for English)
5. **Extension singleton ordering** — sorted alphabetically (`u` before `a` → `a` before `u`)
6. **Extension-internal sorting** — U keywords sorted by key, T fields sorted by tkey

## Signature

```ts
function canonicalize(tag: string): string | null
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `tag` | `string` | A BCP 47 language tag string |

Returns the canonical tag string, or `null` if the tag is invalid.

## Examples

### Normalize deprecated subtags before storing

```ts
import { canonicalize } from 'rfc-bcp47';

// Deprecated languages → preferred replacements
canonicalize('iw');    // 'he'  — Hebrew
canonicalize('in');    // 'id'  — Indonesian
canonicalize('ji');    // 'yi'  — Yiddish

// Deprecated regions
canonicalize('de-DD'); // 'de-DE' — East Germany → Germany
canonicalize('my-BU'); // 'my-MM' — Burma → Myanmar

// Grandfathered tags
canonicalize('i-klingon');  // 'tlh'
canonicalize('art-lojban'); // 'jbo'
```

### Remove redundant information

```ts
import { canonicalize } from 'rfc-bcp47';

// Suppress-script: remove the default script for a language
canonicalize('en-Latn');     // 'en'      — Latin is default for English
canonicalize('ru-Cyrl');     // 'ru'      — Cyrillic is default for Russian
canonicalize('zh-Hant');     // 'zh-Hant' — Traditional is NOT default, preserved

// Extlang promotion: collapse prefix + extlang to just extlang
canonicalize('zh-cmn');      // 'cmn'     — Mandarin
canonicalize('zh-yue');      // 'yue'     — Cantonese
```

### Sort extensions for consistent comparison

```ts
import { canonicalize } from 'rfc-bcp47';

// Extension singletons sorted alphabetically (a before u)
canonicalize('en-u-ca-buddhist-a-foo');
// 'en-a-foo-u-ca-buddhist'

// U extension keywords sorted by key (ca before co)
canonicalize('en-u-co-phonebk-ca-buddhist');
// 'en-u-ca-buddhist-co-phonebk'

// T extension fields sorted by tkey (d0 before m0)
canonicalize('en-t-ja-m0-true-d0-fwidth');
// 'en-t-ja-d0-fwidth-m0-true'
```

## Note on suppress-script for `zh`

The IANA registry has no `Suppress-Script` entry for `zh`, so `canonicalize('zh-Hans')` returns `'zh-Hans'` (preserved). This is RFC-correct — Chinese uses both Han Simplified and Han Traditional, so neither script is "default."

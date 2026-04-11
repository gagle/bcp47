# IANA Language Subtag Registry

- **URL**: https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
- **Maintained by**: IANA (Internet Assigned Numbers Authority)
- **Authority**: RFC 5646 §3
- **File-Date used in this library**: 2025-08-25

## Overview

The IANA Language Subtag Registry is the authoritative source for all valid subtags in BCP 47 language tags. It contains records for languages, extlangs, scripts, regions, variants, grandfathered tags, and redundant tags.

## Record Structure

Each registry entry contains:

| Field | Description |
|-------|-------------|
| `Type` | `language`, `extlang`, `script`, `region`, `variant`, `grandfathered`, `redundant` |
| `Subtag` / `Tag` | The subtag value (or full tag for grandfathered/redundant) |
| `Description` | Human-readable name |
| `Added` | Date the record was added |
| `Deprecated` | Date deprecated (if applicable) |
| `Preferred-Value` | Replacement subtag/tag (if deprecated) |
| `Prefix` | Valid prefix for extlang/variant subtags |
| `Suppress-Script` | Script to suppress for this language |
| `Macrolanguage` | Parent macrolanguage (if applicable) |
| `Scope` | `macrolanguage`, `collection`, `special`, `private-use` |

## Maps Extracted for This Library

The library extracts 7 maps from the registry into `src/language-subtag-registry.ts`:

### 1. DEPRECATED_LANGUAGES

- **Source**: `Type: language` + `Deprecated:` + `Preferred-Value:`
- **Count**: 108 entries
- **Maps**: deprecated language subtag → preferred language subtag
- **Example**: `iw` → `he`, `in` → `id`, `ji` → `yi`
- **Used by**: `canonicalize()` — step 2 (deprecated subtag replacement)

### 2. EXTLANG_PREFIXES

- **Source**: `Type: extlang` + NOT deprecated + `Prefix:`
- **Count**: 251 entries (excludes 5 deprecated extlangs: ajp, bbz, lsg, rsi, yds)
- **Maps**: extlang subtag → prefix language subtag
- **Example**: `cmn` → `zh`, `yue` → `zh`, `jsl` → `sgn`
- **Used by**: `canonicalize()` — step 3 (extlang promotion)
- **Note**: Deprecated extlangs (those with both `Deprecated` and `Preferred-Value`) are excluded because they should be handled via DEPRECATED_LANGUAGES, not extlang promotion

### 3. SUPPRESS_SCRIPTS

- **Source**: `Type: language` + NOT deprecated + `Suppress-Script:`
- **Count**: 131 entries
- **Maps**: language subtag → suppressed script subtag
- **Example**: `en` → `Latn`, `ru` → `Cyrl`, `ja` → `Jpan`
- **Used by**: `canonicalize()` — step 4 (suppress-script removal)
- **Note**: `zh` has NO `Suppress-Script` (uses both Hans and Hant)

### 4. DEPRECATED_REGIONS

- **Source**: `Type: region` + `Deprecated:` + `Preferred-Value:`
- **Count**: 6 entries
- **Maps**: deprecated region → preferred region
- **Entries**: `BU` → `MM`, `DD` → `DE`, `FX` → `FR`, `TP` → `TL`, `YD` → `YE`, `ZR` → `CD`
- **Used by**: `canonicalize()` — step 2

### 5. DEPRECATED_VARIANTS

- **Source**: `Type: variant` + `Deprecated:` + `Preferred-Value:`
- **Count**: 1 entry
- **Entry**: `heploc` → `alalc97`
- **Used by**: `canonicalize()` — step 2

### 6. REDUNDANT_PREFERRED

- **Source**: `Type: redundant` + `Preferred-Value:`
- **Count**: 19 entries (sgn-* sign languages)
- **Maps**: redundant language-region tag → preferred language subtag
- **Example**: `sgn-BR` → `bzs`, `sgn-US` → `ase`, `sgn-JP` → `jsl`
- **Used by**: `canonicalize()` — step 2
- **Note**: 6 additional `zh-*` redundant entries exist in the registry but are handled by extlang promotion instead (e.g., `zh-cmn` → `cmn` via EXTLANG_PREFIXES)

### 7. GRANDFATHERED_PREFERRED

- **Source**: `Type: grandfathered` + `Preferred-Value:`
- **Count**: 21 entries (of 26 total grandfathered tags; 5 have no preferred value)
- **Maps**: grandfathered tag (lowercase) → preferred value
- **Example**: `i-klingon` → `tlh`, `zh-min-nan` → `nan`
- **Used by**: `canonicalize()` — grandfathered tag replacement
- **Tags without preferred value** (5): `i-default`, `i-enochian`, `i-mingo`, `cel-gaulish`, `zh-min`

## Registry Update Process

When updating the registry data:

1. Download: `curl -sL https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry`
2. Check `File-Date:` header against the date comment in `src/language-subtag-registry.ts`
3. Extract each map using the criteria above
4. Diff against current code entries
5. Update the source file and the File-Date comment
6. Run full verification: `npm run lint && npm run build && npm test`

## Known Edge Cases

- **Deprecated extlangs** (ajp, bbz, lsg, rsi, yds): Have both `Deprecated` and `Preferred-Value` fields. Some have self-referencing `Preferred-Value` (e.g., `bbz` → `bbz`), while others map to different codes (e.g., `ajp` → `apc`). These are excluded from EXTLANG_PREFIXES and handled via DEPRECATED_LANGUAGES instead where applicable.
- **Redundant zh-* tags**: `zh-cmn`, `zh-cmn-Hans`, `zh-cmn-Hant`, `zh-gan`, `zh-wuu`, `zh-yue` are redundant tags with preferred values, but extlang promotion already handles them correctly.
- **Grandfathered sgn-* tags**: `sgn-BE-FR`, `sgn-BE-NL`, `sgn-CH-DE` are grandfathered (not redundant). They're matched as complete tags, not as language-region pairs.
- **Suppress-Script for zh**: `zh` has no `Suppress-Script` entry because Chinese uses both Simplified (Hans) and Traditional (Hant) scripts.

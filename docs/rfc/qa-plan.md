# QA Plan — Every Testable Rule from the BCP 47 Specifications

> Derived from RFC 5646, RFC 4647, RFC 6067, RFC 6497, RFC 9110, and the IANA Language Subtag Registry.
> Each rule is numbered for traceability between the spec, the test suite, and gap reports.

---

## 1. PARSE — RFC 5646 Section 2.1 (ABNF Syntax)

### 1.1 Language Subtag

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| P-L01 | 2-letter language accepted | 5646 §2.1 | `en` | valid langtag, language: `en` |
| P-L02 | 3-letter language accepted | 5646 §2.1 | `ast` | valid langtag, language: `ast` |
| P-L03 | 4-letter language accepted (reserved) | 5646 §2.1 | `abcd` | valid langtag, language: `abcd` |
| P-L04 | 5-letter language accepted | 5646 §2.1 | `abcde` | valid langtag |
| P-L05 | 6-letter language accepted | 5646 §2.1 | `abcdef` | valid langtag |
| P-L06 | 7-letter language accepted | 5646 §2.1 | `abcdefg` | valid langtag |
| P-L07 | 8-letter language accepted | 5646 §2.1 | `abcdefgh` | valid langtag |
| P-L08 | 1-letter language rejected | 5646 §2.1 | `a` | `null` |
| P-L09 | 9+ letter language rejected | 5646 §2.1 | `abcdefghi` | `null` |
| P-L10 | Language must be alphabetic only | 5646 §2.1 | `e1` | `null` |
| P-L11 | Language is case-insensitive | 5646 §2.1.1 | `EN` | language: `en` |
| P-L12 | Private use range qaa-qtz accepted | 5646 §2.2.1 | `qaa` | language: `qaa` |

### 1.2 Extended Language Subtag (Extlang)

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| P-E01 | Single extlang accepted | 5646 §2.1 | `zh-cmn` | extlang: `['cmn']` |
| P-E02 | Two extlangs accepted | 5646 §2.1 | `zh-cmn-abc` | extlang: `['cmn', 'abc']` |
| P-E03 | Three extlangs accepted (max) | 5646 §2.1 | `zh-cmn-abc-def` | extlang: `['cmn', 'abc', 'def']` |
| P-E04 | Extlang must be exactly 3 ALPHA | 5646 §2.1 | `zh-cm` | `cm` not parsed as extlang |
| P-E05 | Extlang only after 2-3 char language | 5646 §2.2.2 | `abcd-cmn` | `null` (no extlang after 4-char language) |
| P-E06 | Extlang rejected after 5-8 char language | 5646 §2.2.2 | `abcde-abc` | `null` |
| P-E07 | Extlang digits rejected | 5646 §2.1 | `zh-cm1` | `cm1` not parsed as extlang |

### 1.3 Script Subtag

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| P-S01 | 4-letter script accepted | 5646 §2.1 | `en-Latn` | script: `Latn` |
| P-S02 | Script must be exactly 4 ALPHA | 5646 §2.1 | `en-Lat` | `Lat` not parsed as script |
| P-S03 | Script with digits rejected as script | 5646 §2.1 | `en-Lat1` | `Lat1` not a script |
| P-S04 | At most one script per tag | 5646 §2.2.3 | `en-Latn-Cyrl` | `null` — second 4-ALPHA does not fit region (2ALPHA/3DIGIT) or variant (5-8/digit+3) |
| P-S05 | Script position: after language, before region | 5646 §2.1 | `en-Latn-US` | script: `Latn`, region: `US` |
| P-S06 | Script case-insensitive | 5646 §2.1.1 | `en-latn` | script: `Latn` |
| P-S07 | Private use script Qaaa-Qabx accepted | 5646 §2.2.3 | `en-Qaaa` | script: `Qaaa` |

### 1.4 Region Subtag

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| P-R01 | 2-letter region accepted | 5646 §2.1 | `en-US` | region: `US` |
| P-R02 | 3-digit region accepted | 5646 §2.1 | `en-001` | region: `001` |
| P-R03 | Region must be 2 ALPHA or 3 DIGIT | 5646 §2.1 | `en-U` | not a valid region |
| P-R04 | At most one region per tag | 5646 §2.2.4 | `en-US-GB` | `null` — second 2-ALPHA does not fit variant (5-8/digit+3) after region already consumed |
| P-R05 | Region after script | 5646 §2.1 | `en-Latn-US` | both parsed |
| P-R06 | Region without script | 5646 §2.1 | `en-US` | region: `US` |
| P-R07 | Region case-insensitive | 5646 §2.1.1 | `en-us` | region: `US` |
| P-R08 | Private use regions accepted | 5646 §2.2.4 | `en-AA`, `en-QM`, `en-XA`, `en-ZZ` | valid |

### 1.5 Variant Subtag

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| P-V01 | 5-char variant accepted | 5646 §2.1 | `sl-rozaj` | variant: `['rozaj']` |
| P-V02 | 6-char variant accepted | 5646 §2.1 | `en-scouse` | variant present |
| P-V03 | 7-char variant accepted | 5646 §2.1 | `en-1234abc` | variant: `['1234abc']` |
| P-V04 | 8-char variant accepted | 5646 §2.1 | `en-12345678` | variant: `['12345678']` |
| P-V05 | Digit-starting 4-char variant accepted | 5646 §2.1 | `de-1996` | variant: `['1996']` |
| P-V06 | Multiple variants accepted | 5646 §2.1 | `sl-rozaj-biske` | variant: `['rozaj', 'biske']` |
| P-V07 | Duplicate variant rejected | 5646 §2.2.5 | `sl-rozaj-rozaj` | `null` |
| P-V08 | Duplicate variant case-insensitive | 5646 §2.2.5 | `sl-rozaj-ROZAJ` | `null` |
| P-V09 | 4 alpha chars is script, not variant | 5646 §2.1 | `en-Latn` | script: `Latn`, not variant |
| P-V10 | 3-char string after region invalid | 5646 §2.1 | `en-US-abc` | `null` or parse failure |

### 1.6 Extension Subtag

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| P-X01 | Single extension accepted | 5646 §2.1 | `en-a-foo` | extension: singleton `a`, subtags `['foo']` |
| P-X02 | Extension subtag min 2 chars | 5646 §2.1 | `en-a-fo` | valid (2 chars) |
| P-X03 | Extension subtag max 8 chars | 5646 §2.1 | `en-a-abcdefgh` | valid (8 chars) |
| P-X04 | Extension subtag 1 char rejected | 5646 §2.1 | `en-a-f` | `null` or invalid |
| P-X05 | Extension subtag 9+ chars rejected | 5646 §2.1 | `en-a-abcdefghi` | `null` or invalid |
| P-X06 | Multiple extensions (different singletons) | 5646 §2.1 | `en-a-foo-b-bar` | 2 extensions |
| P-X07 | Duplicate singleton rejected | 5646 §2.2.6 | `en-a-foo-a-bar` | `null` |
| P-X08 | Duplicate singleton case-insensitive | 5646 §2.2.6 | `en-A-foo-a-bar` | `null` |
| P-X09 | Singleton `x` is NOT a valid extension | 5646 §2.2.6 | `en-x-foo` | privateuse, not extension |
| P-X10 | Digit singletons (0-9) accepted | 5646 §2.1 | `en-0-foo` | valid extension |
| P-X11 | Letter singletons a-w, y-z accepted | 5646 §2.1 | `en-w-foo`, `en-y-foo` | valid extensions |
| P-X12 | At least one subtag per extension | 5646 §2.1 | `en-a` | `null` (missing subtag) |
| P-X13 | Extension subtags are alphanumeric | 5646 §2.1 | `en-a-f1` | valid |

### 1.7 Private Use

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| P-PU01 | Standalone privateuse tag | 5646 §2.1 | `x-custom` | type: `privateuse` |
| P-PU02 | Privateuse in langtag (trailing) | 5646 §2.1 | `en-x-custom` | privateuse: `['custom']` |
| P-PU03 | Privateuse subtag 1-8 chars | 5646 §2.1 | `x-a`, `x-abcdefgh` | valid |
| P-PU04 | Privateuse subtag 9+ chars rejected | 5646 §2.1 | `x-abcdefghi` | `null` |
| P-PU05 | Multiple privateuse subtags | 5646 §2.1 | `x-a-b-c` | privateuse: `['a', 'b', 'c']` |
| P-PU06 | Privateuse is always last in langtag | 5646 §2.1 | `en-x-foo-a-bar` | `a-bar` part of privateuse |
| P-PU07 | At least one subtag after x required | 5646 §2.1 | `x` | `null` |

### 1.8 Grandfathered Tags

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| P-G01 | All 17 irregular tags recognized | 5646 §2.1 | `en-GB-oed`, `i-ami`, `i-bnn`, `i-default`, `i-enochian`, `i-hak`, `i-klingon`, `i-lux`, `i-mingo`, `i-navajo`, `i-pwn`, `i-tao`, `i-tay`, `i-tsu`, `sgn-BE-FR`, `sgn-BE-NL`, `sgn-CH-DE` | type: `grandfathered`, subtype: `irregular` |
| P-G02 | All 9 regular tags recognized | 5646 §2.1 | `art-lojban`, `cel-gaulish`, `no-bok`, `no-nyn`, `zh-guoyu`, `zh-hakka`, `zh-min`, `zh-min-nan`, `zh-xiang` | type: `grandfathered`, subtype: `regular` |
| P-G03 | Grandfathered tags case-insensitive | 5646 §2.1.1 | `I-KLINGON` | same as `i-klingon` |
| P-G04 | Grandfathered tags are atomic | 5646 §2.2.8 | `i-klingon` | type: `grandfathered`, not decomposed |
| P-G05 | Regular grandfathered wins over langtag parse | 5646 §2.1 | `art-lojban` | grandfathered, not language=`art` |

### 1.9 General Parse Rules

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| P-GEN01 | Empty string rejected | 5646 §2.1 | `''` | `null` |
| P-GEN02 | Consecutive hyphens rejected | 5646 §2.1 | `en--US` | `null` |
| P-GEN03 | Leading hyphen rejected | 5646 §2.1 | `-en` | `null` |
| P-GEN04 | Trailing hyphen rejected | 5646 §2.1 | `en-` | `null` |
| P-GEN05 | Non-alphanumeric characters rejected | 5646 §2.1 | `en_US` | `null` |
| P-GEN06 | Full tag with all components | 5646 §2.1 | `zh-cmn-Hans-CN-1996-a-foo-x-bar` | all fields populated |
| P-GEN07 | Null/undefined input handled | — | `null` | `null` |

---

## 2. STRINGIFY — RFC 5646 Section 2.1.1 (Case Conventions)

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| S-01 | Language lowercase | 5646 §2.1.1 | language: `EN` | `en` |
| S-02 | Extlang lowercase | 5646 §2.1.1 | extlang: `CMN` | `cmn` |
| S-03 | Script Titlecase | 5646 §2.1.1 | script: `latn` | `Latn` |
| S-04 | Region 2-letter UPPERCASE | 5646 §2.1.1 | region: `us` | `US` |
| S-05 | Region 3-digit unchanged | 5646 §2.1.1 | region: `001` | `001` |
| S-06 | Variant lowercase | 5646 §2.1.1 | variant: `FONIPA` | `fonipa` |
| S-07 | Extension singleton lowercase | 5646 §2.1.1 | singleton: `A` | `a` |
| S-08 | Extension subtags lowercase | 5646 §2.1.1 | subtags: `FOO` | `foo` |
| S-09 | Privateuse lowercase | 5646 §2.1.1 | privateuse: `FOO` | `foo` |
| S-10 | Component ordering preserved | 5646 §2.1 | full tag | language-extlang-script-region-variant-extension-privateuse |
| S-11 | Grandfathered tag normalized case | 5646 §2.1.1 | `I-KLINGON` | `i-klingon` |
| S-12 | Privateuse standalone lowercase | 5646 §2.1.1 | `X-CUSTOM` | `x-custom` |
| S-13 | Roundtrip identity | — | any valid tag `t` | `parse(stringify(parse(t))) === parse(t)` |

---

## 3. CANONICALIZE — RFC 5646 Section 4.5 + §4.1 + §2.1.1 + UTS #35

> **Traceability note:** RFC 5646 §4.5 defines 3 canonicalization steps. This library implements a 6-step process that also incorporates case normalization (§2.1.1, optional), suppress-script removal (§4.1, SHOULD), and extension-specific ordering (UTS #35 via RFC 6067/6497). Section citations below reference the actual RFC section where each rule originates.

### 3.1 Step 1: Case Normalization

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| C-CASE01 | Same rules as stringify | 5646 §2.1.1 (optional per §4.5) | `EN-US` | `en-US` |

### 3.2 Step 2: Deprecated Subtag Replacement

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| C-DEP01 | Deprecated language `iw` | 5646 §4.5 | `iw` | `he` |
| C-DEP02 | Deprecated language `in` | 5646 §4.5 | `in` | `id` |
| C-DEP03 | Deprecated language `ji` | 5646 §4.5 | `ji` | `yi` |
| C-DEP04 | Deprecated language `jw` | 5646 §4.5 | `jw` | `jv` |
| C-DEP05 | Deprecated language `mo` | 5646 §4.5 | `mo` | `ro` |
| C-DEP06 | Deprecated region `BU` | 5646 §4.5 | `my-BU` | `my-MM` |
| C-DEP07 | Deprecated region `DD` | 5646 §4.5 | `de-DD` | `de-DE` |
| C-DEP08 | Deprecated region `FX` | 5646 §4.5 | `fr-FX` | `fr-FR` |
| C-DEP09 | Deprecated region `TP` | 5646 §4.5 | `pt-TP` | `pt-TL` |
| C-DEP10 | Deprecated region `YD` | 5646 §4.5 | `ar-YD` | `ar-YE` |
| C-DEP11 | Deprecated region `ZR` | 5646 §4.5 | `fr-ZR` | `fr-CD` |
| C-DEP12 | Deprecated variant `heploc` | 5646 §4.5 | `ja-Latn-heploc` | `ja-Latn-alalc97` |
| C-DEP13 | Grandfathered `i-klingon` | 5646 §4.5 | `i-klingon` | `tlh` |
| C-DEP14 | Grandfathered `en-GB-oed` | 5646 §4.5 | `en-GB-oed` | `en-GB-oxendict` |
| C-DEP15 | Grandfathered `art-lojban` | 5646 §4.5 | `art-lojban` | `jbo` |
| C-DEP16 | Grandfathered `zh-min-nan` | 5646 §4.5 | `zh-min-nan` | `nan` |
| C-DEP17 | Grandfathered `i-default` unchanged | 5646 §4.5 | `i-default` | `i-default` |
| C-DEP18 | Grandfathered `zh-min` unchanged | 5646 §4.5 | `zh-min` | `zh-min` |
| C-DEP19 | Grandfathered `cel-gaulish` unchanged | 5646 §4.5 | `cel-gaulish` | `cel-gaulish` |
| C-DEP20 | Grandfathered `i-enochian` unchanged | 5646 §4.5 | `i-enochian` | `i-enochian` |
| C-DEP21 | Grandfathered `i-mingo` unchanged | 5646 §4.5 | `i-mingo` | `i-mingo` |
| C-DEP22 | Redundant `sgn-BR` | 5646 §4.5 | `sgn-BR` | `bzs` |
| C-DEP23 | Redundant `sgn-US` | 5646 §4.5 | `sgn-US` | `ase` |
| C-DEP24 | Redundant `sgn-JP` | 5646 §4.5 | `sgn-JP` | `jsl` |
| C-DEP25 | All 19 redundant sgn-* mappings | 5646 §4.5 | `sgn-CO` → `csn`, `sgn-DE` → `gsg`, `sgn-DK` → `dsl`, `sgn-ES` → `ssp`, `sgn-FR` → `fsl`, `sgn-GB` → `bfi`, `sgn-GR` → `gss`, `sgn-IE` → `isg`, `sgn-IT` → `ise`, `sgn-MX` → `mfs`, `sgn-NI` → `ncs`, `sgn-NL` → `dse`, `sgn-NO` → `nsl`, `sgn-PT` → `psr`, `sgn-SE` → `swl`, `sgn-ZA` → `sfs` | each mapping correct |
| C-DEP26 | Redundant tag idempotency | 5646 §4.5 | `canonicalize(canonicalize('sgn-BR'))` | `=== canonicalize('sgn-BR')` |

### 3.3 Step 3: Extlang Promotion

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| C-EXT01 | `zh-cmn` promoted | 5646 §4.5 | `zh-cmn` | `cmn` |
| C-EXT02 | `zh-yue` promoted | 5646 §4.5 | `zh-yue` | `yue` |
| C-EXT03 | Preserves remaining subtags | 5646 §4.5 | `zh-cmn-Hans` | `cmn-Hans` |
| C-EXT04 | Sign language extlang promoted | 5646 §4.5 | `sgn-jsl` | `jsl` |
| C-EXT05 | Non-matching prefix: no promotion | 5646 §4.5 | `en-cmn` | `en-cmn` |
| C-EXT06 | Deprecated extlang NOT promoted | 5646 §4.5 + IANA | deprecated extlangs (ajp, bbz, lsg, rsi, yds) | handled via DEPRECATED_LANGUAGES instead |

### 3.4 Step 4: Suppress-Script Removal (from §4.1, SHOULD recommendation)

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| C-SS01 | `en-Latn` suppressed | 5646 §4.1 | `en-Latn` | `en` |
| C-SS02 | `ru-Cyrl` suppressed | 5646 §4.1 | `ru-Cyrl` | `ru` |
| C-SS03 | `ja-Jpan` suppressed | 5646 §4.1 | `ja-Jpan` | `ja` |
| C-SS04 | `zh-Hans` NOT suppressed | 5646 §4.1 | `zh-Hans` | `zh-Hans` |
| C-SS05 | Non-suppressed script preserved | 5646 §4.1 | `en-Cyrl` | `en-Cyrl` |
| C-SS06 | Suppress-script after extlang promotion | 5646 §4.1 | `zh-cmn` → `cmn` | suppress-script applied to promoted language |
| C-SS07 | Case-insensitive suppress check | 5646 §4.1 | `en-latn` | `en` (after case normalization) |

### 3.5 Step 5: Extension Ordering

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| C-ORD01 | Extensions sorted by singleton | 5646 §4.5 | `en-u-ca-buddhist-a-foo` | `en-a-foo-u-ca-buddhist` |
| C-ORD02 | Numeric singletons before letters | 5646 §4.5 | `en-b-bar-0-foo` | `en-0-foo-b-bar` |
| C-ORD03 | Already-sorted extensions unchanged | 5646 §4.5 | `en-a-foo-b-bar` | `en-a-foo-b-bar` |

### 3.6 Step 6: Extension-Specific Canonicalization

#### U Extension (UTS #35 / RFC 6067)

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| C-U01 | Attributes sorted in US-ASCII order | UTS #35 + 6067 §3 | `en-u-zebra-apple` | `en-u-apple-zebra` |
| C-U02 | Keywords sorted by key | UTS #35 + 6067 §3 | `en-u-co-phonebk-ca-buddhist` | `en-u-ca-buddhist-co-phonebk` |
| C-U03 | Attributes before keywords after sort | UTS #35 + 6067 | `en-u-zebra-apple-co-phonebk-ca-buddhist` | `en-u-apple-zebra-ca-buddhist-co-phonebk` |
| C-U04 | Type subtag order within keyword preserved | UTS #35 + 6067 | `en-u-ca-islamic-civil` | order within `ca` unchanged |
| C-U05 | All lowercase | UTS #35 + 6067 | `en-U-CA-BUDDHIST` | `en-u-ca-buddhist` |

#### T Extension (UTS #35 / RFC 6497)

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| C-T01 | Fields sorted by tkey (UTS #35: `fsep`) | UTS #35 + 6497 §2.3 | `en-t-ja-m0-true-d0-fwidth` | `en-t-ja-d0-fwidth-m0-true` |
| C-T02 | Source language preserved first | UTS #35 + 6497 §2.3 | `en-t-ja-m0-true` | `ja` stays before fields |
| C-T03 | Subtag order within field preserved | UTS #35 + 6497 §2.3 | `en-t-m0-ungegn-2007` | `ungegn-2007` order unchanged |
| C-T04 | All lowercase | UTS #35 + 6497 §2.3 | `en-T-JA-M0-TRUE` | `en-t-ja-m0-true` |

---

## 4. FILTER — RFC 4647 Section 3.3.2 (Extended Filtering)

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| F-01 | Exact match (case-insensitive) | 4647 §3.3.2 | range: `de-DE`, tag: `de-DE` | match |
| F-02 | Prefix match | 4647 §3.3.2 | range: `de`, tag: `de-DE` | match |
| F-03 | First subtag must match | 4647 §3.3.2 | range: `en`, tag: `de-DE` | no match |
| F-04 | Wildcard `*` in first position | 4647 §3.3.2 | range: `*`, tag: `de-DE` | match |
| F-05 | Wildcard in non-first position skipped | 4647 §3.3.2 | range: `de-*-DE`, tag: `de-DE` | match |
| F-06 | Wildcard matches intermediate subtags | 4647 §3.3.2 | range: `de-*-DE`, tag: `de-Latn-DE` | match |
| F-07 | Singleton acts as barrier | 4647 §3.3.2 | range: `de-DE`, tag: `de-x-DE` | no match |
| F-08 | Non-matching non-singleton skipped | 4647 §3.3.2 | range: `de-DE`, tag: `de-Latn-DE` | match |
| F-09 | Tag shorter than range fails | 4647 §3.3.2 | range: `de-DE-1996`, tag: `de` | no match |
| F-10 | Case-insensitive | 4647 §3.3.2 | range: `de-de`, tag: `de-DE` | match |
| F-11 | Results deduplicated | 4647 §3.3.2 | same tag matched by multiple ranges | appears once |
| F-12 | Multiple ranges in priority order | 4647 §3.3.2 | ranges: `['fr', 'de']` | `fr` matches listed first |
| F-13 | Tag with trailing subtags matches | 4647 §3.3.2 | range: `de-DE`, tag: `de-DE-1996` | match |
| F-14 | Wildcard-only range matches all | 4647 §3.3.2 | range: `*` | all tags match |
| F-15 | Empty tags array | — | tags: `[]` | `[]` |
| F-16 | Empty ranges array | — | ranges: `[]` | `[]` |
| F-17 | Singleton `x` acts as barrier | 4647 §3.3.2 | range: `en-US`, tag: `en-x-US` | no match |
| F-18 | Multiple wildcards in range | 4647 §3.3.2 | range: `de-*-*-DE` | wildcards skipped, matches `de-Latn-DE` etc. |

---

## 5. LOOKUP — RFC 4647 Section 3.4

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| L-01 | Exact match found | 4647 §3.4 | range: `en-US`, tags: `['en-US']` | `en-US` |
| L-02 | Progressive truncation | 4647 §3.4 | range: `en-US-x-foo`, tags: `['en-US']` | `en-US` |
| L-03 | Singleton removed with preceding subtag | 4647 §3.4 | range: `en-US-x-foo` | skips `en-US-x`, tries `en-US` |
| L-04 | Full truncation sequence | 4647 §3.4 | `zh-Hant-CN-x-p1-p2` | tries: full → `-p1` → `-CN` → `-Hant` → `zh` → default |
| L-05 | First match wins from priority list | 4647 §3.4 | ranges: `['fr', 'en']`, tags: `['en', 'fr']` | `fr` |
| L-06 | Returns original tag casing | 4647 §3.4 | range: `en-us`, tags: `['en-US']` | `en-US` |
| L-07 | Wildcard `*` skipped (not only range) | 4647 §3.4 | ranges: `['*', 'en']`, tags: `['en']` | `en` |
| L-08 | Wildcard `*` as only range returns default | 4647 §3.4 | ranges: `['*']` | default or `null` |
| L-09 | No match returns default | 4647 §3.4 | ranges: `['xx']`, tags: `['en']` | default or `null` |
| L-10 | Case-insensitive matching | 4647 §3.4 | range: `EN-US`, tags: `['en-us']` | match |
| L-11 | Empty available tags | — | tags: `[]` | default or `null` |
| L-12 | Empty ranges | — | ranges: `[]` | default or `null` |

---

## 6. EXTENSION U — RFC 6067

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| EU-01 | Extract attributes | 6067 | `en-u-attr1-attr2-ca-buddhist` | attributes: `['attr1', 'attr2']` |
| EU-02 | Extract keywords | 6067 | `en-u-ca-buddhist` | keywords: `{ ca: 'buddhist' }` |
| EU-03 | Key without type value | 6067 | `en-u-ca` | keywords: `{ ca: '' }` |
| EU-04 | Multiple keywords | 6067 | `en-u-ca-buddhist-co-phonebk` | both keywords extracted |
| EU-05 | Attribute length: 3-8 alphanumeric | 6067 | `en-u-abc` (3), `en-u-abcdefgh` (8) | valid attributes |
| EU-06 | Key pattern: alphanumeric + alphabetic | 6067 | `ca`, `co`, `nu` | valid 2-char keys |
| EU-07 | Type length: 3-8 chars per subtag | 6067 | `buddhist` (8 chars) | valid type |
| EU-08 | Multi-subtag type | 6067 | `en-u-vt-0041-005a` | keywords: `{ vt: '0041-005a' }` |
| EU-09 | No U extension returns null | 6067 | `en-US` | `null` |
| EU-10 | Non-langtag returns null | 6067 | `x-custom` | `null` |

---

## 7. EXTENSION T — RFC 6497

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| ET-01 | Extract source language | 6497 | `en-t-ja` | source: `ja` |
| ET-02 | Source with script | 6497 | `en-t-ja-Kana` | source: `ja-kana` |
| ET-03 | Source with region | 6497 | `en-t-ja-JP` | source includes region |
| ET-04 | Source with variant | 6497 | `en-t-ja-1996` | source includes variant |
| ET-05 | Extract fields | 6497 | `en-t-m0-true` | fields: `{ m0: 'true' }` |
| ET-06 | Multiple fields | 6497 | `en-t-m0-true-d0-fwidth` | fields: `{ m0: 'true', d0: 'fwidth' }` |
| ET-07 | Source + fields | 6497 | `en-t-ja-m0-true` | source: `ja`, fields: `{ m0: 'true' }` |
| ET-08 | Fields only (no source) | 6497 | `en-t-m0-true` | source: `null`, fields present |
| ET-09 | tkey pattern: ALPHA + DIGIT | 6497 | `m0`, `d0`, `s0`, `h0` | valid tkeys |
| ET-10 | Multi-subtag tvalue | 6497 | `en-t-m0-ungegn-2007` | m0: `ungegn-2007` |
| ET-11 | No T extension returns null | 6497 | `en-US` | `null` |
| ET-12 | Source `und` for script-only | 6497 | `en-t-und-Cyrl` | source: `und-cyrl` |

---

## 8. ACCEPT-LANGUAGE — RFC 9110 Section 12.5.4

> **Implementation note:** Rules AL-Q09 through AL-Q12 and AL-H09 specify that syntactically invalid entries per the ABNF grammar are "skipped silently." RFC 9110 defines the syntax that makes these invalid but does not explicitly prescribe skip-silently behavior. This is a robustness implementation choice (Postel's law).

### 8.1 Quality Value Parsing (Section 12.4.2)

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| AL-Q01 | Default quality 1.0 when omitted | 9110 §12.4.2 | `en` | quality: `1.0` |
| AL-Q02 | Explicit `q=1` | 9110 §12.4.2 | `en;q=1` | quality: `1.0` |
| AL-Q03 | `q=1.0` | 9110 §12.4.2 | `en;q=1.0` | quality: `1.0` |
| AL-Q04 | `q=1.000` max decimal places | 9110 §12.4.2 | `en;q=1.000` | quality: `1.0` |
| AL-Q05 | `q=0` not acceptable | 9110 §12.4.2 | `en;q=0` | quality: `0` |
| AL-Q06 | `q=0.0` | 9110 §12.4.2 | `en;q=0.0` | quality: `0` |
| AL-Q07 | `q=0.5` medium preference | 9110 §12.4.2 | `en;q=0.5` | quality: `0.5` |
| AL-Q08 | `q=0.001` minimal preference | 9110 §12.4.2 | `en;q=0.001` | quality: `0.001` |
| AL-Q09 | Invalid: `q=1.1` exceeds range | 9110 §12.4.2 | `en;q=1.1` | entry skipped |
| AL-Q10 | Invalid: `q=0.1234` too many decimals | 9110 §12.4.2 | `en;q=0.1234` | entry skipped |
| AL-Q11 | Invalid: negative quality | 9110 §12.4.2 | `en;q=-0.5` | entry skipped |
| AL-Q12 | Invalid: `q=2` exceeds range | 9110 §12.4.2 | `en;q=2` | entry skipped |

### 8.2 Header Parsing (Section 12.5.4)

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| AL-H01 | Single entry | 9110 §12.5.4 | `en` | `[{ tag: 'en', quality: 1.0 }]` |
| AL-H02 | Multiple comma-separated | 9110 §12.5.4 | `en, fr` | two entries |
| AL-H03 | With quality weights | 9110 §12.5.4 | `en, fr;q=0.8` | sorted: en(1.0), fr(0.8) |
| AL-H04 | Sorted by quality descending | 9110 §12.5.4 | `fr;q=0.5, en;q=0.8` | en first |
| AL-H05 | Equal quality preserves order | 9110 §12.5.4 | `en, fr` | en first (both 1.0) |
| AL-H06 | Whitespace around commas | 9110 §12.5.4 | `en , fr` | works |
| AL-H07 | Whitespace around semicolons | 9110 §12.5.4 | `en ; q=0.8` | works |
| AL-H08 | Wildcard `*` accepted | 9110 §12.5.4 | `*;q=0.5, en` | valid |
| AL-H09 | Invalid entries skipped silently | 9110 §12.5.4 | `en, ;q=invalid, fr` | en, fr |
| AL-H10 | Empty string | — | `''` | `[]` |
| AL-H11 | Complex real-world header | 9110 §12.5.4 | `da, en-GB;q=0.8, en;q=0.7` | sorted correctly |
| AL-H12 | Language ranges accepted | 9110 §12.5.4 + 4647 §2.1 | `en-US, en;q=0.9` | valid |

---

## 9. LANGTAG BUILDER — Programmatic Construction Validation

| # | Rule | RFC | Input | Expected |
|---|------|-----|-------|----------|
| LB-01 | Valid language required | 5646 §2.2.1 | `langtag('en')` | valid |
| LB-02 | Language: 2-8 ALPHA | 5646 §2.1 | `langtag('1')` | `RangeError` |
| LB-03 | Language: 9+ chars rejected | 5646 §2.1 | `langtag('abcdefghi')` | `RangeError` |
| LB-04 | Extlang: 3 ALPHA each | 5646 §2.1 | `{ extlang: ['cmn'] }` | valid |
| LB-05 | Extlang: max 3 subtags | 5646 §2.1 | 4 extlangs | `RangeError` |
| LB-06 | Extlang: only with 2-3 char language | 5646 §2.2.2 | 4-char language + extlang | `RangeError` |
| LB-07 | Script: exactly 4 ALPHA | 5646 §2.1 | `{ script: 'Latn' }` | valid |
| LB-08 | Script: wrong length rejected | 5646 §2.1 | 3 or 5 chars | `RangeError` |
| LB-09 | Region: 2 ALPHA or 3 DIGIT | 5646 §2.1 | `US`, `001` | valid |
| LB-10 | Region: invalid format rejected | 5646 §2.1 | `U`, `1234` | `RangeError` |
| LB-11 | Variant: 5-8 alphanum or digit+3 | 5646 §2.1 | `rozaj`, `1996` | valid |
| LB-12 | Variant: duplicates rejected | 5646 §2.2.5 | `['rozaj', 'rozaj']` | `RangeError` |
| LB-13 | Extension: singleton + subtags | 5646 §2.1 | `{ singleton: 'a', subtags: ['foo'] }` | valid |
| LB-14 | Extension: singleton `x` rejected | 5646 §2.2.6 | singleton `x` | `RangeError` |
| LB-15 | Extension: duplicate singletons rejected | 5646 §2.2.6 | two `a` extensions | `RangeError` |
| LB-16 | Extension: subtags 2-8 chars | 5646 §2.1 | 1-char or 9+-char subtag | `RangeError` |
| LB-17 | Privateuse: 1-8 chars each | 5646 §2.1 | valid lengths | accepted |
| LB-18 | Automatic case normalization | 5646 §2.1.1 | `EN` | stored as `en` |

---

## Summary

| Category | Rules | Source |
|----------|-------|--------|
| Parse (ABNF syntax) | 76 | RFC 5646 §2.1-2.2 |
| Stringify (case conventions) | 13 | RFC 5646 §2.1.1 |
| Canonicalize (6 steps) | 52 | RFC 5646 §4.5 + §4.1 + §2.1.1 + UTS #35 (RFC 6067 + RFC 6497) |
| Filter (extended filtering) | 18 | RFC 4647 §3.3.2 |
| Lookup | 12 | RFC 4647 §3.4 |
| Extension U | 10 | RFC 6067 + UTS #35 |
| Extension T | 12 | RFC 6497 + UTS #35 |
| Accept-Language | 24 | RFC 9110 §12.4.2 + §12.5.4 |
| Langtag Builder | 18 | RFC 5646 §2.1-2.2 |
| **Total** | **235** | |

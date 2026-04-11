# UTS #35 — Unicode Locale Data Markup Language (LDML)

- **Full title**: Unicode Technical Standard #35: Unicode Locale Data Markup Language
- **Version**: 48.2 (2026-03-03)
- **URL**: https://unicode.org/reports/tr35/
- **Status**: Unicode Technical Standard
- **Relates to**: RFC 6067 (U extension), RFC 6497 (T extension), RFC 5646 (BCP 47)

## Relationship to RFC 6067 and RFC 6497

The Unicode Consortium has registered and is the maintaining authority for two BCP 47 language tag extensions:

- Extension **u** for Unicode locale extension (RFC 6067)
- Extension **t** for transformed content (RFC 6497)

Both RFCs delegate the actual key/type definitions to UTS #35 and the CLDR data files. The syntax of u extension subtags is defined by the rule `unicode_locale_extensions`, except the separator `sep` must always be hyphen `-` when used as part of a BCP 47 language tag (not underscore).

UTS #35 note on ukey: "this is narrower than in RFC 6067, so that it is disjoint with tkey." Specifically, ukey = `alphanum alpha` while tkey = `alpha digit`, ensuring no ambiguity.

Certain codes that are private-use in BCP 47 and ISO are given semantics by LDML.

## EBNF Grammar

### Complete Unicode Locale Identifier

```ebnf
unicode_locale_id
    = unicode_language_id
      extensions*
      pu_extensions? ;

unicode_language_id
    = "root"
    | (unicode_language_subtag
        (sep unicode_script_subtag)?
      | unicode_script_subtag)
      (sep unicode_region_subtag)?
      (sep unicode_variant_subtag)* ;

extensions
    = unicode_locale_extensions
    | transformed_extensions
    | other_extensions ;
```

### Subtag Productions

```ebnf
unicode_language_subtag = alpha{2,3} | alpha{5,8} ;
unicode_script_subtag   = alpha{4} ;
unicode_region_subtag   = alpha{2} | digit{3} ;
unicode_variant_subtag  = alphanum{5,8} | digit alphanum{3} ;
```

### U Extension (unicode_locale_extensions)

```ebnf
unicode_locale_extensions
    = sep [uU]
      ((sep keyword)+
      |(sep uattribute)+ (sep ufield)*) ;

ufield    = ukey (sep uvalue)? ;
ukey      = alphanum alpha ;
uvalue    = alphanum{3,8} (sep alphanum{3,8})* ;
uattribute = alphanum{3,8} ;
```

- **keyword** is an alias for **ufield**.
- **key** is an alias for **ukey**.
- **type** is an alias for **uvalue**.
- **attribute** is an alias for **uattribute**.

Key structural points:
- `ukey` = exactly 2 characters: first is alphanumeric `[0-9A-Za-z]`, second is alphabetic `[A-Za-z]`
- `uvalue` = one or more subtags of 3-8 alphanumeric characters, separated by `-` or `_`. The `*` means zero or more ADDITIONAL subtags after the first (so: 1+ subtags total).
- `uattribute` = single subtag of 3-8 alphanumeric characters
- `uvalue` is optional — a ukey with no uvalue implies the type value `"true"`

### T Extension (transformed_extensions)

```ebnf
transformed_extensions
    = sep [tT]
      ((sep tlang (sep tfield)*)
      | (sep tfield)+) ;

tlang
    = unicode_language_subtag
      (sep unicode_script_subtag)?
      (sep unicode_region_subtag)?
      (sep unicode_variant_subtag)* ;

tfield = tkey tvalue ;
tkey   = alpha digit ;
tvalue = alphanum{3,8} (sep alphanum{3,8})+ ;
```

Key structural points:
- `tkey` = exactly 2 characters: first is alphabetic `[A-Za-z]`, second is a digit `[0-9]`
- `tvalue` = two or more subtags of 3-8 alphanumeric characters, separated by `-` or `_`. The `+` means one or more ADDITIONAL subtags after the first (so: 2+ subtags total).
- A T extension MUST have at least one subtag (either tlang or at least one tfield)
- `tlang` is a restricted form of `unicode_language_id` (no "root", no extensions)

**CRITICAL DIFFERENCE**: `uvalue` uses `*` (1+ total subtags) while `tvalue` uses `+` (2+ total subtags).

### Other Extensions

```ebnf
other_extensions
    = sep [alphanum-[tTuUxX]]
      (sep alphanum{2,8})+ ;
```

Any single alphanumeric character except t, T, u, U, x, X as singleton.

### Private Use Extensions

```ebnf
pu_extensions
    = sep [xX]
      (sep alphanum{1,8})+ ;
```

1-8 character alphanumeric subtags after the x singleton.

### Helper Productions

```ebnf
sep      = [-_] ;
digit    = [0-9] ;
alpha    = [A-Za-z] ;
alphanum = [0-9A-Za-z] ;
```

## Well-Formedness Constraints

A `unicode_locale_id` is well-formed if it matches the EBNF AND satisfies these constraints:

1. The sequence of variant subtags in `unicode_language_id` MUST NOT have duplicates (e.g., `de-1996-fonipa-1996` is ill-formed)
2. There MUST NOT be more than one extension with the same singleton (e.g., `en-u-ca-buddhist-u-cf-standard` is ill-formed)
3. There MUST NOT be more than one identical ukey (e.g., `en-u-ca-buddhist-ca-islamic` is ill-formed)
4. There MUST NOT be more than one identical tkey
5. The sequence of variant subtags in a `tlang` MUST NOT have duplicates
6. The private use extension (`-x-`) MUST come after all other extensions

## Valid vs Well-Formed

- **Well-formed**: syntactically correct per EBNF plus the constraints above
- **Valid**: well-formed AND all subtags are semantically valid per CLDR validity data files (language.xml, script.xml, region.xml, variant.xml, etc.)
- **Canonical**: valid identifier transformed per Annex C canonicalization

## Canonical Form

A `unicode_locale_id` is in canonical form when:

1. Starts with language subtag (not script)
2. Script subtags in title case (e.g., `Hant`)
3. Region subtags in uppercase (e.g., `DE`)
4. All other subtags in lowercase (e.g., `en`, `fonipa`)
5. Variant subtags in alphabetical order
6. Extensions in alphabetical order by singleton (e.g., `-t-` before `-u-`)
7. Attributes sorted alphabetically
8. ufield and tfield entries sorted by key alphabetically
9. Any ufield value `"true"` is removed

Example: `en-u-foo-bar-nu-thai-ca-buddhist-kk-true` canonicalizes to `en-u-bar-foo-ca-buddhist-kk-nu-thai`

Note: canonicalization does NOT change invalid locales to valid locales. For example, `und-u-ka` canonicalizes to `und-u-ka-true`, but `und-u-ka-true` is invalid since `"true"` is not a valid value for `ka`.

### Handling of "true" Values

- If a ukey has no type/uvalue, the type value `"true"` is assumed
- During canonicalization, any ufield value `"true"` is removed (so `-u-kk-true` becomes `-u-kk`)
- This only applies to ufields, not tfields

### Canonicalization Algorithm (Annex C)

1. Preprocessing: normalize separators and case
2. Process LanguageIds: apply alias mappings
3. Process LocaleIds: process extensions
4. Apply ordering rules: variants alphabetically, extensions by singleton alphabetically
5. Remove `"true"` ufield values

## BCP 47 Conformance Requirements

### Unicode BCP 47 Locale Identifier

- The EBNF `sep` is restricted to only `-` (hyphen) in `unicode_language_id` and `unicode_locale_id`
- The first subtag must be a `unicode_language_subtag`

### Unicode CLDR Locale Identifier

- The EBNF `sep` is restricted to only `_` (underscore) in `unicode_language_id` and `unicode_locale_id`
- The `unicode_language_id` `"und"` is replaced by `"root"`
- The first subtag cannot be a `unicode_script_subtag`

---

## U Extension Keys — Complete Reference

All U extension keys use the `u` singleton. Keys are defined in CLDR `common/bcp47/*.xml` files.

### ca — Calendar Algorithm

**Source file**: `common/bcp47/calendar.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `buddhist` | Thai Buddhist calendar | |
| `chinese` | Traditional Chinese calendar | |
| `coptic` | Coptic calendar | |
| `dangi` | Traditional Korean calendar | Since 22.1 |
| `ethioaa` | Ethiopic calendar, Amete Alem (epoch approx. 5493 B.C.E) | Alias: `ethiopic-amete-alem` |
| `ethiopic` | Ethiopic calendar, Amete Mihret (epoch approx. 8 C.E.) | |
| `gregory` | Gregorian calendar | Alias: `gregorian` |
| `hebrew` | Traditional Hebrew calendar | |
| `indian` | Indian calendar | |
| `islamic` | Hijri calendar | |
| `islamic-umalqura` | Hijri calendar, Umm al-Qura | Since 24 |
| `islamic-tbla` | Hijri calendar, tabular (intercalary years [2,5,7,10,13,16,18,21,24,26,29] - astronomical epoch) | Since 24 |
| `islamic-civil` | Hijri calendar, tabular (intercalary years [2,5,7,10,13,16,18,21,24,26,29] - civil epoch) | Since 24 |
| `islamic-rgsa` | Hijri calendar, Saudi Arabia sighting | Since 24 |
| `iso8601` | ISO calendar (Gregorian using ISO 8601 calendar week rules) | Since 2.0 |
| `japanese` | Japanese Imperial calendar | |
| `persian` | Persian calendar | |
| `roc` | Republic of China calendar | |
| `islamicc` | Civil (algorithmic) Arabic calendar | **Deprecated**; preferred: `islamic-civil` |

### cf — Currency Format Style

**Source file**: `common/bcp47/currency.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `standard` | Standard currency format | Since 28 |
| `account` | Accounting currency format | Since 28 |

### co — Collation Type

**Source file**: `common/bcp47/collation.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `big5han` | Pinyin ordering for Latin, big5 charset ordering for CJK characters | **Deprecated** |
| `compat` | A previous version of the ordering, for compatibility | Since 26 |
| `dict` | Dictionary style ordering (such as in Sinhala) | Alias: `dictionary` |
| `direct` | Binary code point order | **Deprecated** |
| `ducet` | The default Unicode collation element table order | Since 2.0.1 |
| `emoji` | Recommended ordering for emoji characters | Since 27 |
| `eor` | European ordering rules | Since 24 |
| `gb2312` | Pinyin ordering for Latin, gb2312han charset ordering for CJK | Alias: `gb2312han`, **Deprecated** |
| `phonebk` | Phonebook style ordering (such as in German) | Alias: `phonebook` |
| `phonetic` | Phonetic ordering (sorting based on pronunciation) | |
| `pinyin` | Pinyin ordering for Latin and for CJK characters | |
| `reformed` | Reformed ordering (such as in Swedish) | **Deprecated** |
| `search` | Special collation type for string search | Since 1.9 |
| `searchjl` | Special collation type for Korean initial consonant search | Since 2.0.1 |
| `standard` | Default ordering for each language | |
| `stroke` | Pinyin ordering for Latin, stroke order for CJK characters | |
| `trad` | Traditional style ordering (such as in Spanish) | Alias: `traditional` |
| `unihan` | Pinyin ordering for Latin, Unihan radical-stroke ordering for CJK | |
| `zhuyin` | Pinyin ordering for Latin, zhuyin order for Bopomofo and CJK | Since 22 |

### cu — Currency Type

**Source file**: `common/bcp47/currency.xml`

ISO 4217 three-letter currency codes (lowercase). The full list contains 300+ entries. See `common/bcp47/currency.xml` for the complete set. Examples: `usd`, `eur`, `gbp`, `jpy`, `cny`, `chf`, `aud`, `cad`, `inr`, `brl`, etc.

### dx — Dictionary Break Script Exclusions

**Source file**: `common/bcp47/segmentation.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `SCRIPT_CODE` | ISO 15924 script code | Since 38, `valueType="multiple"` |

### em — Emoji Presentation Style

**Source file**: `common/bcp47/variant.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `emoji` | Use emoji presentation for emoji characters if possible | Since 29 |
| `text` | Use text presentation for emoji characters if possible | Since 29 |
| `default` | Use the default presentation as specified in UTR #51 | Since 29 |

### fw — First Day of Week

**Source file**: defined in UTS #35 supplemental data

| Type | Description |
|------|-------------|
| `sun` | Sunday |
| `mon` | Monday |
| `tue` | Tuesday |
| `wed` | Wednesday |
| `thu` | Thursday |
| `fri` | Friday |
| `sat` | Saturday |

Specifying `fw` in a locale identifier overrides the default value specified by supplemental week data for the region.

### hc — Hour Cycle

**Source file**: defined in UTS #35 supplemental data

| Type | Description |
|------|-------------|
| `h12` | Hour system using 1-12; corresponds to `h` in patterns |
| `h23` | Hour system using 0-23; corresponds to `H` in patterns |
| `h11` | Hour system using 0-11; corresponds to `K` in patterns |
| `h24` | Hour system using 1-24; corresponds to `k` in patterns |
| `c12` | Technical Preview: Locale-preferred 12-hour cycle resolving to h11 or h12 |
| `c24` | Technical Preview: Locale-preferred 24-hour cycle resolving to h23 or h24 |

Specifying `hc` in a locale identifier overrides the default value specified by supplemental time data for the region.

### ka — Collation Alternate Handling

**Source file**: `common/bcp47/collation.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `noignore` | Variable collation elements are not reset to ignorable | Alias: `non-ignorable` |
| `shifted` | Variable collation elements are reset to zero at levels one through three | |

### kb — Collation Backward Second Level

**Source file**: `common/bcp47/collation.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `true` | The second level to be backwards | Alias: `yes` |
| `false` | No backwards (the second level to be forwards) | Alias: `no` |

### kc — Collation Case Level

**Source file**: `common/bcp47/collation.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `true` | The case level is inserted in front of tertiary | Alias: `yes` |
| `false` | No special case level handling | Alias: `no` |

### kf — Collation Case First

**Source file**: `common/bcp47/collation.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `upper` | Upper case to be sorted before lower case | |
| `lower` | Lower case to be sorted before upper case | |
| `false` | No special case ordering | Alias: `no` |

### kh — Collation Hiragana Quaternary (**Deprecated**)

**Source file**: `common/bcp47/collation.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `true` | Hiragana to be sorted before all non-variable on quaternary level | Alias: `yes` |
| `false` | No special handling for Hiragana | Alias: `no` |

### kk — Collation Normalization

**Source file**: `common/bcp47/collation.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `true` | Convert text into Normalization Form D before calculating collation weights | Alias: `yes` |
| `false` | Skip normalization | Alias: `no` |

### kn — Collation Numeric

**Source file**: `common/bcp47/collation.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `true` | A sequence of decimal digits is sorted at primary level with its numeric value | Alias: `yes` |
| `false` | No special handling for numeric ordering | Alias: `no` |

### kr — Collation Reorder Codes

**Source file**: `common/bcp47/collation.xml`, `valueType="multiple"`

| Type | Description | Notes |
|------|-------------|-------|
| `space` | Whitespace reordering code | Since 21 |
| `punct` | Punctuation reordering code | Since 21 |
| `symbol` | Symbol reordering code (other than currency) | Since 21 |
| `currency` | Currency reordering code | Since 21 |
| `digit` | Digit (number) reordering code | Since 21 |
| `REORDER_CODE` | Other collation reorder code (for script) | Since 21 |

### ks — Collation Strength

**Source file**: `common/bcp47/collation.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `level1` | The primary level | Alias: `primary` |
| `level2` | The secondary level | Alias: `secondary` |
| `level3` | The tertiary level | Alias: `tertiary` |
| `level4` | The quaternary level | Alias: `quaternary` |
| `identic` | The identical level | Alias: `identical` |

### kv — Collation Max Variable

**Source file**: `common/bcp47/collation.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `space` | Only spaces are affected by ka-shifted | Since 25 |
| `punct` | Spaces and punctuation are affected by ka-shifted (CLDR default) | Since 25 |
| `symbol` | Spaces, punctuation and symbols except for currency symbols (UCA default) | Since 25 |
| `currency` | Spaces, punctuation and all symbols are affected by ka-shifted | Since 25 |

### lb — Line Break Style

**Source file**: `common/bcp47/segmentation.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `strict` | CSS level 3 line-break=strict, e.g. treat CJ as NS | Since 27 |
| `normal` | CSS level 3 line-break=normal, e.g. treat CJ as ID | Since 27 |
| `loose` | CSS level 3 line-break=loose | Since 27 |

### lw — Line Break Word Handling

**Source file**: `common/bcp47/segmentation.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `normal` | CSS level 3 word-break=normal | Since 28 |
| `breakall` | CSS level 3 word-break=break-all | Since 28 |
| `keepall` | CSS level 3 word-break=keep-all | Since 28 |
| `phrase` | Prioritize keeping natural phrases together when breaking | Since 41 |

### ms — Measurement System

**Source file**: `common/bcp47/measure.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `metric` | Metric System | Since 28 |
| `ussystem` | US System of measurement (feet, pints=16oz, etc.) | Since 28 |
| `uksystem` | UK System of measurement (feet, pints=20oz, etc.) | Alias: `imperial`, since 28 |

### mu — Measurement Unit Override

**Source file**: `common/bcp47/measure.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `celsius` | Temperature unit is Celsius | Since 42 |
| `kelvin` | Temperature unit is Kelvin | Since 42 |
| `fahrenhe` | Temperature unit is Fahrenheit | Since 42 |

### nu — Numbering System

**Source file**: `common/bcp47/number.xml`

The full list contains 100+ numbering systems. Key entries:

| Type | Description | Notes |
|------|-------------|-------|
| `adlm` | Adlam digits | Since 30 |
| `ahom` | Ahom digits | Since 28 |
| `arab` | Arabic-Indic digits | |
| `arabext` | Extended Arabic-Indic digits | |
| `armn` | Armenian upper case numerals (algorithmic) | |
| `armnlow` | Armenian lower case numerals (algorithmic) | |
| `bali` | Balinese digits | Since 21 |
| `beng` | Bengali digits | |
| `bhks` | Bhaiksuki digits | Since 30 |
| `brah` | Brahmi digits | Since 21 |
| `cakm` | Chakma digits | Since 21 |
| `cham` | Cham digits | Since 21 |
| `cyrl` | Cyrillic numerals (algorithmic) | Since 28 |
| `deva` | Devanagari digits | |
| `diak` | Dives Akuru digits | Since 36.1 |
| `ethi` | Ethiopic numerals (algorithmic) | |
| `finance` | Financial numerals (may be algorithmic) | Since 21 |
| `fullwide` | Full width digits | |
| `gara` | Garay digits | Since 46 |
| `geor` | Georgian numerals (algorithmic) | |
| `gong` | Gunjala Gondi digits | Since 33.1 |
| `gonm` | Masaram Gondi digits | Since 32 |
| `grek` | Greek upper case numerals (algorithmic) | |
| `greklow` | Greek lower case numerals (algorithmic) | |
| `gujr` | Gujarati digits | |
| `gukh` | Gurung Khema digits | Since 46 |
| `guru` | Gurmukhi digits | |
| `hanidays` | Han-character day-of-month numbering for lunar/other traditional calendars | Since 25 |
| `hanidec` | Positional decimal system using Chinese number ideographs | Since 1.9 |
| `hans` | Simplified Chinese numerals (algorithmic) | |
| `hansfin` | Simplified Chinese financial numerals (algorithmic) | |
| `hant` | Traditional Chinese numerals (algorithmic) | |
| `hantfin` | Traditional Chinese financial numerals (algorithmic) | |
| `hebr` | Hebrew numerals (algorithmic) | |
| `hmng` | Pahawh Hmong digits | Since 28 |
| `hmnp` | Nyiakeng Puachue Hmong digits | Since 35 |
| `java` | Javanese digits | Since 21 |
| `jpan` | Japanese numerals (algorithmic) | |
| `jpanfin` | Japanese financial numerals (algorithmic) | |
| `jpanyear` | Japanese first-year Gannen numbering | Since 35 |
| `kali` | Kayah Li digits | Since 21 |
| `kawi` | Kawi digits | Since 42 |
| `khmr` | Khmer digits | |
| `knda` | Kannada digits | |
| `krai` | Kirat Rai digits | Since 46 |
| `lana` | Tai Tham Hora (secular) digits | Since 21 |
| `lanatham` | Tai Tham Tham (ecclesiastical) digits | Since 21 |
| `laoo` | Lao digits | |
| `latn` | Latin digits | |
| `lepc` | Lepcha digits | Since 21 |
| `limb` | Limbu digits | Since 21 |
| `mathbold` | Mathematical bold digits | Since 28 |
| `mathdbl` | Mathematical double-struck digits | Since 28 |
| `mathmono` | Mathematical monospace digits | Since 28 |
| `mathsanb` | Mathematical sans-serif bold digits | Since 28 |
| `mathsans` | Mathematical sans-serif digits | Since 28 |
| `mlym` | Malayalam digits | |
| `modi` | Modi digits | Since 28 |
| `mong` | Mongolian digits | |
| `mroo` | Mro digits | Since 28 |
| `mtei` | Meetei Mayek digits | Since 21 |
| `mymr` | Myanmar digits | |
| `mymrepka` | Myanmar Eastern Pwo Karen digits | Since 46 |
| `mymrpao` | Myanmar Pao digits | Since 46 |
| `mymrshan` | Myanmar Shan digits | Since 21 |
| `mymrtlng` | Myanmar Tai Laing digits | Since 28 |
| `nagm` | Nag Mundari digits | Since 42 |
| `native` | Native digits | Since 21 |
| `newa` | Newa digits | Since 30 |
| `nkoo` | N'Ko digits | Since 21 |
| `olck` | Ol Chiki digits | Since 21 |
| `onao` | Ol Onal digits | Since 46 |
| `orya` | Oriya digits | |
| `osma` | Osmanya digits | Since 21 |
| `outlined` | Legacy computing outlined digits | Since 46 |
| `rohg` | Hanifi Rohingya digits | Since 33.1 |
| `roman` | Roman upper case numerals (algorithmic) | |
| `romanlow` | Roman lowercase numerals (algorithmic) | |
| `saur` | Saurashtra digits | Since 21 |
| `segment` | Legacy computing segmented digits | Since 37 |
| `shrd` | Sharada digits | Since 21 |
| `sind` | Khudawadi digits | Since 28 |
| `sinh` | Sinhala Lith digits | Since 28 |
| `sora` | Sora Sompeng digits | Since 21 |
| `sund` | Sundanese digits | Since 21 |
| `sunu` | Sunuwar digits | Since 46 |
| `takr` | Takri digits | Since 21 |
| `talu` | New Tai Lue digits | Since 21 |
| `taml` | Tamil numerals (algorithmic) | |
| `tamldec` | Modern Tamil decimal digits | Since 2.0.1 |
| `tnsa` | Tangsa digits | Since 40 |
| `telu` | Telugu digits | |
| `thai` | Thai digits | |
| `tirh` | Tirhuta digits | Since 28 |
| `tibt` | Tibetan digits | |
| `tols` | Tolong Siki digits | Since 48 |
| `traditio` | Traditional numerals (may be algorithmic) | Alias: `traditional`, since 21 |
| `vaii` | Vai digits | Since 21 |
| `wara` | Warang Citi digits | Since 28 |
| `wcho` | Wancho digits | Since 35 |

### rg — Region Override

**Source file**: `common/bcp47/variant.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `RG_KEY_VALUE` | A region code from idValidity suffixed with `ZZZZ` (e.g., `uszzzz`) | Since 29 |

### sd — Regional Subdivision

**Source file**: `common/bcp47/variant.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `SUBDIVISION_CODE` | Valid unicode_subdivision_subtag prefixed by associated region subtag (e.g., `gbsct`) | Since 28 |

### ss — Sentence Break Suppressions

**Source file**: `common/bcp47/segmentation.xml`

| Type | Description | Notes |
|------|-------------|-------|
| `none` | Do not use segmentation suppressions data | Since 28 |
| `standard` | Use segmentation suppressions data of type standard | Since 28 |

### tz — Time Zone

**Source file**: `common/bcp47/timezone.xml`

Short time zone identifiers (400+ entries). Format is typically a lowercase country code + city code (e.g., `uslax` for America/Los_Angeles, `usnyc` for America/New_York, `gblon` for Europe/London). See `common/bcp47/timezone.xml` for the complete set.

### va — Common Variant Type

**Source file**: `common/bcp47/variant.xml`

| Type | Description |
|------|-------------|
| `posix` | POSIX style locale variant |

### vt — Variable Top (**Deprecated**)

**Source file**: `common/bcp47/collation.xml`, `valueType="multiple"`

| Type | Description |
|------|-------------|
| `CODEPOINTS` | The variable top (one or more Unicode code points: LDML Appendix Q) |

---

## Complete Summary of U Extension Keys

| Key | Description | Source File |
|-----|-------------|-------------|
| `ca` | Calendar algorithm | `calendar.xml` |
| `cf` | Currency format style | `currency.xml` |
| `co` | Collation type | `collation.xml` |
| `cu` | Currency type | `currency.xml` |
| `dx` | Dictionary break script exclusions | `segmentation.xml` |
| `em` | Emoji presentation style | `variant.xml` |
| `fw` | First day of week | UTS #35 supplemental |
| `hc` | Hour cycle | UTS #35 supplemental |
| `ka` | Collation alternate handling | `collation.xml` |
| `kb` | Collation backward second level | `collation.xml` |
| `kc` | Collation case level | `collation.xml` |
| `kf` | Collation case first | `collation.xml` |
| `kh` | Collation Hiragana quaternary (**deprecated**) | `collation.xml` |
| `kk` | Collation normalization | `collation.xml` |
| `kn` | Collation numeric | `collation.xml` |
| `kr` | Collation reorder codes | `collation.xml` |
| `ks` | Collation strength | `collation.xml` |
| `kv` | Collation max variable | `collation.xml` |
| `lb` | Line break style | `segmentation.xml` |
| `lw` | Line break word handling | `segmentation.xml` |
| `ms` | Measurement system | `measure.xml` |
| `mu` | Measurement unit override | `measure.xml` |
| `nu` | Numbering system | `number.xml` |
| `rg` | Region override | `variant.xml` |
| `sd` | Regional subdivision | `variant.xml` |
| `ss` | Sentence break suppressions | `segmentation.xml` |
| `tz` | Time zone | `timezone.xml` |
| `va` | Common variant type | `variant.xml` |
| `vt` | Variable top (**deprecated**) | `collation.xml` |

---

## T Extension Keys — Complete Reference

All T extension keys use the `t` singleton. Keys are defined in CLDR `common/bcp47/transform*.xml` files.

### d0 — Transform Destination

**Source file**: `common/bcp47/transform-destination.xml`

Transform destination for non-languages/scripts.

| Type | Description | Notes |
|------|-------------|-------|
| `ascii` | Map as many characters to the closest ASCII character as possible | Since 29 |
| `accents` | Map base + punctuation, etc to accented characters | Since 29 |
| `publish` | Map to preferred forms for publishing, such as curly quotes, em dash | Alias: `publishing`, since 29 |
| `casefold` | Apply Unicode case folding | Since 29 |
| `lower` | Apply Unicode full lowercase mapping | Since 29 |
| `upper` | Apply Unicode full uppercase mapping | Since 29 |
| `title` | Apply Unicode full titlecase mapping | Since 29 |
| `digit` | Convert to digit form of accent | Since 29 |
| `fwidth` | Map characters to their fullwidth equivalents | Alias: `fullwidth`, since 29 |
| `hwidth` | Map characters to their halfwidth equivalents | Alias: `halfwidth`, since 29 |
| `hex` | Map characters to hex equivalents | Since 29 |
| `nfc` | Map string to the Unicode NFC format | Since 29 |
| `nfd` | Map string to the Unicode NFD format | Since 29 |
| `nfkc` | Map string to the Unicode NFKC format | Since 29 |
| `nfkd` | Map string to the Unicode NFKD format | Since 29 |
| `fcd` | Map string to the FCD format | Since 29 |
| `fcc` | Map string to the FCC format | Since 29 |
| `charname` | Map each character to its Unicode name | Alias: `name`, since 29 |
| `npinyin` | Map pinyin written with tones to the numeric form | Alias: `numericPinyin`, since 29 |
| `null` | Make no change in the string | Since 29 |
| `remove` | Remove every character in the string | Since 29 |
| `zawgyi` | Map Unicode to Zawgyi Myanmar encoding | Since 34 |
| `morse` | Map Unicode to Morse Code encoding | Since 41 |

### h0 — Hybrid Locale

**Source file**: `common/bcp47/transform_hybrid.xml`

Language mixed in to form hybrid language tag. `valueType="single"`.

| Type | Description | Notes |
|------|-------------|-------|
| `hybrid` | Indicates hybrid language | Since 31 |

### i0 — Input Method Engine

**Source file**: `common/bcp47/transform_ime.xml`

Input method transformation (client-side input method).

| Type | Description | Notes |
|------|-------------|-------|
| `handwrit` | Handwriting input | Since 21.0.2 |
| `pinyin` | Pinyin input (for simplified Chinese characters) | Since 21.0.2 |
| `wubi` | Wubi input (for simplified Chinese characters) | Since 21.0.2 |
| `und` | Input method engine not specified | Since 21.0.2 |

### k0 — Keyboard Transform

**Source file**: `common/bcp47/transform_keyboard.xml`

Keyboard transformation (client-side virtual keyboard).

| Type | Description | Notes |
|------|-------------|-------|
| `osx` | Mac OSX keyboard | Since 21.0.2 |
| `windows` | Windows keyboard | Since 21.0.2 |
| `chromeos` | ChromeOS keyboard | Since 21.0.2 |
| `android` | Android keyboard | Since 21.0.2 |
| `googlevk` | Google virtual keyboard | Since 21.0.2 |
| `101key` | 101 key layout | Since 21.0.2 |
| `102key` | 102 key layout | Since 21.0.2 |
| `dvorak` | Dvorak keyboard layout | Since 21.0.2 |
| `dvorakl` | Dvorak left-handed keyboard layout | Since 21.0.2 |
| `dvorakr` | Dvorak right-handed keyboard layout | Since 21.0.2 |
| `el220` | Greek 220 keyboard | Since 21.0.2 |
| `el319` | Greek 319 keyboard | Since 21.0.2 |
| `extended` | A keyboard enhanced with extra characters | Since 21.0.2 |
| `isiri` | Persian ISIRI keyboard | Since 21.0.2 |
| `nutaaq` | Inuktitut Nutaaq keyboard | Since 21.0.2 |
| `legacy` | A keyboard replaced but kept for legacy purposes | Since 21.0.2 |
| `lt1205` | Lithuanian standard keyboard (LST 1205:1992) | Since 21.0.2 |
| `lt1582` | Lithuanian standard keyboard (LST 1582:2000) | Since 21.0.2 |
| `patta` | Thai Pattachote keyboard | Since 21.0.2 |
| `qwerty` | QWERTY-based keyboard or approximation | Since 21.0.2 |
| `qwertz` | QWERTZ-based keyboard or approximation | Since 21.0.2 |
| `var` | A keyboard with small variations from default | Since 21.0.2 |
| `viqr` | Vietnamese VIQR layout | Since 21.0.2 |
| `ta99` | Tamil 99 keyboard | Since 21.0.2 |
| `colemak` | Colemak keyboard layout | Since 21.0.2 |
| `600dpi` | Keyboard for 600 dpi device | Since 21.0.2 |
| `768dpi` | Keyboard for 768 dpi device | Since 21.0.2 |
| `azerty` | AZERTY-based keyboard or approximation | Since 21.0.2 |
| `und` | Vendor not specified | Since 21.0.2 |

### m0 — Transform Mechanism

**Source file**: `common/bcp47/transform.xml`

Transform extension mechanism: to reference an authority or rules for a type of transformation.

| Type | Description | Notes |
|------|-------------|-------|
| `alaloc` | American Library Association-Library of Congress | Since 21 |
| `bgn` | US Board on Geographic Names | Since 21 |
| `buckwalt` | Buckwalter Arabic transliteration system | Since 22.1 |
| `din` | Deutsches Institut fur Normung | Since 21 |
| `gost` | Euro-Asian Council for Standardization, Metrology and Certification | Since 21 |
| `iso` | International Organization for Standardization | Since 21 |
| `mcst` | Korean Ministry of Culture, Sports and Tourism | Since 21 |
| `mns` | Mongolian National Standard | Since 29 |
| `satts` | Standard Arabic Technical Transliteration System (SATTS) | Since 22.1 |
| `ungegn` | United Nations Group of Experts on Geographical Names | Since 21 |
| `c11` | C11 hex syntax: `\u0061\U0001F4D6` | Alias: `c`, since 29 |
| `css` | CSS hex syntax: `\61 \01F4D6` | Since 29 |
| `java` | Java hex syntax: `\u0061\uD83D\uDCD6` | Since 29 |
| `percent` | Percent hex syntax: `%61%F0%9F%93%96` | Since 29 |
| `perl` | Perl hex syntax: `\x{61}\x{1F4D6}` | Since 29 |
| `plain` | Plain hex (no syntax): `0061 1F4D6` | Since 29 |
| `unicode` | Unicode hex syntax: `U+0061 U+1F4D6` | Since 29 |
| `xml` | XML hex syntax: `&#x61;&#x1F4D6;` | Since 29 |
| `xml10` | XML decimal syntax: `&#97;&#128214;` | Since 29 |
| `prprname` | Transform variant for proper names | Alias: `names`, since 29 |
| `iast` | International Alphabet of Sanskrit Transliteration | Since 35 |
| `ewts` | Extended Wylie Transliteration Scheme | Since 35 |
| `aethiopi` | Encylopedia Aethiopica Transliteration | Since 41 |
| `betamets` | Beta Masaheft Transliteration | Alias: `beta-metsehaf`, since 41 |
| `iesjes` | IES/JES Amharic Transliteration | Alias: `ies-jes`, since 41 |
| `es3842` | Ethiopian Standards Agency ES 3842:2014 | Since 41 |
| `lambdin` | Thomas Oden Lambdin Ethiopic-Latin Transliteration | Since 41 |
| `gurage` | Gurage Legacy to Modern Transliteration | Since 41 |
| `gutgarts` | Yaros Gutgarts Ethiopic-Cyrillic Transliteration | Since 41 |
| `sera` | System for Ethiopic Representation in ASCII | Since 41 |
| `tekieali` | Tekie Alibekit Blin-Latin Transliteration | Alias: `tekie-alibekit`, since 41 |
| `xaleget` | Eritrean Ministry of Education Blin-Latin Transliteration | Since 41 |

### s0 — Transform Source

**Source file**: `common/bcp47/transform-destination.xml`

Transform source for non-languages/scripts.

| Type | Description | Notes |
|------|-------------|-------|
| `accents` | Accented characters to map base + punctuation, etc | Since 29 |
| `ascii` | Map from ASCII to the target | Since 29 |
| `publish` | Map publishing characters to vanilla characters | Alias: `publishing`, since 29 |
| `hex` | Map characters from hex equivalents, trying all variants | Since 29 |
| `npinyin` | Map the numeric form of pinyin to the tone format | Alias: `numericPinyin`, since 29 |
| `zawgyi` | Map Zawgyi Myanmar encoding to Unicode | Since 30 |
| `morse` | Map Morse Code to Unicode encoding | Since 41 |

### t0 — Machine Translation

**Source file**: `common/bcp47/transform_mt.xml`

Machine translation content indication or request.

| Type | Description | Notes |
|------|-------------|-------|
| `und` | Machine translation not specified | Since 21.0.2 |

### x0 — Private Use Transform

**Source file**: `common/bcp47/transform_private_use.xml`

Private use transform type key. `valueType="any"`.

| Type | Description | Notes |
|------|-------------|-------|
| `PRIVATE_USE` | All subtags consistent with RFC 6497 (3-8 alphanum) are valid without registration | Since 21.0.2 |

---

## Complete Summary of T Extension Keys

| Key | Description | Source File |
|-----|-------------|-------------|
| `d0` | Transform destination | `transform-destination.xml` |
| `h0` | Hybrid locale | `transform_hybrid.xml` |
| `i0` | Input method engine | `transform_ime.xml` |
| `k0` | Keyboard transform | `transform_keyboard.xml` |
| `m0` | Transform mechanism | `transform.xml` |
| `s0` | Transform source | `transform-destination.xml` |
| `t0` | Machine translation | `transform_mt.xml` |
| `x0` | Private use transform | `transform_private_use.xml` |

---

## Duplicate Handling Rules

### In unicode_language_id variants
The sequence of variant subtags MUST NOT have duplicates. `de-1996-fonipa-1996` is not syntactically well-formed.

### In tlang variants
The sequence of variant subtags in a tlang MUST NOT have duplicates.

### In extensions
There MUST NOT be more than one extension with the same singleton. `en-u-ca-buddhist-u-cf-standard` is ill-formed.

### In ukey / tkey
There MUST NOT be more than one identical ukey. `en-u-ca-buddhist-ca-islamic` is ill-formed.
There MUST NOT be more than one identical tkey. Two identical field separators MUST NOT be present.

### First occurrence wins (RFC 6067)
Only the first occurrence of a duplicate key conveys meaning (per RFC 6067). However, tags with duplicate keys are still considered ill-formed.

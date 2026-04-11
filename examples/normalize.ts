import { canonicalize } from 'rfc-bcp47';

/*
 * canonicalize() normalizes casing, sorts extensions,
 * and applies IANA registry mappings — all in one step.
 */

// Case normalization per RFC 5646 §2.1.1
console.log(canonicalize('EN-LATN-US'));    // 'en-Latn-US'
console.log(canonicalize('ZH-HANT-tw'));    // 'zh-Hant-TW'
console.log(canonicalize('sr-cyrl-ba'));    // 'sr-Cyrl-BA'

// Extension singleton sorting
console.log(canonicalize('en-u-ca-buddhist-a-foo')); // 'en-a-foo-u-ca-buddhist'

// IANA registry transformations
console.log(canonicalize('iw'));         // 'he'       (deprecated language)
console.log(canonicalize('zh-cmn'));     // 'cmn'      (extlang → preferred)
console.log(canonicalize('en-Latn'));    // 'en'       (suppress-script)
console.log(canonicalize('de-DD'));      // 'de-DE'    (deprecated region)
console.log(canonicalize('i-klingon'));  // 'tlh'      (grandfathered → preferred)

// Invalid input returns null
console.log(canonicalize('!!!'));        // null

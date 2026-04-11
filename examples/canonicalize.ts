import { canonicalize } from 'rfc-bcp47';

/*
 * Canonicalize BCP 47 tags using IANA registry data.
 * Applies all transformations from RFC 5646 §4.5.
 */

// Deprecated language replacement
console.log(canonicalize('iw'));           // 'he'
console.log(canonicalize('in'));           // 'id'
console.log(canonicalize('iw-IL'));        // 'he-IL'

// Extlang canonicalization — use preferred subtag directly
console.log(canonicalize('zh-cmn'));       // 'cmn'
console.log(canonicalize('zh-yue'));       // 'yue'
console.log(canonicalize('zh-cmn-Hant-TW')); // 'cmn-Hant-TW'

// Suppress-script removal — remove redundant script subtags
console.log(canonicalize('en-Latn'));      // 'en'
console.log(canonicalize('ru-Cyrl'));      // 'ru'
console.log(canonicalize('zh-Hans'));      // 'zh'

// Deprecated region replacement
console.log(canonicalize('de-DD'));        // 'de-DE'
console.log(canonicalize('my-BU'));        // 'my-MM'

// Grandfathered tags with preferred values
console.log(canonicalize('i-klingon'));    // 'tlh'
console.log(canonicalize('art-lojban'));   // 'jbo'
console.log(canonicalize('zh-guoyu'));     // 'cmn'

// Deprecated variant replacement
console.log(canonicalize('ja-Latn-heploc')); // 'ja-Latn-alalc97'

// Combined: deprecated language + suppress-script + uppercase normalization
console.log(canonicalize('IW-HEBR-IL'));   // 'he-IL'

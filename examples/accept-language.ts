import { acceptLanguage } from 'rfc-bcp47';

/*
 * Parse HTTP Accept-Language headers per RFC 9110 §12.5.4.
 */

const entries = acceptLanguage('fr-CA, en-US;q=0.8, en;q=0.5, *;q=0.1');
console.log(entries);
// [
//   { tag: 'fr-CA', quality: 1.0 },
//   { tag: 'en-US', quality: 0.8 },
//   { tag: 'en',    quality: 0.5 },
//   { tag: '*',     quality: 0.1 }
// ]

// Quality defaults to 1.0 when omitted
console.log(acceptLanguage('en, fr'));
// [
//   { tag: 'en', quality: 1.0 },
//   { tag: 'fr', quality: 1.0 }
// ]

// Sorted by quality descending
console.log(acceptLanguage('en;q=0.5, fr;q=0.9'));
// [
//   { tag: 'fr', quality: 0.9 },
//   { tag: 'en', quality: 0.5 }
// ]

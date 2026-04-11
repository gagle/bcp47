import { filter, lookup } from 'rfc-bcp47';

/*
 * Language tag matching per RFC 4647.
 */

const tags = ['de-DE', 'de-DE-1996', 'de-Latn-DE', 'de-Deva', 'en-US', 'en-GB', 'fr-FR'];

// filter — subtag-aware matching (RFC 4647 §3.3.2)
// Skips non-matching subtags (like script) to find deeper matches
console.log(filter(tags, 'de-DE'));
// ['de-DE', 'de-DE-1996', 'de-Latn-DE']
// Note: de-Latn-DE matches because Latn is skipped to find DE

// Language-only pattern matches all tags with that language
console.log(filter(tags, 'de'));
// ['de-DE', 'de-DE-1996', 'de-Latn-DE', 'de-Deva']

// Wildcards: any language for a specific region
console.log(filter(tags, '*-DE'));
// ['de-DE', 'de-DE-1996', 'de-Latn-DE']

// Multiple patterns — results in pattern priority order, deduplicated
console.log(filter(tags, ['fr', 'de-DE']));
// ['fr-FR', 'de-DE', 'de-DE-1996', 'de-Latn-DE']

// lookup — single best match with progressive fallback (RFC 4647 §3.4)
console.log(lookup(tags, 'en-US-x-custom'));  // 'en-US'  (truncates to en-US)
console.log(lookup(tags, 'en-AU'));           // null     (no en or en-AU)
console.log(lookup(tags, 'ja', 'en-US'));     // 'en-US'  (default value)

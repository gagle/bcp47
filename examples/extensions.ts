import { parse, extensionU, extensionT } from 'rfc-bcp47';

/*
 * Extract structured data from Unicode locale (U) and
 * transformed content (T) extensions.
 */

// Unicode locale extension — RFC 6067
const deTag = parse('de-DE-u-co-phonebk-ca-buddhist')!;
console.log(extensionU(deTag));
// { attributes: [], keywords: { co: 'phonebk', ca: 'buddhist' } }

// Transformed content extension — RFC 6497
const transTag = parse('und-t-it-m0-ungegn')!;
console.log(extensionT(transTag));
// { source: 'it', fields: { m0: 'ungegn' } }

// Returns null when extension is absent
const enTag = parse('en-US')!;
console.log(extensionU(enTag)); // null
console.log(extensionT(enTag)); // null

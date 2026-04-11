import { acceptLanguage, lookup, filter } from 'rfc-bcp47';

/*
 * Full content negotiation workflow:
 * Parse Accept-Language header → match against available locales.
 */

const header = 'fr-CA, en-US;q=0.8, en;q=0.5, *;q=0.1';
const available = ['en', 'en-US', 'fr', 'fr-CA', 'de'];

// Step 1: Parse the header into ranked preferences
const preferences = acceptLanguage(header);
const userPreferences = preferences.map((entry) => entry.tag);
// ['fr-CA', 'en-US', 'en', '*']

// Step 2a: Lookup — find the single best match
const best = lookup(available, userPreferences);
console.log(best); // 'fr-CA'

// Step 2b: Filter — find all matching locales
const matches = filter(available, userPreferences);
console.log(matches); // ['fr-CA', 'en-US', 'en', 'fr', 'de']

// Fallback when preferred locale is unavailable
const limited = ['en', 'de'];
const fallback = lookup(limited, userPreferences, 'en');
console.log(fallback); // 'en'

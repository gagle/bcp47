import { parse } from 'rfc-bcp47';

/*
 * Validate whether a string is a well-formed BCP 47 tag.
 */

function isValidLanguageTag(input: string): boolean {
  return parse(input) !== null;
}

console.log(isValidLanguageTag('en-US'));      // true
console.log(isValidLanguageTag('zh-Hant-TW')); // true
console.log(isValidLanguageTag('not valid'));   // false
console.log(isValidLanguageTag(''));            // false

import { parse } from 'rfc-bcp47';

/*
 * Handle all three tag types with exhaustive pattern matching.
 * TypeScript narrows the type in each case branch.
 */

function describe(input: string): string {
  const tag = parse(input);
  if (!tag) {
    return `"${input}" is not a valid BCP 47 tag`;
  }

  switch (tag.type) {
    case 'langtag':
      return `Language: ${tag.langtag.language}, Region: ${tag.langtag.region ?? 'none'}`;
    case 'privateuse':
      return `Private use: ${tag.privateuse.join(', ')}`;
    case 'grandfathered':
      return `Grandfathered (${tag.grandfathered.type}): ${tag.grandfathered.tag}`;
  }
}

console.log(describe('en-US'));       // 'Language: en, Region: US'
console.log(describe('x-app-v2'));    // 'Private use: app, v2'
console.log(describe('i-klingon'));   // 'Grandfathered (irregular): i-klingon'
console.log(describe('???'));         // '"???" is not a valid BCP 47 tag'

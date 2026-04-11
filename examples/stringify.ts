import { stringify } from 'rfc-bcp47';

/*
 * Build a language tag string from its components.
 */

const languageTag = stringify({
  type: 'langtag',
  langtag: {
    language: 'zh',
    extlang: [],
    script: 'Hant',
    region: 'TW',
    variant: [],
    extension: [],
    privateuse: []
  }
});

console.log(languageTag); // 'zh-Hant-TW'

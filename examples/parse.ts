import { parse } from 'rfc-bcp47';

/*
 * Parse a BCP 47 language tag and access its components.
 */

const tag = parse('zh-Hant-TW');

if (tag?.type === 'langtag') {
  console.log(tag.langtag.language); // 'zh'   (Chinese)
  console.log(tag.langtag.script);   // 'Hant' (Traditional)
  console.log(tag.langtag.region);   // 'TW'   (Taiwan)
  console.log(tag.langtag.extlang);  // []
  console.log(tag.langtag.variant);  // []
}

// Full output:
// {
//   type: 'langtag',
//   langtag: {
//     language: 'zh',
//     extlang: [],
//     script: 'Hant',
//     region: 'TW',
//     variant: [],
//     extension: [],
//     privateuse: []
//   }
// }

import { describe, it, expect } from 'vitest';
import { canonicalize } from './canonicalize';

describe('canonicalize', () => {
  // RFC 5646 §2.1: invalid tags per the ABNF grammar
  describe('when the tag is invalid', () => {
    it('should return null', () => {
      expect(canonicalize('.')).toBeNull();
    });
  });

  // RFC 5646 §4.5: "Use the 'Preferred-Value' of the IANA registry entry"
  describe('when replacing deprecated languages', () => {
    it('should replace iw with he', () => {
      expect(canonicalize('iw')).toBe('he');
    });

    it('should replace in with id', () => {
      expect(canonicalize('in')).toBe('id');
    });

    it('should replace ji with yi', () => {
      expect(canonicalize('ji')).toBe('yi');
    });

    it('should replace jw with jv', () => {
      expect(canonicalize('jw')).toBe('jv');
    });

    it('should replace mo with ro', () => {
      expect(canonicalize('mo')).toBe('ro');
    });

    it('should replace aam with aas', () => {
      expect(canonicalize('aam')).toBe('aas');
    });

    it('should replace drh with khk', () => {
      expect(canonicalize('drh')).toBe('khk');
    });

    it('should replace prp with gu', () => {
      expect(canonicalize('prp')).toBe('gu');
    });

    it('should preserve other subtags when replacing language', () => {
      expect(canonicalize('iw-IL')).toBe('he-IL');
    });

    // RFC 5646 §4.5: deprecated extlangs handled via deprecated language replacement
    it('should replace deprecated extlang ajp with apc', () => {
      expect(canonicalize('ajp')).toBe('apc');
    });
  });

  // RFC 5646 §4.5 step 2: "If the tag contains an extlang subtag, replace
  // language-extlang with the extlang's Preferred-Value"
  describe('when canonicalizing extlang', () => {
    it('should replace zh-cmn with cmn', () => {
      expect(canonicalize('zh-cmn')).toBe('cmn');
    });

    it('should replace zh-yue with yue', () => {
      expect(canonicalize('zh-yue')).toBe('yue');
    });

    it('should preserve other subtags when replacing extlang', () => {
      expect(canonicalize('zh-cmn-Hant-TW')).toBe('cmn-Hant-TW');
    });

    it('should not replace extlang when prefix does not match', () => {
      expect(canonicalize('en-cmn')).toBe('en-cmn');
    });

    it('should promote first extlang and preserve remaining extlangs', () => {
      expect(canonicalize('zh-cmn-yue')).toBe('cmn-yue');
    });
  });

  // RFC 5646 §4.5: "Remove the script subtag if it matches the
  // Suppress-Script field in the IANA registry for that language"
  describe('when removing suppressed scripts', () => {
    it('should remove Latn from en', () => {
      expect(canonicalize('en-Latn')).toBe('en');
    });

    it('should remove Cyrl from ru', () => {
      expect(canonicalize('ru-Cyrl')).toBe('ru');
    });

    // zh has no Suppress-Script in IANA (uses both Hans and Hant)
    it('should preserve Hans on zh (no suppress-script for zh)', () => {
      expect(canonicalize('zh-Hans')).toBe('zh-Hans');
    });

    it('should preserve non-suppressed scripts', () => {
      expect(canonicalize('en-Cyrl')).toBe('en-Cyrl');
    });

    // RFC 5646 §4.1 + §2.1.1: case normalization before suppress-script check
    it('should remove suppress-script after case normalization', () => {
      expect(canonicalize('en-latn')).toBe('en');
    });

    it('should preserve other subtags when removing script', () => {
      expect(canonicalize('en-Latn-US')).toBe('en-US');
    });
  });

  // RFC 5646 §4.5: "Use the 'Preferred-Value' for deprecated region subtags"
  describe('when replacing deprecated regions', () => {
    it('should replace BU with MM', () => {
      expect(canonicalize('my-BU')).toBe('my-MM');
    });

    it('should replace DD with DE', () => {
      expect(canonicalize('de-DD')).toBe('de-DE');
    });

    it('should replace ZR with CD', () => {
      expect(canonicalize('fr-ZR')).toBe('fr-CD');
    });

    it('should replace FX with FR', () => {
      expect(canonicalize('fr-FX')).toBe('fr-FR');
    });

    it('should replace TP with TL', () => {
      expect(canonicalize('pt-TP')).toBe('pt-TL');
    });

    it('should replace YD with YE', () => {
      expect(canonicalize('ar-YD')).toBe('ar-YE');
    });
  });

  // RFC 5646 §4.5: multiple canonicalization steps applied together
  describe('when applying combined transformations', () => {
    it('should replace deprecated language and removes suppressed script', () => {
      expect(canonicalize('iw-Hebr')).toBe('he');
    });

    it('should normalize case while canonicalizing', () => {
      expect(canonicalize('IW-HEBR-IL')).toBe('he-IL');
    });

    it('should apply extlang canonicalization and preserves non-suppressed script', () => {
      expect(canonicalize('zh-cmn-Hans')).toBe('cmn-Hans');
    });

    it('should sort extensions by singleton during canonicalization', () => {
      expect(canonicalize('en-US-u-ca-buddhist-a-foo')).toBe('en-US-a-foo-u-ca-buddhist');
    });
  });

  // RFC 5646 §4.5: tags already in canonical form pass through unchanged
  describe('when the tag needs no canonicalization', () => {
    it('should return the normalized form unchanged', () => {
      expect(canonicalize('en-US')).toBe('en-US');
    });
  });

  // RFC 5646 §4.5: "Use the 'Preferred-Value' for deprecated variant subtags"
  describe('when replacing deprecated variants', () => {
    it('should replace heploc with alalc97', () => {
      expect(canonicalize('ja-Latn-heploc')).toBe('ja-Latn-alalc97');
    });

    it('should preserve non-deprecated variants', () => {
      expect(canonicalize('de-DE-1996')).toBe('de-DE-1996');
    });
  });

  // RFC 5646 §2.2.8: "grandfathered tags … are considered 'deprecated'
  // when they have a Preferred-Value"
  describe('when the tag is grandfathered with preferred value', () => {
    it('should replace i-klingon with tlh', () => {
      expect(canonicalize('i-klingon')).toBe('tlh');
    });

    it('should replace art-lojban with jbo', () => {
      expect(canonicalize('art-lojban')).toBe('jbo');
    });

    it('should replace zh-guoyu with cmn', () => {
      expect(canonicalize('zh-guoyu')).toBe('cmn');
    });

    it('should replace zh-hakka with hak', () => {
      expect(canonicalize('zh-hakka')).toBe('hak');
    });

    it('should replace zh-xiang with hsn', () => {
      expect(canonicalize('zh-xiang')).toBe('hsn');
    });

    it('should replace no-bok with nb', () => {
      expect(canonicalize('no-bok')).toBe('nb');
    });

    it('should replace no-nyn with nn', () => {
      expect(canonicalize('no-nyn')).toBe('nn');
    });

    it('should replace sgn-BE-FR with sfb', () => {
      expect(canonicalize('sgn-BE-FR')).toBe('sfb');
    });

    it('should replace sgn-BE-NL with vgt', () => {
      expect(canonicalize('sgn-BE-NL')).toBe('vgt');
    });

    it('should replace sgn-CH-DE with sgg', () => {
      expect(canonicalize('sgn-CH-DE')).toBe('sgg');
    });

    it('should replace en-GB-oed with en-GB-oxendict', () => {
      expect(canonicalize('en-GB-oed')).toBe('en-GB-oxendict');
    });

    it('should replace i-ami with ami', () => {
      expect(canonicalize('i-ami')).toBe('ami');
    });

    it('should replace i-lux with lb', () => {
      expect(canonicalize('i-lux')).toBe('lb');
    });

    it('should replace i-navajo with nv', () => {
      expect(canonicalize('i-navajo')).toBe('nv');
    });

    it('should handle case-insensitive grandfathered lookup', () => {
      expect(canonicalize('I-KLINGON')).toBe('tlh');
    });

    it('should replace zh-min-nan with nan', () => {
      expect(canonicalize('zh-min-nan')).toBe('nan');
    });
  });

  // RFC 5646 §2.2.8: grandfathered tags without Preferred-Value are
  // preserved as-is (no canonical replacement exists)
  describe('when the tag is grandfathered without preferred value', () => {
    it('should pass through i-default', () => {
      expect(canonicalize('i-default')).toBe('i-default');
    });

    it('should pass through cel-gaulish', () => {
      expect(canonicalize('cel-gaulish')).toBe('cel-gaulish');
    });

    it('should pass through zh-min', () => {
      expect(canonicalize('zh-min')).toBe('zh-min');
    });

    it('should pass through i-enochian', () => {
      expect(canonicalize('i-enochian')).toBe('i-enochian');
    });

    it('should pass through i-mingo', () => {
      expect(canonicalize('i-mingo')).toBe('i-mingo');
    });
  });

  // RFC 5646 §2.2.7: standalone privateuse tags are not canonicalized
  describe('when the tag is standalone privateuse', () => {
    it('should pass through privateuse tags', () => {
      expect(canonicalize('x-custom')).toBe('x-custom');
    });
  });

  // RFC 5646 §4.5: redundant tags with Preferred-Value are replaced
  // by their preferred form (IANA registry Type: redundant + Preferred-Value)
  describe('when canonicalizing redundant tags', () => {
    it('should replace sgn-BR with bzs', () => {
      expect(canonicalize('sgn-BR')).toBe('bzs');
    });

    it('should replace sgn-US with ase', () => {
      expect(canonicalize('sgn-US')).toBe('ase');
    });

    it('should replace sgn-FR with fsl', () => {
      expect(canonicalize('sgn-FR')).toBe('fsl');
    });

    it('should replace sgn-JP with jsl', () => {
      expect(canonicalize('sgn-JP')).toBe('jsl');
    });

    it('should replace sgn-DE with gsg', () => {
      expect(canonicalize('sgn-DE')).toBe('gsg');
    });

    // RFC 5646 §4.5: all 19 redundant sgn-* mappings
    it.each([
      ['sgn-CO', 'csn'],
      ['sgn-DK', 'dsl'],
      ['sgn-ES', 'ssp'],
      ['sgn-GB', 'bfi'],
      ['sgn-GR', 'gss'],
      ['sgn-IE', 'isg'],
      ['sgn-IT', 'ise'],
      ['sgn-MX', 'mfs'],
      ['sgn-NI', 'ncs'],
      ['sgn-NL', 'dse'],
      ['sgn-NO', 'nsl'],
      ['sgn-PT', 'psr'],
      ['sgn-SE', 'swl'],
      ['sgn-ZA', 'sfs'],
    ])('should replace %s with %s', (input, expected) => {
      expect(canonicalize(input)).toBe(expected);
    });

    it('should handle case-insensitive redundant tag lookup', () => {
      expect(canonicalize('SGN-br')).toBe('bzs');
    });

    it('should preserve extensions when replacing redundant tags', () => {
      expect(canonicalize('sgn-BR-u-ca-buddhist')).toBe('bzs-u-ca-buddhist');
    });

    it('should preserve privateuse when replacing redundant tags', () => {
      expect(canonicalize('sgn-US-x-custom')).toBe('ase-x-custom');
    });

    // RFC 5646 §4.5: canonicalization is idempotent
    it('should be idempotent for redundant tags', () => {
      const once = canonicalize('sgn-BR');
      const twice = canonicalize(once!);
      expect(twice).toBe(once);
    });
  });

  // RFC 5646 §4.5: extlang promotion for sign languages
  describe('when canonicalizing sign language extlang', () => {
    it('should promote sgn-jsl to jsl', () => {
      expect(canonicalize('sgn-jsl')).toBe('jsl');
    });
  });

  // RFC 5646 §4.5: suppress-script edge cases
  describe('when removing additional suppressed scripts', () => {
    it('should remove Jpan from ja', () => {
      expect(canonicalize('ja-Jpan')).toBe('ja');
    });

    it('should remove suppress-script after extlang promotion', () => {
      expect(canonicalize('ms-zsm')).toBe('zsm');
    });
  });

  // RFC 5646 §4.5: extension singleton ordering with numeric singletons
  describe('when sorting extensions by singleton', () => {
    it('should sort numeric singletons before letter singletons', () => {
      expect(canonicalize('en-b-bar-0-foo')).toBe('en-0-foo-b-bar');
    });

    it('should leave already-sorted extensions unchanged', () => {
      expect(canonicalize('en-a-foo-b-bar')).toBe('en-a-foo-b-bar');
    });
  });

  // RFC 6067: Unicode BCP 47 Extension U — keywords sorted by key
  // in US-ASCII order during canonicalization
  describe('when canonicalizing U extension keywords', () => {
    it('should sort keywords by key', () => {
      expect(canonicalize('en-u-co-phonebk-ca-buddhist')).toBe('en-u-ca-buddhist-co-phonebk');
    });

    it('should preserve attributes before keywords', () => {
      expect(canonicalize('en-u-attr-co-phonebk-ca-buddhist')).toBe('en-u-attr-ca-buddhist-co-phonebk');
    });

    // RFC 6067 §3: attributes ordered in US-ASCII order
    it('should sort multiple attributes in US-ASCII order', () => {
      expect(canonicalize('en-u-zebra-apple-ca-buddhist')).toBe('en-u-apple-zebra-ca-buddhist');
    });

    it('should leave already-sorted keywords unchanged', () => {
      expect(canonicalize('en-u-ca-buddhist-co-phonebk')).toBe('en-u-ca-buddhist-co-phonebk');
    });

    it('should sort keywords with multiple values', () => {
      expect(canonicalize('en-u-nu-latn-ca-buddhist')).toBe('en-u-ca-buddhist-nu-latn');
    });

    it('should handle a single keyword without reordering', () => {
      expect(canonicalize('en-u-ca-buddhist')).toBe('en-u-ca-buddhist');
    });

    it('should sort both attributes and keywords together', () => {
      expect(canonicalize('en-u-zebra-apple-co-phonebk-ca-buddhist')).toBe('en-u-apple-zebra-ca-buddhist-co-phonebk');
    });

    it('should preserve type subtag order within a keyword', () => {
      expect(canonicalize('en-u-ca-islamic-civil')).toBe('en-u-ca-islamic-civil');
    });

    it('should lowercase uppercase U extension', () => {
      expect(canonicalize('en-U-CA-BUDDHIST')).toBe('en-u-ca-buddhist');
    });
  });

  // RFC 6497 §2.3: BCP 47 Extension T — fields sorted by tkey
  // alphabetically during canonicalization
  describe('when canonicalizing T extension fields', () => {
    it('should sort fields by tkey', () => {
      expect(canonicalize('en-t-m0-true-d0-fwidth')).toBe('en-t-d0-fwidth-m0-true');
    });

    it('should preserve source language before fields', () => {
      expect(canonicalize('en-t-ja-m0-true-d0-fwidth')).toBe('en-t-ja-d0-fwidth-m0-true');
    });

    it('should leave already-sorted fields unchanged', () => {
      expect(canonicalize('en-t-d0-fwidth-m0-true')).toBe('en-t-d0-fwidth-m0-true');
    });

    it('should handle a single field without reordering', () => {
      expect(canonicalize('en-t-m0-true')).toBe('en-t-m0-true');
    });

    it('should preserve subtag order within a field', () => {
      expect(canonicalize('en-t-m0-ungegn-2007')).toBe('en-t-m0-ungegn-2007');
    });

    it('should lowercase uppercase T extension', () => {
      expect(canonicalize('en-T-JA-M0-TRUE')).toBe('en-t-ja-m0-true');
    });

    it('should sort fields with multiple values', () => {
      expect(canonicalize('en-t-s0-ascii-m0-true-d0-fwidth')).toBe('en-t-d0-fwidth-m0-true-s0-ascii');
    });
  });
});

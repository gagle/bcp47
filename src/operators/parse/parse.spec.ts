import { describe, it, expect, assert } from 'vitest';
import { parse } from './parse';

describe('parse', () => {
  function parseLangtag(input: string) {
    const tag = parse(input);
    assert(tag?.type === 'langtag');
    return tag.langtag;
  }

  // RFC 5646 §2.1: tags that violate the ABNF grammar are invalid
  describe('when the tag is invalid', () => {
    it('should return null for special characters', () => {
      expect(parse('.')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parse('')).toBeNull();
    });

    it('should return null for whitespace', () => {
      expect(parse(' ')).toBeNull();
    });

    it('should return null for underscores', () => {
      expect(parse('en_US')).toBeNull();
    });

    it('should return null for leading hyphen', () => {
      expect(parse('-en')).toBeNull();
    });

    it('should return null for trailing hyphen', () => {
      expect(parse('en-')).toBeNull();
    });

    it('should return null for double hyphen', () => {
      expect(parse('en--US')).toBeNull();
    });

    it('should return null for single character', () => {
      expect(parse('a')).toBeNull();
    });

    it('should return null for tag exceeding max subtag length', () => {
      expect(parse('aaaaaaaaa')).toBeNull();
    });

    // RFC 5646 §2.1: language subtag must be purely alphabetic (ALPHA only)
    it('should return null for language subtag with digits', () => {
      expect(parse('e1')).toBeNull();
    });

    // RFC 5646 §2.1: extlang must be 3 ALPHA (no digits)
    it('should return null for extlang subtag with digits', () => {
      expect(parse('zh-cm1')).toBeNull();
    });

    // RFC 5646 §2.2.3: script must be exactly 4 ALPHA
    it('should return null for script-like subtag with digits', () => {
      expect(parse('en-Lat1')).toBeNull();
    });

    // RFC 5646 §2.2.3: at most one script subtag per tag
    it('should return null for two consecutive script subtags', () => {
      expect(parse('en-Latn-Cyrl')).toBeNull();
    });

    // RFC 5646 §2.2.4: at most one region subtag per tag
    it('should return null for two consecutive region subtags', () => {
      expect(parse('en-US-GB')).toBeNull();
    });

    // RFC 5646 §2.1: 3-char subtag after region is not a valid variant
    it('should return null for 3-char subtag after region', () => {
      expect(parse('en-US-abc')).toBeNull();
    });

    // RFC 5646 §2.2.6: extension requires at least one 2-8 char subtag after singleton
    it('should return null for extension singleton without subtags', () => {
      expect(parse('en-a')).toBeNull();
    });

    // RFC 5646 §2.1: extension subtags must be 2-8 chars (1 char too short)
    it('should return null for 1-char extension subtag', () => {
      expect(parse('en-a-f')).toBeNull();
    });

    // RFC 5646 §2.1: extension subtags must be 2-8 chars (9 chars too long)
    it('should return null for 9-char extension subtag', () => {
      expect(parse('en-a-abcdefghi')).toBeNull();
    });

    // RFC 5646 §2.1: privateuse subtags must be 1-8 chars (9 chars too long)
    it('should return null for 9-char privateuse subtag', () => {
      expect(parse('x-abcdefghi')).toBeNull();
    });

    // RFC 5646 §2.1: standalone x requires at least one subtag
    it('should return null for bare x without subtags', () => {
      expect(parse('x')).toBeNull();
    });

    // RFC 5646 §2.2.5: "Each variant subtag can only appear once in a given tag."
    it('should return null for duplicate variant subtags', () => {
      expect(parse('en-fonipa-fonipa')).toBeNull();
    });

    // RFC 5646 §2.2.5: variant comparison is case-insensitive
    it('should return null for duplicate variant subtags (case-insensitive)', () => {
      expect(parse('ca-valencia-VALENCIA')).toBeNull();
    });

    // RFC 5646 §2.2.6: "Each singleton MUST appear at most once"
    it('should return null for duplicate extension singletons', () => {
      expect(parse('en-a-foo-a-bar')).toBeNull();
    });

    // RFC 5646 §2.2.6: singleton comparison is case-insensitive
    it('should return null for duplicate extension singletons (case-insensitive)', () => {
      expect(parse('en-A-foo-a-bar')).toBeNull();
    });
  });

  // RFC 5646 §2.2.7: private use subtags (qaa–qtz, Qaaa–Qabx, QM–QZ)
  describe('when the input uses private use ranges', () => {
    it('should parse private use language subtag qaa', () => {
      const langtag = parseLangtag('qaa');
      expect(langtag.language).toBe('qaa');
    });

    it('should parse private use script subtag Qaaa', () => {
      const langtag = parseLangtag('en-Qaaa');
      expect(langtag.script).toBe('Qaaa');
    });

    it('should parse private use region subtag QM', () => {
      const langtag = parseLangtag('en-QM');
      expect(langtag.region).toBe('QM');
    });

    it('should parse all private use ranges combined', () => {
      const langtag = parseLangtag('qaa-Qaaa-QM');
      expect(langtag.language).toBe('qaa');
      expect(langtag.script).toBe('Qaaa');
      expect(langtag.region).toBe('QM');
    });

    // RFC 5646 §2.2.7: private use regions AA, XA-XZ, ZZ
    it('should parse private use region AA', () => {
      const langtag = parseLangtag('en-AA');
      expect(langtag.region).toBe('AA');
    });

    it('should parse private use region XA', () => {
      const langtag = parseLangtag('en-XA');
      expect(langtag.region).toBe('XA');
    });

    it('should parse private use region ZZ', () => {
      const langtag = parseLangtag('en-ZZ');
      expect(langtag.region).toBe('ZZ');
    });
  });

  // RFC 5646 §2.2.8 + §2.1.1: grandfathered tags with case normalization
  describe('when grandfathered tags have non-canonical casing', () => {
    it('should parse irregular tag with uppercase', () => {
      const tag = parse('I-KLINGON');
      assert(tag?.type === 'grandfathered');
      expect(tag.grandfathered.type).toBe('irregular');
      expect(tag.grandfathered.tag).toBe('i-klingon');
    });

    it('should parse regular tag with uppercase', () => {
      const tag = parse('ART-LOJBAN');
      assert(tag?.type === 'grandfathered');
      expect(tag.grandfathered.type).toBe('regular');
      expect(tag.grandfathered.tag).toBe('art-lojban');
    });
  });

  // RFC 5646 §2.1: langtag production in the ABNF grammar
  describe('when parsing langtag components', () => {
    // RFC 5646 §2.2.1: primary language subtag (2*3ALPHA / 4ALPHA / 5*8ALPHA)
    describe('when parsing language subtags', () => {
      it('should parse 2-character language', () => {
        const langtag = parseLangtag('aa');
        expect(langtag.language).toBe('aa');
        expect(langtag.extlang).toEqual([]);
      });

      it('should parse 3-character language', () => {
        const langtag = parseLangtag('aaa');
        expect(langtag.language).toBe('aaa');
        expect(langtag.extlang).toEqual([]);
      });

      it('should parse 4-character language', () => {
        const langtag = parseLangtag('aaaa');
        expect(langtag.language).toBe('aaaa');
        expect(langtag.extlang).toEqual([]);
      });

      it('should parse 5-character language', () => {
        const langtag = parseLangtag('aaaaa');
        expect(langtag.language).toBe('aaaaa');
        expect(langtag.extlang).toEqual([]);
      });

      it('should parse 6-character language', () => {
        const langtag = parseLangtag('aaaaaa');
        expect(langtag.language).toBe('aaaaaa');
        expect(langtag.extlang).toEqual([]);
      });

      it('should parse 7-character language', () => {
        const langtag = parseLangtag('aaaaaaa');
        expect(langtag.language).toBe('aaaaaaa');
        expect(langtag.extlang).toEqual([]);
      });

      it('should parse 8-character language', () => {
        const langtag = parseLangtag('aaaaaaaa');
        expect(langtag.language).toBe('aaaaaaaa');
        expect(langtag.extlang).toEqual([]);
      });

      // RFC 5646 §2.2.2: extlang only follows 2*3ALPHA primary language
      it('should parse language with 1 extlang', () => {
        const langtag = parseLangtag('aa-bbb');
        expect(langtag.language).toBe('aa');
        expect(langtag.extlang).toEqual(['bbb']);
      });

      // RFC 5646 §2.2.1: 4ALPHA language has no extlang production
      it('should reject 3-char subtag after 4-char language (no extlang allowed)', () => {
        expect(parse('abcd-efg')).toBeNull();
      });

      // RFC 5646 §2.2.1: 5*8ALPHA language has no extlang production
      it('should reject 3-char subtag after 5-char language (no extlang allowed)', () => {
        expect(parse('abcde-abc')).toBeNull();
      });

      it('should parse language with 2 extlang', () => {
        const langtag = parseLangtag('aaa-bbb-ccc');
        expect(langtag.language).toBe('aaa');
        expect(langtag.extlang).toEqual(['bbb', 'ccc']);
      });

      it('should parse language with 3 extlang', () => {
        const langtag = parseLangtag('aa-bbb-ccc-ddd');
        expect(langtag.language).toBe('aa');
        expect(langtag.extlang).toEqual(['bbb', 'ccc', 'ddd']);
      });

      // RFC 5646 §2.2.2: extlang must be exactly 3 ALPHA; 2-char subtag is region
      it('should parse 2-char subtag after language as region, not extlang', () => {
        const langtag = parseLangtag('zh-cm');
        expect(langtag.language).toBe('zh');
        expect(langtag.extlang).toEqual([]);
        expect(langtag.region).toBe('CM');
      });
    });

    // RFC 5646 §2.2.3: script subtag (4ALPHA, titlecase)
    describe('when parsing script subtags', () => {
      it('should parse script subtag', () => {
        const langtag = parseLangtag('aa-bbbb');
        expect(langtag.language).toBe('aa');
        expect(langtag.script).toBe('Bbbb');
      });

      // RFC 5646 §2.2.3: script must be exactly 4 ALPHA; 3-char subtag is extlang
      it('should parse 3-char subtag after language as extlang, not script', () => {
        const langtag = parseLangtag('en-Lat');
        expect(langtag.extlang).toEqual(['lat']);
        expect(langtag.script).toBeNull();
      });
    });

    // RFC 5646 §2.2.4: region subtag (2ALPHA or 3DIGIT)
    describe('when parsing region subtags', () => {
      it('should parse 2-letter region', () => {
        const langtag = parseLangtag('aa-bb');
        expect(langtag.language).toBe('aa');
        expect(langtag.region).toBe('BB');
      });

      it('should parse 3-digit region', () => {
        const langtag = parseLangtag('aa-111');
        expect(langtag.language).toBe('aa');
        expect(langtag.region).toBe('111');
      });

      it('should parse region with script', () => {
        const langtag = parseLangtag('aa-bbbb-cc');
        expect(langtag.language).toBe('aa');
        expect(langtag.script).toBe('Bbbb');
        expect(langtag.region).toBe('CC');
      });

      // RFC 5646 §2.2.6: single-char subtag is an extension singleton, not region
      it('should return null for single-char subtag without extension subtags', () => {
        expect(parse('en-U')).toBeNull();
      });
    });

    // RFC 5646 §2.2.5: variant subtags (5*8alphanum or DIGIT 3alphanum)
    describe('when parsing variant subtags', () => {
      it('should parse 1 variant', () => {
        const langtag = parseLangtag('aa-b1b1b');
        expect(langtag.language).toBe('aa');
        expect(langtag.variant).toEqual(['b1b1b']);
      });

      it('should parse 3 variants', () => {
        const langtag = parseLangtag('aa-b1b1b-6a8b-cccccc');
        expect(langtag.language).toBe('aa');
        expect(langtag.variant).toEqual(['b1b1b', '6a8b', 'cccccc']);
      });

      it('should parse 2 extlang with 3 variants', () => {
        const langtag = parseLangtag('aa-bbb-ccc-1111-ccccc-b1b1b');
        expect(langtag.language).toBe('aa');
        expect(langtag.variant).toEqual(['1111', 'ccccc', 'b1b1b']);
        expect(langtag.extlang).toEqual(['bbb', 'ccc']);
      });

      // RFC 5646 §2.1: variant subtags can be 7 characters
      it('should parse 7-character variant', () => {
        const langtag = parseLangtag('en-US-1234abc');
        expect(langtag.variant).toEqual(['1234abc']);
      });

      // RFC 5646 §2.1: variant subtags can be up to 8 characters
      it('should parse 8-character variant', () => {
        const langtag = parseLangtag('en-US-12345678');
        expect(langtag.variant).toEqual(['12345678']);
      });

      // RFC 5646 §2.2.5: digit-starting 4-char variant (DIGIT 3alphanum)
      it('should parse digit-starting 4-character variant', () => {
        const langtag = parseLangtag('de-1996');
        expect(langtag.variant).toEqual(['1996']);
      });
    });

    // RFC 5646 §2.2.6: extension subtags (singleton 1*("-" 2*8alphanum))
    // RFC 5646 §2.2.7: 'x' is reserved for privateuse, not a valid extension singleton
    describe('when parsing extension subtags', () => {
      it('should treat x as privateuse singleton, not extension singleton', () => {
        const langtag = parseLangtag('aa-x-abc');
        expect(langtag.extension).toEqual([]);
        expect(langtag.privateuse).toEqual(['abc']);
      });

      it('should parse multiple extension singletons', () => {
        const langtag = parseLangtag('aa-7-123abc-abc-a-12');
        expect(langtag.language).toBe('aa');
        expect(langtag.extension).toEqual([
          {
            singleton: '7',
            subtags: ['123abc', 'abc'],
          },
          {
            singleton: 'a',
            subtags: ['12'],
          },
        ]);
      });

      // RFC 5646 §2.1: extension subtag at max length boundary (8 chars)
      it('should parse 8-character extension subtag', () => {
        const langtag = parseLangtag('en-a-abcdefgh');
        expect(langtag.extension).toEqual([
          {
            singleton: 'a',
            subtags: ['abcdefgh'],
          },
        ]);
      });

      // RFC 5646 §2.1: singletons w, y, z are valid (boundary of excluded x)
      it('should parse boundary singletons w, y, and z', () => {
        const langtagW = parseLangtag('en-w-foo');
        expect(langtagW.extension[0]!.singleton).toBe('w');

        const langtagY = parseLangtag('en-y-foo');
        expect(langtagY.extension[0]!.singleton).toBe('y');

        const langtagZ = parseLangtag('en-z-foo');
        expect(langtagZ.extension[0]!.singleton).toBe('z');
      });
    });

    // RFC 5646 §2.2.7: privateuse subtags within a langtag
    describe('when parsing privateuse subtags', () => {
      it('should parse langtag private use subtags', () => {
        const langtag = parseLangtag('aa-x-1234ab-d');
        expect(langtag.language).toBe('aa');
        expect(langtag.privateuse).toEqual(['1234ab', 'd']);
      });

      // RFC 5646 §2.2.7: privateuse consumes all remaining subtags after x
      it('should consume extension-like subtags after x as privateuse', () => {
        const langtag = parseLangtag('en-x-foo-a-bar');
        expect(langtag.privateuse).toEqual(['foo', 'a', 'bar']);
        expect(langtag.extension).toEqual([]);
      });
    });

    // RFC 5646 §2.1: complete langtag with all optional components
    describe('when all components are present', () => {
      it('should parse the complete tag', () => {
        const langtag = parseLangtag(
          'aaa-bbb-ccc-ddd-abcd-123-abc123-0abc-b-01-abc123-x-01ab-abc12',
        );
        expect(langtag.language).toBe('aaa');
        expect(langtag.extlang).toEqual(['bbb', 'ccc', 'ddd']);
        expect(langtag.script).toBe('Abcd');
        expect(langtag.region).toBe('123');
        expect(langtag.variant).toEqual(['abc123', '0abc']);
        expect(langtag.extension).toEqual([
          {
            singleton: 'b',
            subtags: ['01', 'abc123'],
          },
        ]);
        expect(langtag.privateuse).toEqual(['01ab', 'abc12']);
      });
    });
  });

  // RFC 5646 §2.4: standalone private use tags (x-...)
  describe('when parsing standalone privateuse tags', () => {
    it('should parse multiple subtags', () => {
      const tag = parse('x-111-aaaaa-BBB');
      assert(tag?.type === 'privateuse');
      expect(tag.privateuse).toEqual(['111', 'aaaaa', 'bbb']);
    });

    it('should parse single subtag', () => {
      const tag = parse('x-a');
      assert(tag?.type === 'privateuse');
      expect(tag.privateuse).toEqual(['a']);
    });

    it('should parse mixed subtags', () => {
      const tag = parse('x-1-2-a-b');
      assert(tag?.type === 'privateuse');
      expect(tag.privateuse).toEqual(['1', '2', 'a', 'b']);
    });

    // RFC 5646 §2.1: privateuse subtags can be up to 8 characters
    it('should parse 8-character privateuse subtag', () => {
      const tag = parse('x-abcdefgh');
      assert(tag?.type === 'privateuse');
      expect(tag.privateuse).toEqual(['abcdefgh']);
    });
  });

  // RFC 5646 §2.2.8: grandfathered tags (irregular and regular)
  describe('when parsing grandfathered tags', () => {
    it.each([
      'en-GB-oed',
      'i-ami',
      'i-bnn',
      'i-default',
      'i-enochian',
      'i-hak',
      'i-klingon',
      'i-lux',
      'i-mingo',
      'i-navajo',
      'i-pwn',
      'i-tao',
      'i-tay',
      'i-tsu',
      'sgn-BE-FR',
      'sgn-BE-NL',
      'sgn-CH-DE',
    ])('should parse irregular tag %s', (input) => {
      const tag = parse(input);
      assert(tag?.type === 'grandfathered');
      expect(tag.grandfathered.type).toBe('irregular');
      expect(tag.grandfathered.tag).toBe(input);
    });

    it.each([
      'art-lojban',
      'cel-gaulish',
      'no-bok',
      'no-nyn',
      'zh-guoyu',
      'zh-hakka',
      'zh-min',
      'zh-min-nan',
      'zh-xiang',
    ])('should parse regular tag %s', (input) => {
      const tag = parse(input);
      assert(tag?.type === 'grandfathered');
      expect(tag.grandfathered.type).toBe('regular');
      expect(tag.grandfathered.tag).toBe(input);
    });
  });

  // RFC 5646 §2.1.1: case is not significant but conventions exist
  describe('when the input has non-canonical casing', () => {
    it('should normalize language to lowercase', () => {
      const langtag = parseLangtag('EN');
      expect(langtag.language).toBe('en');
    });

    it('should normalize script to titlecase', () => {
      const langtag = parseLangtag('en-lATN');
      expect(langtag.script).toBe('Latn');
    });

    it('should normalize region to uppercase', () => {
      const langtag = parseLangtag('en-us');
      expect(langtag.region).toBe('US');
    });

    it('should normalize all components together', () => {
      const langtag = parseLangtag('EN-LATN-US');
      expect(langtag.language).toBe('en');
      expect(langtag.script).toBe('Latn');
      expect(langtag.region).toBe('US');
    });

    it('should normalize grandfathered irregular to canonical form', () => {
      const tag = parse('EN-GB-OED');
      assert(tag?.type === 'grandfathered');
      expect(tag.grandfathered.type).toBe('irregular');
      expect(tag.grandfathered.tag).toBe('en-GB-oed');
    });

    it('should normalize standalone privateuse to lowercase', () => {
      const tag = parse('X-CUSTOM');
      assert(tag?.type === 'privateuse');
      expect(tag.privateuse).toEqual(['custom']);
    });

    it('should normalize extlang to lowercase', () => {
      const langtag = parseLangtag('ZH-CMN');
      expect(langtag.language).toBe('zh');
      expect(langtag.extlang).toEqual(['cmn']);
    });

    it('should normalize variant to lowercase', () => {
      const langtag = parseLangtag('hy-Latn-IT-AREVELA');
      expect(langtag.variant).toEqual(['arevela']);
    });

    it('should normalize extension singleton and values to lowercase', () => {
      const langtag = parseLangtag('de-DE-U-CO-PHONEBK');
      expect(langtag.extension).toEqual([
        {
          singleton: 'u',
          subtags: ['co', 'phonebk'],
        },
      ]);
    });
  });

  // RFC 5646 §2.1: non-string input is handled gracefully
  describe('when the input is not a valid string', () => {
    it('should return null for undefined-like inputs', () => {
      expect(parse(undefined as unknown as string)).toBeNull();
    });
  });
});

import { describe, it, expect } from 'vitest';
import { parse } from '../parse/parse';
import { extensionU, extensionT } from './extension';
import type { BCP47Tag } from '../../types';

// RFC 6067 — BCP 47 Extension U (Unicode Locale Extensions)
// https://www.rfc-editor.org/rfc/rfc6067
describe('extensionU', () => {
  function parseTag(input: string): BCP47Tag {
    const tag = parse(input);
    if (!tag) {
      throw new Error(`Failed to parse: ${input}`);
    }
    return tag;
  }

  // RFC 6067 §3: parsing Unicode locale extension keywords and attributes
  describe('when the tag has a u extension', () => {
    it('should extract a single keyword', () => {
      expect(extensionU(parseTag('de-DE-u-co-phonebk'))).toEqual({
        attributes: [],
        keywords: { co: 'phonebk' },
      });
    });

    it('should extract multiple keywords', () => {
      expect(extensionU(parseTag('en-US-u-ca-buddhist-co-phonebk'))).toEqual({
        attributes: [],
        keywords: { ca: 'buddhist', co: 'phonebk' },
      });
    });

    it('should extract a key with no value', () => {
      expect(extensionU(parseTag('en-u-nu'))).toEqual({
        attributes: [],
        keywords: { nu: '' },
      });
    });

    it('should extract a key with multi-subtag value', () => {
      expect(extensionU(parseTag('en-u-vt-0041-005a'))).toEqual({
        attributes: [],
        keywords: { vt: '0041-005a' },
      });
    });

    it('should extract attributes before keywords', () => {
      expect(extensionU(parseTag('en-u-islamcal-co-phonebk'))).toEqual({
        attributes: ['islamcal'],
        keywords: { co: 'phonebk' },
      });
    });

    it('should extract multiple attributes', () => {
      expect(extensionU(parseTag('en-u-attr1-attr2-co-phonebk'))).toEqual({
        attributes: ['attr1', 'attr2'],
        keywords: { co: 'phonebk' },
      });
    });

    it('should extract attributes with no keywords', () => {
      expect(extensionU(parseTag('en-u-islamcal'))).toEqual({
        attributes: ['islamcal'],
        keywords: {},
      });
    });

    // RFC 6067 §3: "In the event that the same keyword is included more
    // than once, the first occurrence is used"
    it('should use first value when duplicate keys appear (RFC 6067 §3)', () => {
      const tag: BCP47Tag = {
        type: 'langtag',
        langtag: {
          language: 'en',
          extlang: [],
          script: null,
          region: null,
          variant: [],
          extension: [{ singleton: 'u', subtags: ['co', 'phonebk', 'co', 'stroke'] }],
          privateuse: [],
        },
      };
      expect(extensionU(tag)).toEqual({
        attributes: [],
        keywords: { co: 'phonebk' },
      });
    });

    // RFC 6067 §3: "In the event that the same attribute is included
    // more than once, the second and subsequent occurrences are ignored"
    it('should deduplicate attributes (RFC 6067 §3)', () => {
      const tag: BCP47Tag = {
        type: 'langtag',
        langtag: {
          language: 'en',
          extlang: [],
          script: null,
          region: null,
          variant: [],
          extension: [{ singleton: 'u', subtags: ['attr1', 'attr1', 'co', 'phonebk'] }],
          privateuse: [],
        },
      };
      expect(extensionU(tag)).toEqual({
        attributes: ['attr1'],
        keywords: { co: 'phonebk' },
      });
    });

    it('should handle case-insensitive subtags from parser', () => {
      const tag: BCP47Tag = {
        type: 'langtag',
        langtag: {
          language: 'en',
          extlang: [],
          script: null,
          region: null,
          variant: [],
          extension: [{ singleton: 'u', subtags: ['co', 'phonebk'] }],
          privateuse: [],
        },
      };
      expect(extensionU(tag)).toEqual({
        attributes: [],
        keywords: { co: 'phonebk' },
      });
    });
  });

  // RFC 6067: returns null when no u extension is present
  describe('when the tag has no u extension', () => {
    it('should return null', () => {
      expect(extensionU(parseTag('en-US'))).toBeNull();
    });
  });

  // RFC 6067: attribute and type boundary lengths
  describe('when validating subtag lengths', () => {
    it('should extract 3-character attribute', () => {
      expect(extensionU(parseTag('en-u-abc-co-phonebk'))).toEqual({
        attributes: ['abc'],
        keywords: { co: 'phonebk' },
      });
    });

    it('should extract 8-character attribute', () => {
      expect(extensionU(parseTag('en-u-abcdefgh-co-phonebk'))).toEqual({
        attributes: ['abcdefgh'],
        keywords: { co: 'phonebk' },
      });
    });

    it('should extract 3-character type value', () => {
      expect(extensionU(parseTag('en-u-ca-abc'))).toEqual({
        attributes: [],
        keywords: { ca: 'abc' },
      });
    });

    it('should extract 8-character type value', () => {
      expect(extensionU(parseTag('en-u-ca-abcdefgh'))).toEqual({
        attributes: [],
        keywords: { ca: 'abcdefgh' },
      });
    });
  });

  // RFC 6067 §3: key structure is [alphanum][alpha]
  describe('when parsing key patterns', () => {
    it('should recognize numeric-alpha key pattern', () => {
      expect(extensionU(parseTag('en-u-0a-value'))).toEqual({
        attributes: [],
        keywords: { '0a': 'value' },
      });
    });
  });

  // RFC 5646 §2.2.6: extensions only apply to langtag productions
  describe('when the tag is not a langtag', () => {
    it('should return null for privateuse', () => {
      expect(extensionU(parseTag('x-custom'))).toBeNull();
    });

    it('should return null for grandfathered', () => {
      expect(extensionU(parseTag('i-klingon'))).toBeNull();
    });
  });
});

// RFC 6497 — BCP 47 Extension T (Transformed Content)
// https://www.rfc-editor.org/rfc/rfc6497
describe('extensionT', () => {
  function parseTag(input: string): BCP47Tag {
    const tag = parse(input);
    if (!tag) {
      throw new Error(`Failed to parse: ${input}`);
    }
    return tag;
  }

  // RFC 6497 §3: tlang (source language) without tfields
  describe('when the tag has a t extension with source only', () => {
    it('should extract the source language', () => {
      expect(extensionT(parseTag('ja-t-it'))).toEqual({
        source: 'it',
        fields: {},
      });
    });

    it('should extract a source with script', () => {
      expect(extensionT(parseTag('und-t-und-cyrl'))).toEqual({
        source: 'und-cyrl',
        fields: {},
      });
    });
  });

  // RFC 6497 §3: tfields without tlang (source language)
  describe('when the tag has a t extension with fields only', () => {
    it('should extract fields without source', () => {
      expect(extensionT(parseTag('und-t-m0-ungegn'))).toEqual({
        source: null,
        fields: { m0: 'ungegn' },
      });
    });
  });

  // RFC 6497 §3: both tlang and tfields present
  describe('when the tag has source and fields', () => {
    it('should extract both source and fields', () => {
      expect(extensionT(parseTag('und-t-it-m0-ungegn'))).toEqual({
        source: 'it',
        fields: { m0: 'ungegn' },
      });
    });

    it('should extract multi-subtag field values', () => {
      expect(extensionT(parseTag('und-t-und-latn-m0-ungegn-2007'))).toEqual({
        source: 'und-latn',
        fields: { m0: 'ungegn-2007' },
      });
    });

    it('should extract multiple fields', () => {
      expect(extensionT(parseTag('und-t-it-m0-bgn-s0-accents'))).toEqual({
        source: 'it',
        fields: { m0: 'bgn', s0: 'accents' },
      });
    });
  });

  describe('when the tag has duplicate tkeys', () => {
    // RFC 6497 §3: "In the event that the same tkey is included more
    // than once, the first occurrence is used"
    it('should use first value for duplicate tkeys (RFC 6497 §3)', () => {
      const tag: BCP47Tag = {
        type: 'langtag',
        langtag: {
          language: 'und',
          extlang: [],
          script: null,
          region: null,
          variant: [],
          extension: [{ singleton: 't', subtags: ['m0', 'bgn', 'm0', 'other'] }],
          privateuse: [],
        },
      };
      expect(extensionT(tag)).toEqual({
        source: null,
        fields: { m0: 'bgn' },
      });
    });
  });

  // RFC 6497 §3: source language with region
  describe('when the source includes region', () => {
    it('should extract source with region', () => {
      expect(extensionT(parseTag('en-t-ja-jp'))).toEqual({
        source: 'ja-jp',
        fields: {},
      });
    });
  });

  // RFC 6497 §3: source language with variant
  describe('when the source includes variant', () => {
    it('should extract source with variant', () => {
      expect(extensionT(parseTag('en-t-ja-kana-jp-1996'))).toEqual({
        source: 'ja-kana-jp-1996',
        fields: {},
      });
    });
  });

  // RFC 6497 §3: tkey pattern [alpha][digit]
  describe('when parsing tkey patterns', () => {
    it('should recognize all standard tkey formats', () => {
      expect(extensionT(parseTag('en-t-d0-fwidth'))).toEqual({
        source: null,
        fields: { d0: 'fwidth' },
      });
    });

    it('should recognize h0 and s0 tkeys', () => {
      expect(extensionT(parseTag('en-t-h0-hybrid-s0-ascii'))).toEqual({
        source: null,
        fields: { h0: 'hybrid', s0: 'ascii' },
      });
    });
  });

  // RFC 6497: returns null when no t extension is present
  describe('when the tag has no t extension', () => {
    it('should return null', () => {
      expect(extensionT(parseTag('en-US'))).toBeNull();
    });
  });

  // RFC 5646 §2.2.6: extensions only apply to langtag productions
  describe('when the tag is not a langtag', () => {
    it('should return null for privateuse', () => {
      expect(extensionT(parseTag('x-custom'))).toBeNull();
    });
  });
});

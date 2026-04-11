import { describe, it, expect, assert } from 'vitest';
import { langtag } from './langtag';
import { stringify } from '../stringify/stringify';

// RFC 5646 §2.2.1–2.2.7: programmatic construction of langtag structures
describe('langtag', () => {
  // RFC 5646 §2.2.1: language subtag is the only required component
  describe('when called with language only', () => {
    it('should create a tag with empty defaults', () => {
      const tag = langtag('en');
      expect(tag).toEqual({
        type: 'langtag',
        langtag: {
          language: 'en',
          extlang: [],
          script: null,
          region: null,
          variant: [],
          extension: [],
          privateuse: [],
        },
      });
    });
  });

  // RFC 5646 §2.1: all optional langtag components populated
  describe('when called with all options', () => {
    it('should create a tag with all fields populated', () => {
      const tag = langtag('zh', {
        extlang: ['cmn'],
        script: 'Hant',
        region: 'TW',
        variant: ['fonipa'],
        extension: [{ singleton: 'u', subtags: ['ca', 'buddhist'] }],
        privateuse: ['private'],
      });
      expect(tag).toEqual({
        type: 'langtag',
        langtag: {
          language: 'zh',
          extlang: ['cmn'],
          script: 'Hant',
          region: 'TW',
          variant: ['fonipa'],
          extension: [{ singleton: 'u', subtags: ['ca', 'buddhist'] }],
          privateuse: ['private'],
        },
      });
    });
  });

  describe('when called with partial options', () => {
    it('should fill missing fields with defaults', () => {
      const tag = langtag('en', { region: 'US' });
      expect(tag).toEqual({
        type: 'langtag',
        langtag: {
          language: 'en',
          extlang: [],
          script: null,
          region: 'US',
          variant: [],
          extension: [],
          privateuse: [],
        },
      });
    });
  });

  describe('when used with stringify', () => {
    it('should produce a well-formed language tag', () => {
      const tag = langtag('en', { script: 'Latn', region: 'US' });
      expect(stringify(tag)).toBe('en-Latn-US');
    });
  });

  // RFC 5646 §2.1.1: case normalization conventions for each subtag type
  describe('when normalizing casing', () => {
    it('should lowercase language', () => {
      const tag = langtag('EN');
      assert(tag.type === 'langtag');
      expect(tag.langtag.language).toBe('en');
    });

    it('should titlecase script', () => {
      const tag = langtag('en', { script: 'latn' });
      assert(tag.type === 'langtag');
      expect(tag.langtag.script).toBe('Latn');
    });

    it('should uppercase region', () => {
      const tag = langtag('en', { region: 'us' });
      assert(tag.type === 'langtag');
      expect(tag.langtag.region).toBe('US');
    });

    it('should lowercase extlang', () => {
      const tag = langtag('zh', { extlang: ['CMN'] });
      assert(tag.type === 'langtag');
      expect(tag.langtag.extlang).toEqual(['cmn']);
    });

    it('should lowercase variant', () => {
      const tag = langtag('en', { variant: ['FONIPA'] });
      assert(tag.type === 'langtag');
      expect(tag.langtag.variant).toEqual(['fonipa']);
    });

    it('should lowercase extension singleton and subtags', () => {
      const tag = langtag('en', {
        extension: [{ singleton: 'U', subtags: ['CO', 'PHONEBK'] }],
      });
      assert(tag.type === 'langtag');
      expect(tag.langtag.extension).toEqual([
        { singleton: 'u', subtags: ['co', 'phonebk'] },
      ]);
    });

    it('should lowercase privateuse', () => {
      const tag = langtag('en', { privateuse: ['CUSTOM'] });
      assert(tag.type === 'langtag');
      expect(tag.langtag.privateuse).toEqual(['custom']);
    });
  });

  // RFC 5646 §2.2.1: language subtag must be 2*3ALPHA / 4ALPHA / 5*8ALPHA
  describe('when the language is invalid', () => {
    it('should throw for single character', () => {
      expect(() => langtag('a')).toThrow(RangeError);
    });

    it('should throw for too long language', () => {
      expect(() => langtag('aaaaaaaaa')).toThrow(RangeError);
    });

    it('should throw for numeric language', () => {
      expect(() => langtag('123')).toThrow(RangeError);
    });

    it('should throw for empty language', () => {
      expect(() => langtag('')).toThrow(RangeError);
    });
  });

  // RFC 5646 §2.2.2: extlang constraints (3ALPHA, max 3, only after 2*3ALPHA)
  describe('when extlang is invalid', () => {
    it('should throw for non-3-character extlang', () => {
      expect(() => langtag('zh', { extlang: ['ab'] })).toThrow(RangeError);
    });

    it('should throw for more than 3 extlang subtags', () => {
      expect(() => langtag('zh', { extlang: ['aaa', 'bbb', 'ccc', 'ddd'] })).toThrow(RangeError);
    });

    it('should throw for extlang with 4+ character language', () => {
      expect(() => langtag('aaaa', { extlang: ['bbb'] })).toThrow(RangeError);
    });
  });

  // RFC 5646 §2.2.3: script subtag must be exactly 4ALPHA
  describe('when script is invalid', () => {
    it('should throw for non-4-character script', () => {
      expect(() => langtag('en', { script: 'Lat' })).toThrow(RangeError);
    });

    it('should throw for 5-character script', () => {
      expect(() => langtag('en', { script: 'Latin' })).toThrow(RangeError);
    });

    it('should throw for numeric script', () => {
      expect(() => langtag('en', { script: '1234' })).toThrow(RangeError);
    });
  });

  // RFC 5646 §2.2.4: region must be 2ALPHA or 3DIGIT
  describe('when region is invalid', () => {
    it('should throw for single character region', () => {
      expect(() => langtag('en', { region: 'U' })).toThrow(RangeError);
    });

    it('should throw for 3-letter region', () => {
      expect(() => langtag('en', { region: 'USA' })).toThrow(RangeError);
    });

    it('should throw for 4-digit region', () => {
      expect(() => langtag('en', { region: '1234' })).toThrow(RangeError);
    });

    it('should accept 3-digit region', () => {
      const tag = langtag('en', { region: '001' });
      assert(tag.type === 'langtag');
      expect(tag.langtag.region).toBe('001');
    });
  });

  // RFC 5646 §2.2.5: variant subtag constraints and uniqueness
  describe('when variant is invalid', () => {
    it('should throw for too short variant', () => {
      expect(() => langtag('en', { variant: ['abc'] })).toThrow(RangeError);
    });

    it('should throw for too long variant', () => {
      expect(() => langtag('en', { variant: ['aaaaaaaaa'] })).toThrow(RangeError);
    });

    it('should throw for duplicate variants', () => {
      expect(() => langtag('en', { variant: ['fonipa', 'fonipa'] })).toThrow(RangeError);
    });

    it('should throw for duplicate variants case-insensitive', () => {
      expect(() => langtag('en', { variant: ['fonipa', 'FONIPA'] })).toThrow(RangeError);
    });

    it('should accept digit-starting 4-character variant', () => {
      const tag = langtag('de', { variant: ['1996'] });
      assert(tag.type === 'langtag');
      expect(tag.langtag.variant).toEqual(['1996']);
    });
  });

  // RFC 5646 §2.2.6: extension constraints (no 'x' singleton, non-empty, unique)
  describe('when extension is invalid', () => {
    it('should throw for x as singleton', () => {
      expect(() => langtag('en', {
        extension: [{ singleton: 'x', subtags: ['foo'] }],
      })).toThrow(RangeError);
    });

    it('should throw for empty subtags', () => {
      expect(() => langtag('en', {
        extension: [{ singleton: 'u', subtags: [] }],
      })).toThrow(RangeError);
    });

    it('should throw for invalid extension subtag', () => {
      expect(() => langtag('en', {
        extension: [{ singleton: 'u', subtags: ['a'] }],
      })).toThrow(RangeError);
    });

    it('should throw for too long extension subtag', () => {
      expect(() => langtag('en', {
        extension: [{ singleton: 'u', subtags: ['abcdefghi'] }],
      })).toThrow(RangeError);
    });

    it('should throw for duplicate singletons', () => {
      expect(() => langtag('en', {
        extension: [
          { singleton: 'u', subtags: ['co', 'phonebk'] },
          { singleton: 'u', subtags: ['ca', 'buddhist'] },
        ],
      })).toThrow(RangeError);
    });
  });

  // RFC 5646 §2.2.7: privateuse subtag constraints (1*8alphanum)
  describe('when privateuse is invalid', () => {
    it('should throw for too long subtag', () => {
      expect(() => langtag('en', { privateuse: ['aaaaaaaaa'] })).toThrow(RangeError);
    });

    it('should throw for empty subtag', () => {
      expect(() => langtag('en', { privateuse: [''] })).toThrow(RangeError);
    });

    it('should accept 1-character subtag', () => {
      const tag = langtag('en', { privateuse: ['a'] });
      assert(tag.type === 'langtag');
      expect(tag.langtag.privateuse).toEqual(['a']);
    });

    it('should accept 8-character subtag', () => {
      const tag = langtag('en', { privateuse: ['abcdefgh'] });
      assert(tag.type === 'langtag');
      expect(tag.langtag.privateuse).toEqual(['abcdefgh']);
    });
  });
});

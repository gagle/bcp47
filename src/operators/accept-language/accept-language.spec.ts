import { describe, it, expect } from 'vitest';
import { acceptLanguage } from './accept-language';

// RFC 9110 §12.5.4 — Accept-Language (quality: §12.4.2)
// https://www.rfc-editor.org/rfc/rfc9110#section-12.5.4
describe('acceptLanguage', () => {
  // RFC 9110 §12.4.2: quality value (qvalue) parsing
  describe('when parsing quality values', () => {
    it('should parse tags with explicit quality', () => {
      expect(acceptLanguage('en-US;q=0.8')).toEqual([
        { tag: 'en-US', quality: 0.8 },
      ]);
    });

    it('should default quality to 1.0 when omitted', () => {
      expect(acceptLanguage('en-US')).toEqual([
        { tag: 'en-US', quality: 1.0 },
      ]);
    });
  });

  // RFC 9110 §12.5.4: Accept-Language with multiple comma-separated entries
  describe('when parsing multiple tags', () => {
    it('should sort by quality descending', () => {
      expect(acceptLanguage('en;q=0.5, fr-CA, en-US;q=0.8, *;q=0.1')).toEqual([
        { tag: 'fr-CA', quality: 1.0 },
        { tag: 'en-US', quality: 0.8 },
        { tag: 'en', quality: 0.5 },
        { tag: '*', quality: 0.1 },
      ]);
    });

    it('should handle tags without spaces after commas', () => {
      expect(acceptLanguage('en,fr')).toEqual([
        { tag: 'en', quality: 1.0 },
        { tag: 'fr', quality: 1.0 },
      ]);
    });
  });

  // RFC 9110 §12.5.4: wildcard '*' as a language range
  describe('when the header contains wildcards', () => {
    it('should parse wildcard as a tag', () => {
      expect(acceptLanguage('*')).toEqual([
        { tag: '*', quality: 1.0 },
      ]);
    });
  });

  // RFC 9110 §12.5.4: absent or empty Accept-Language header
  describe('when the header is empty', () => {
    it('should return an empty array', () => {
      expect(acceptLanguage('')).toEqual([]);
    });

    it('should return an empty array for whitespace only', () => {
      expect(acceptLanguage('   ')).toEqual([]);
    });
  });

  // RFC 9110 §12.5.4: graceful handling of malformed header entries
  describe('when the header contains malformed entries', () => {
    it('should skip entries with empty tag', () => {
      expect(acceptLanguage(', en, ')).toEqual([
        { tag: 'en', quality: 1.0 },
      ]);
    });

    it('should skip entries that are only a semicolon parameter', () => {
      expect(acceptLanguage(';q=0.5, en')).toEqual([
        { tag: 'en', quality: 1.0 },
      ]);
    });

    it('should skip entries with non-numeric quality value', () => {
      expect(acceptLanguage('en;q=abc, fr')).toEqual([
        { tag: 'fr', quality: 1.0 },
      ]);
    });

    it('should skip entries with double-dot quality value', () => {
      expect(acceptLanguage('en;q=.., fr')).toEqual([
        { tag: 'fr', quality: 1.0 },
      ]);
    });

    it('should skip entries with invalid language range characters', () => {
      expect(acceptLanguage('not!valid, en')).toEqual([
        { tag: 'en', quality: 1.0 },
      ]);
    });

    it('should skip entries with underscores', () => {
      expect(acceptLanguage('en_US, fr')).toEqual([
        { tag: 'fr', quality: 1.0 },
      ]);
    });

    // RFC 4647 §2.1: language-range = 1*8ALPHA, so single-char primary subtags are valid
    it('should accept single-character language subtags per RFC 4647', () => {
      expect(acceptLanguage('a, en')).toEqual([
        { tag: 'a', quality: 1.0 },
        { tag: 'en', quality: 1.0 },
      ]);
    });
  });

  // RFC 9110 §12.4.2: qvalue = ("0" ["." 0*3DIGIT]) / ("1" ["." 0*3("0")])
  // Values not matching this grammar are rejected (entry skipped).
  describe('when quality value violates qvalue grammar', () => {
    it('should skip entries with quality above 1', () => {
      expect(acceptLanguage('en;q=2, fr')).toEqual([
        { tag: 'fr', quality: 1.0 },
      ]);
    });

    it('should skip entries with quality of 1.5', () => {
      expect(acceptLanguage('en;q=1.5, fr;q=0.5')).toEqual([
        { tag: 'fr', quality: 0.5 },
      ]);
    });

    it('should skip entries with leading-dot quality', () => {
      expect(acceptLanguage('en;q=.5, fr')).toEqual([
        { tag: 'fr', quality: 1.0 },
      ]);
    });

    it('should skip entries with 4+ decimal digits', () => {
      expect(acceptLanguage('en;q=0.1234, fr')).toEqual([
        { tag: 'fr', quality: 1.0 },
      ]);
    });

    it('should skip entries with non-zero digits after 1', () => {
      expect(acceptLanguage('en;q=1.1, fr')).toEqual([
        { tag: 'fr', quality: 1.0 },
      ]);
    });
  });

  // RFC 9110 §12.4.2: parameter names are case-insensitive
  describe('when quality is case-insensitive', () => {
    it('should parse uppercase Q parameter', () => {
      expect(acceptLanguage('en;Q=0.9')).toEqual([
        { tag: 'en', quality: 0.9 },
      ]);
    });
  });

  // RFC 9110 §12.5.4: stable ordering for equal-quality entries
  describe('when entries have equal quality', () => {
    // Stable sort: entries with equal quality preserve their original order
    it('should preserve insertion order for equal quality entries', () => {
      expect(acceptLanguage('en;q=0.8, fr;q=0.8, de;q=0.8')).toEqual([
        { tag: 'en', quality: 0.8 },
        { tag: 'fr', quality: 0.8 },
        { tag: 'de', quality: 0.8 },
      ]);
    });
  });

  describe('when quality has invalid negative sign', () => {
    // RFC 9110 §12.4.2: qvalue grammar does not allow negative numbers;
    // the strict regex rejects the entry entirely
    it('should skip entries with negative quality value', () => {
      expect(acceptLanguage('en;q=-0.5, fr')).toEqual([
        { tag: 'fr', quality: 1.0 },
      ]);
    });
  });

  // RFC 9110 §12.4.2: boundary values in qvalue grammar (0.000–1.000)
  describe('when quality edge cases', () => {
    it('should handle quality value of exactly 0', () => {
      expect(acceptLanguage('en;q=0')).toEqual([
        { tag: 'en', quality: 0 },
      ]);
    });

    it('should handle quality value of exactly 1 (integer)', () => {
      expect(acceptLanguage('en;q=1')).toEqual([
        { tag: 'en', quality: 1.0 },
      ]);
    });

    it('should handle quality value of 0.000', () => {
      expect(acceptLanguage('en;q=0.000')).toEqual([
        { tag: 'en', quality: 0 },
      ]);
    });

    // RFC 9110 §12.4.2: qvalue allows up to 3 decimal zeros after 1
    it('should handle quality value of 1.000', () => {
      expect(acceptLanguage('en;q=1.000')).toEqual([
        { tag: 'en', quality: 1.0 },
      ]);
    });

    it('should handle tag with private-use subtag', () => {
      expect(acceptLanguage('en-US-x-custom;q=0.8')).toEqual([
        { tag: 'en-US-x-custom', quality: 0.8 },
      ]);
    });

    it('should handle quality value of 1.0 with one decimal', () => {
      expect(acceptLanguage('en;q=1.0')).toEqual([
        { tag: 'en', quality: 1.0 },
      ]);
    });

    it('should handle quality value of 0.001 (minimal preference)', () => {
      expect(acceptLanguage('en;q=0.001')).toEqual([
        { tag: 'en', quality: 0.001 },
      ]);
    });

    // RFC 9110 §12.4.2: qvalue with 1 decimal digit
    it('should handle quality value of 0.0', () => {
      expect(acceptLanguage('en;q=0.0')).toEqual([
        { tag: 'en', quality: 0 },
      ]);
    });
  });

  // RFC 9110 §12.5.4: whitespace handling around delimiters
  describe('when header has extra whitespace', () => {
    it('should handle whitespace around commas', () => {
      expect(acceptLanguage('en , fr')).toEqual([
        { tag: 'en', quality: 1.0 },
        { tag: 'fr', quality: 1.0 },
      ]);
    });

    it('should handle whitespace around semicolons', () => {
      expect(acceptLanguage('en ; q=0.8')).toEqual([
        { tag: 'en', quality: 0.8 },
      ]);
    });
  });

  // RFC 4647 §2.1: language ranges in Accept-Language
  describe('when parsing language ranges', () => {
    it('should parse multiple language ranges with quality', () => {
      expect(acceptLanguage('en-US, en;q=0.9')).toEqual([
        { tag: 'en-US', quality: 1.0 },
        { tag: 'en', quality: 0.9 },
      ]);
    });
  });

  // RFC 9110 §12.5.4: complex real-world header from RFC example
  describe('when parsing RFC example header', () => {
    it('should parse da, en-GB;q=0.8, en;q=0.7', () => {
      expect(acceptLanguage('da, en-GB;q=0.8, en;q=0.7')).toEqual([
        { tag: 'da', quality: 1.0 },
        { tag: 'en-GB', quality: 0.8 },
        { tag: 'en', quality: 0.7 },
      ]);
    });
  });
});

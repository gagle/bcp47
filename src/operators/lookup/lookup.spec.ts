import { describe, it, expect } from 'vitest';
import { lookup } from './lookup';

// RFC 4647 §3.4 — Lookup Matching
// https://www.rfc-editor.org/rfc/rfc4647#section-3.4
describe('lookup', () => {
  const tags = ['en', 'en-US', 'zh-Hant', 'de-DE-1996'];

  // RFC 4647 §3.4 step 1: exact match is checked first
  describe('when finding an exact match', () => {
    it('should return the matched tag', () => {
      expect(lookup(tags, 'en-US')).toBe('en-US');
    });
  });

  // RFC 4647 §3.4 step 3: "remove the last subtag … if the new range
  // ends with a single-letter or digit subtag … remove that subtag"
  describe('when truncating to find a match', () => {
    it('should truncate rightmost subtag to find match', () => {
      expect(lookup(tags, 'en-US-x-custom')).toBe('en-US');
    });

    it('should truncate past singletons', () => {
      expect(lookup(tags, 'en-a-foo')).toBe('en');
    });

    it('should truncate multiple subtags', () => {
      expect(lookup(tags, 'zh-Hant-TW')).toBe('zh-Hant');
    });

    // RFC 4647 §3.4: full truncation sequence from long tag to language-only match
    it('should truncate through all subtags including privateuse', () => {
      expect(lookup(['zh'], 'zh-Hant-CN-x-private1-private2')).toBe('zh');
    });
  });

  // RFC 4647 §3.4: no match returns null or a user-defined default
  describe('when no match is found', () => {
    it('should return null by default', () => {
      expect(lookup(tags, 'fr')).toBeNull();
    });

    it('should return the default value when provided', () => {
      expect(lookup(tags, 'fr', 'en')).toBe('en');
    });
  });

  // RFC 4647 §3.4: preferences are tried in priority order
  describe('when using multiple preferences', () => {
    it('should return the first match across preferences in priority order', () => {
      expect(lookup(tags, ['fr', 'zh-Hant-TW'])).toBe('zh-Hant');
    });

    it('should return first preference when both preferences match', () => {
      expect(lookup(['en', 'fr'], ['fr', 'en'])).toBe('fr');
    });
  });

  // RFC 4647 §3.4: "the special range '*' … is ignored"
  describe('when wildcard is in preferences', () => {
    it('should skip wildcard preferences', () => {
      expect(lookup(tags, ['*', 'en-US'])).toBe('en-US');
    });
  });

  // RFC 4647 §3.4: comparison is case-insensitive
  describe('when matching is case-insensitive', () => {
    it('should match regardless of case', () => {
      expect(lookup(tags, 'EN-US')).toBe('en-US');
    });
  });

  // RFC 4647 §3.4 step 3: singletons and following subtags are removed together
  describe('when the full truncation sequence includes singletons', () => {
    it('should remove singletons together with following subtags', () => {
      expect(lookup(tags, 'de-DE-1996-a-foo-x-bar')).toBe('de-DE-1996');
    });
  });

  // RFC 4647 §3.4: matched tag is returned in its original form
  describe('when tags array preserves original casing', () => {
    it('should return the original tag casing', () => {
      expect(lookup(['EN-us', 'de-DE'], 'en-US')).toBe('EN-us');
    });
  });

  // RFC 4647 §3.4: the wildcard range '*' is ignored in lookup
  describe('when range is wildcard', () => {
    it('should skip wildcard and return null', () => {
      expect(lookup(tags, '*')).toBeNull();
    });

    it('should skip wildcard and return default value', () => {
      expect(lookup(tags, '*', 'en')).toBe('en');
    });
  });

  // RFC 4647 §3.4: empty inputs return default
  describe('when inputs are empty', () => {
    it('should return null for empty available tags', () => {
      expect(lookup([], 'en')).toBeNull();
    });

    it('should return null for empty ranges', () => {
      expect(lookup(tags, [])).toBeNull();
    });
  });
});

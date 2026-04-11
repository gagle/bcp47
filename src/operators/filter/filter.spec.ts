import { describe, it, expect } from 'vitest';
import { filter } from './filter';

// RFC 4647 §3.3.2 — Extended Filtering
// https://www.rfc-editor.org/rfc/rfc4647#section-3.3.2
describe('filter', () => {
  const tags = ['de-DE', 'de-Latn-DE', 'de-Latf-DE', 'de-DE-x-goethe',
    'de-Latn-DE-1996', 'de-Deva-DE', 'de', 'de-x-DE', 'de-Deva'];

  // RFC 4647 §3.3.2: extended filtering compares subtags with wildcard skipping
  describe('when matching with subtag-aware filtering', () => {
    it('should match exact tag and tags with intermediate subtags', () => {
      const result = filter(tags, 'de-DE');
      expect(result).toEqual([
        'de-DE', 'de-Latn-DE', 'de-Latf-DE',
        'de-DE-x-goethe', 'de-Latn-DE-1996', 'de-Deva-DE',
      ]);
    });

    it('should not match when tag is shorter than range', () => {
      const result = filter(tags, 'de-DE');
      expect(result).not.toContain('de');
    });

    it('should not match across singleton boundaries', () => {
      const result = filter(tags, 'de-DE');
      expect(result).not.toContain('de-x-DE');
    });

    it('should not match when non-matching subtag exhausts tag', () => {
      const result = filter(tags, 'de-DE');
      expect(result).not.toContain('de-Deva');
    });
  });

  // RFC 4647 §3.3.2: a language-only range matches all tags with that primary language
  describe('when matching with language-only range', () => {
    it('should match all tags with that language', () => {
      expect(filter(tags, 'de')).toEqual(tags);
    });
  });

  // RFC 4647 §3.3.2 step 1: first subtag must match for any result
  describe('when the first subtag does not match', () => {
    it('should reject the tag immediately', () => {
      const result = filter(['fr-FR'], 'de-DE');
      expect(result).toEqual([]);
    });
  });

  // RFC 4647 §3.3.2 step 2a: "the range's subtag is the wildcard '*'"
  describe('when using wildcard in first position', () => {
    it('should match any language with the specified region', () => {
      const result = filter(
        ['en-US', 'fr-US', 'de-DE'],
        '*-US',
      );
      expect(result).toEqual(['en-US', 'fr-US']);
    });
  });

  // RFC 4647 §3.3.2 step 2a: wildcard in non-first position skips optional subtags
  describe('when using wildcard in non-first position', () => {
    it('should skip optional subtags with wildcard', () => {
      const result = filter(
        ['de-DE', 'de-Latn-DE'],
        'de-*-DE',
      );
      expect(result).toEqual(['de-DE', 'de-Latn-DE']);
    });
  });

  // RFC 4647 §3.3.1: "A range of '*' matches any tag"
  describe('when using standalone wildcard', () => {
    it('should match all tags', () => {
      expect(filter(tags, '*')).toEqual(tags);
    });
  });

  // RFC 4647 §3.3.2: multiple ranges applied in priority order
  describe('when using multiple patterns', () => {
    it('should return matches in pattern priority order', () => {
      const simpleTags = ['de-DE', 'en-US', 'en-GB', 'fr-FR'];
      expect(filter(simpleTags, ['fr', 'de-DE'])).toEqual(['fr-FR', 'de-DE']);
    });

    it('should deduplicate results', () => {
      const result = filter(['en-US', 'en-GB'], ['en', 'en-US']);
      expect(result).toEqual(['en-US', 'en-GB']);
    });
  });

  // RFC 4647 §3.3.2: single range convenience form
  describe('when patterns accepts a single string', () => {
    it('should work with a single string pattern', () => {
      expect(filter(['en-US', 'en-GB', 'fr-FR'], 'en')).toEqual(['en-US', 'en-GB']);
    });
  });

  // RFC 4647 §3.3.2 step 1: "case is not significant"
  describe('when matching is case-insensitive', () => {
    it('should match regardless of case', () => {
      expect(filter(['en-US', 'en-GB'], 'EN')).toEqual(['en-US', 'en-GB']);
    });

    it('should match with lowercase range against mixed-case tags', () => {
      expect(filter(['de-DE', 'de-Latn-DE'], 'de-de')).toEqual(['de-DE', 'de-Latn-DE']);
    });
  });

  // RFC 4647 §3.3.2: empty result set when no tags match any range
  describe('when no tags match', () => {
    it('should return an empty array', () => {
      expect(filter(tags, 'ja')).toEqual([]);
    });
  });

  // RFC 4647 §3.3.2: empty input produces empty output
  describe('when tags array is empty', () => {
    it('should return an empty array', () => {
      expect(filter([], 'en')).toEqual([]);
    });
  });

  // RFC 4647 §3.3.2: empty ranges produce empty output
  describe('when ranges array is empty', () => {
    it('should return an empty array', () => {
      expect(filter(['en-US', 'fr-FR'], [])).toEqual([]);
    });
  });

  // RFC 4647 §3.3.2 step 3A: multiple wildcards in a range
  describe('when range contains multiple wildcards', () => {
    it('should skip each wildcard independently', () => {
      const result = filter(
        ['de-Latn-DE', 'de-DE', 'de-Latn-DE-1996'],
        'de-*-*-DE',
      );
      expect(result).toContain('de-Latn-DE');
      expect(result).toContain('de-Latn-DE-1996');
    });
  });
});

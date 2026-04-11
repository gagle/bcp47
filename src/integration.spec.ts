import { describe, it, expect, assert } from 'vitest';
import { parse } from './operators/parse/parse';
import { stringify } from './operators/stringify/stringify';
import { canonicalize } from './operators/canonicalize/canonicalize';
import { langtag } from './operators/langtag/langtag';
import { acceptLanguage } from './operators/accept-language/accept-language';
import { filter } from './operators/filter/filter';
import { lookup } from './operators/lookup/lookup';
import { extensionU, extensionT } from './operators/extension/extension';

// Cross-operator integration tests verifying BCP 47 end-to-end workflows
describe('integration', () => {
  // RFC 5646 §4.5 + RFC 6497: canonicalization preserves extension data
  // across extlang promotion, suppress-script, and deprecated replacement
  describe('when canonicalize preserves extension data', () => {
    it('should preserve t extension after extlang promotion', () => {
      const result = canonicalize('zh-cmn-t-it-m0-ungegn');
      expect(result).toBe('cmn-t-it-m0-ungegn');
      const tag = parse(result!);
      assert(tag !== null);
      expect(extensionT(tag)).toEqual({
        source: 'it',
        fields: { m0: 'ungegn' },
      });
    });

    it('should preserve u extension after deprecated language replacement', () => {
      const result = canonicalize('iw-u-ca-hebrew-nu-latn');
      expect(result).toBe('he-u-ca-hebrew-nu-latn');
      const tag = parse(result!);
      assert(tag !== null);
      expect(extensionU(tag)).toEqual({
        attributes: [],
        keywords: { ca: 'hebrew', nu: 'latn' },
      });
    });

    it('should preserve u extension after suppress-script removal', () => {
      const result = canonicalize('en-Latn-u-co-phonebk');
      expect(result).toBe('en-u-co-phonebk');
      const tag = parse(result!);
      assert(tag !== null);
      expect(extensionU(tag)).toEqual({
        attributes: [],
        keywords: { co: 'phonebk' },
      });
    });

    it('should preserve privateuse after deprecated region replacement', () => {
      const result = canonicalize('de-DD-x-internal');
      expect(result).toBe('de-DE-x-internal');
      const tag = parse(result!);
      assert(tag?.type === 'langtag');
      expect(tag.langtag.privateuse).toEqual(['internal']);
    });
  });

  // RFC 9110 §12.5.4 + RFC 4647 §3.4: content negotiation pipeline
  // Accept-Language header → extract tags → lookup against available content
  describe('when negotiating content language via lookup', () => {
    const availableTags = ['en', 'en-US', 'fr', 'de-DE', 'zh-Hans'];

    it('should find the best match from an Accept-Language header', () => {
      const preferences = acceptLanguage('fr-CA;q=0.9, en-US;q=0.8, de;q=0.5');
      const ranges = preferences.map((entry) => entry.tag);
      expect(lookup(availableTags, ranges)).toBe('fr');
    });

    it('should respect quality ordering when selecting match', () => {
      const preferences = acceptLanguage('de-DE;q=0.7, en-US;q=0.9, fr;q=0.8');
      const ranges = preferences.map((entry) => entry.tag);
      expect(lookup(availableTags, ranges)).toBe('en-US');
    });

    it('should return null when no Accept-Language tag matches', () => {
      const preferences = acceptLanguage('ja;q=0.9, ko;q=0.8');
      const ranges = preferences.map((entry) => entry.tag);
      expect(lookup(availableTags, ranges)).toBeNull();
    });

    it('should use default when no Accept-Language tag matches', () => {
      const preferences = acceptLanguage('ja;q=0.9');
      const ranges = preferences.map((entry) => entry.tag);
      expect(lookup(availableTags, ranges, 'en')).toBe('en');
    });
  });

  // RFC 9110 §12.5.4 + RFC 4647 §3.3.2: content negotiation pipeline
  // Accept-Language header → extract tags → filter available content
  describe('when negotiating content language via filter', () => {
    const availableTags = ['en-US', 'en-GB', 'fr-FR', 'fr-CA', 'de-DE'];

    it('should filter available tags by Accept-Language preferences', () => {
      const preferences = acceptLanguage('en;q=0.9, fr;q=0.8');
      const ranges = preferences.map((entry) => entry.tag);
      expect(filter(availableTags, ranges)).toEqual([
        'en-US', 'en-GB', 'fr-FR', 'fr-CA',
      ]);
    });

    it('should return matches ordered by preference priority', () => {
      const preferences = acceptLanguage('fr;q=0.9, en;q=0.8');
      const ranges = preferences.map((entry) => entry.tag);
      const result = filter(availableTags, ranges);
      expect(result[0]).toBe('fr-FR');
      expect(result[1]).toBe('fr-CA');
    });
  });

  // RFC 5646 §4.5 + RFC 4647 §3.4: canonicalized tags used in lookup
  describe('when looking up against canonicalized tags', () => {
    it('should match after canonicalizing deprecated available tags', () => {
      const rawTags = ['iw-IL', 'mo-MD', 'en-US'];
      const canonicalTags = rawTags.map((tag) => canonicalize(tag)!);
      expect(canonicalTags).toEqual(['he-IL', 'ro-MD', 'en-US']);
      expect(lookup(canonicalTags, 'he-IL')).toBe('he-IL');
      expect(lookup(canonicalTags, 'ro')).toBeNull();
      expect(lookup(canonicalTags, 'ro-MD')).toBe('ro-MD');
    });

    it('should match after canonicalizing redundant sign language tags', () => {
      const rawTags = ['sgn-US', 'sgn-JP', 'en'];
      const canonicalTags = rawTags.map((tag) => canonicalize(tag)!);
      expect(canonicalTags).toEqual(['ase', 'jsl', 'en']);
      expect(lookup(canonicalTags, 'ase')).toBe('ase');
    });
  });

  // RFC 5646 §4.5: full canonicalization pipeline with extension sorting
  describe('when canonicalize reorders multiple extensions', () => {
    it('should sort extension singletons and internal keywords together', () => {
      const result = canonicalize('zh-cmn-u-co-phonebk-ca-buddhist-a-foo');
      expect(result).toBe('cmn-a-foo-u-ca-buddhist-co-phonebk');
      const tag = parse(result!);
      assert(tag !== null);
      expect(extensionU(tag)).toEqual({
        attributes: [],
        keywords: { ca: 'buddhist', co: 'phonebk' },
      });
    });

    it('should sort t extension fields and u extension keywords independently', () => {
      const result = canonicalize('en-u-nu-latn-ca-buddhist-t-ja-m0-true-d0-fwidth');
      expect(result).toBe('en-t-ja-d0-fwidth-m0-true-u-ca-buddhist-nu-latn');
      const tag = parse(result!);
      assert(tag !== null);
      expect(extensionT(tag)).toEqual({
        source: 'ja',
        fields: { d0: 'fwidth', m0: 'true' },
      });
      expect(extensionU(tag)).toEqual({
        attributes: [],
        keywords: { ca: 'buddhist', nu: 'latn' },
      });
    });
  });

  // RFC 5646: langtag builder → stringify → canonicalize pipeline
  describe('when building tags that require canonicalization', () => {
    it('should canonicalize a builder-created tag with deprecated language', () => {
      const tag = langtag('iw', { region: 'IL' });
      const tagString = stringify(tag);
      expect(tagString).toBe('iw-IL');
      expect(canonicalize(tagString)).toBe('he-IL');
    });

    it('should canonicalize a builder-created tag with unsorted extensions', () => {
      const tag = langtag('en', {
        extension: [
          { singleton: 'u', subtags: ['ca', 'buddhist'] },
          { singleton: 'a', subtags: ['foo'] },
        ],
      });
      const tagString = stringify(tag);
      expect(canonicalize(tagString)).toBe('en-a-foo-u-ca-buddhist');
    });
  });
});

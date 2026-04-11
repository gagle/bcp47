import { describe, it, expect } from 'vitest';
import { parse } from '../parse/parse';
import { stringify } from './stringify';

// RFC 5646 §2.1: serializing a parsed BCP47Tag back to its string form
describe('stringify', () => {
  it('should roundtrip a simple language tag', () => {
    expect(stringify(parse('hy-Latn-IT-arevela')!)).toBe('hy-Latn-IT-arevela');
  });

  it('should roundtrip a tag with extensions', () => {
    expect(stringify(parse('aa-7-123abc-abc-a-12')!)).toBe(
      'aa-7-123abc-abc-a-12',
    );
  });

  it('should roundtrip a grandfathered irregular tag', () => {
    expect(stringify(parse('i-klingon')!)).toBe('i-klingon');
  });

  it('should roundtrip a grandfathered regular tag', () => {
    expect(stringify(parse('zh-min-nan')!)).toBe('zh-min-nan');
  });

  it('should roundtrip standalone privateuse with normalization', () => {
    expect(stringify(parse('x-111-aaaaa-BBB')!)).toBe('x-111-aaaaa-bbb');
  });

  it('should roundtrip a tag with all components', () => {
    const input =
      'aaa-bbb-ccc-ddd-abcd-123-abc123-0abc-b-01-abc123-x-01ab-abc12';
    expect(stringify(parse(input)!)).toBe(
      'aaa-bbb-ccc-ddd-Abcd-123-abc123-0abc-b-01-abc123-x-01ab-abc12',
    );
  });

  it('should roundtrip a tag with langtag privateuse', () => {
    expect(stringify(parse('aa-x-1234ab-d')!)).toBe('aa-x-1234ab-d');
  });

  // RFC 5646 §2.2.4: 3-digit region preserved without case transformation
  it('should roundtrip a tag with 3-digit region unchanged', () => {
    expect(stringify(parse('en-001')!)).toBe('en-001');
  });

  // RFC 5646 §2.1.1: grandfathered tags normalize to canonical case
  it('should normalize uppercase grandfathered tag to canonical case', () => {
    expect(stringify(parse('I-KLINGON')!)).toBe('i-klingon');
  });

  // RFC 5646 §2.1.1: case conventions applied independently of parse normalization
  describe('when normalizing case from manually constructed tags', () => {
    it('should lowercase language', () => {
      expect(stringify({
        type: 'langtag',
        langtag: { language: 'EN', extlang: [], script: null, region: null, variant: [], extension: [], privateuse: [] },
      })).toBe('en');
    });

    it('should lowercase extlang', () => {
      expect(stringify({
        type: 'langtag',
        langtag: { language: 'zh', extlang: ['CMN'], script: null, region: null, variant: [], extension: [], privateuse: [] },
      })).toBe('zh-cmn');
    });

    it('should titlecase script', () => {
      expect(stringify({
        type: 'langtag',
        langtag: { language: 'en', extlang: [], script: 'latn', region: null, variant: [], extension: [], privateuse: [] },
      })).toBe('en-Latn');
    });

    it('should uppercase 2-letter region', () => {
      expect(stringify({
        type: 'langtag',
        langtag: { language: 'en', extlang: [], script: null, region: 'us', variant: [], extension: [], privateuse: [] },
      })).toBe('en-US');
    });

    it('should preserve 3-digit region unchanged', () => {
      expect(stringify({
        type: 'langtag',
        langtag: { language: 'en', extlang: [], script: null, region: '001', variant: [], extension: [], privateuse: [] },
      })).toBe('en-001');
    });

    it('should lowercase variant', () => {
      expect(stringify({
        type: 'langtag',
        langtag: { language: 'en', extlang: [], script: null, region: null, variant: ['FONIPA'], extension: [], privateuse: [] },
      })).toBe('en-fonipa');
    });

    it('should lowercase extension singleton', () => {
      expect(stringify({
        type: 'langtag',
        langtag: { language: 'en', extlang: [], script: null, region: null, variant: [], extension: [{ singleton: 'A', subtags: ['foo'] }], privateuse: [] },
      })).toBe('en-a-foo');
    });

    it('should lowercase extension subtags', () => {
      expect(stringify({
        type: 'langtag',
        langtag: { language: 'en', extlang: [], script: null, region: null, variant: [], extension: [{ singleton: 'a', subtags: ['FOO'] }], privateuse: [] },
      })).toBe('en-a-foo');
    });

    it('should lowercase privateuse', () => {
      expect(stringify({
        type: 'langtag',
        langtag: { language: 'en', extlang: [], script: null, region: null, variant: [], extension: [], privateuse: ['FOO'] },
      })).toBe('en-x-foo');
    });
  });

  // RFC 5646 §2.1: parse(stringify(parse(x))) must equal parse(x) for all valid tags
  describe('when verifying roundtrip identity', () => {
    it.each([
      'en-US',
      'zh-cmn-Hans-CN',
      'sl-rozaj-biske',
      'de-DE-u-co-phonebk',
      'x-custom-tag',
      'i-klingon',
    ])('should satisfy roundtrip identity for %s', (input) => {
      const first = parse(input);
      const roundtripped = parse(stringify(first!));
      expect(roundtripped).toEqual(first);
    });
  });
});

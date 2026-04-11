// RFC 5646 §4.5 — Canonicalization of Language Tags (preferred values, suppress-script)
// https://www.rfc-editor.org/rfc/rfc5646#section-4.5

import type { BCP47Tag } from '../../types';
import { parse } from '../parse/parse';
import { stringify } from '../stringify/stringify';
import {
  DEPRECATED_LANGUAGES,
  DEPRECATED_REGIONS,
  DEPRECATED_VARIANTS,
  EXTLANG_PREFIXES,
  GRANDFATHERED_PREFERRED,
  REDUNDANT_PREFERRED,
  SUPPRESS_SCRIPTS,
} from '../../language-subtag-registry';

function canonicalizeTag(tag: BCP47Tag): BCP47Tag {
  if (tag.type !== 'langtag') {
    return tag;
  }

  let language = tag.langtag.language;
  let extlang: ReadonlyArray<string> = tag.langtag.extlang;
  let script = tag.langtag.script;
  let region = tag.langtag.region;

  const preferred = DEPRECATED_LANGUAGES[language];
  if (preferred) {
    language = preferred;
  }

  if (extlang.length > 0) {
    const prefix = EXTLANG_PREFIXES[extlang[0]!];
    if (prefix && prefix === language) {
      language = extlang[0]!;
      extlang = extlang.slice(1);
    }
  }

  if (script) {
    const suppressed = SUPPRESS_SCRIPTS[language];
    if (suppressed && suppressed === script) {
      script = null;
    }
  }

  if (region) {
    const preferredRegion = DEPRECATED_REGIONS[region];
    if (preferredRegion) {
      region = preferredRegion;
    }
  }

  if (region) {
    const redundantKey = `${language}-${region}`;
    const redundant = REDUNDANT_PREFERRED[redundantKey];
    if (redundant) {
      language = redundant;
      extlang = [];
      region = null;
    }
  }

  const variant = tag.langtag.variant.map((subtag) => {
    const preferredVariant = DEPRECATED_VARIANTS[subtag];
    return preferredVariant ?? subtag;
  });

  const canonicalizedExtensions = tag.langtag.extension.map((extension) => {
    if (extension.singleton === 'u') {
      return canonicalizeUExtension(extension);
    }
    if (extension.singleton === 't') {
      return canonicalizeTExtension(extension);
    }
    return extension;
  });

  const sorted = canonicalizedExtensions.length > 1
    ? [...canonicalizedExtensions].sort((left, right) => {
      if (left.singleton < right.singleton) {
        return -1;
      }
      if (left.singleton > right.singleton) {
        return 1;
      }
      return 0;
    })
    : canonicalizedExtensions;

  return {
    type: 'langtag',
    langtag: {
      ...tag.langtag,
      language,
      extlang,
      script,
      region,
      variant,
      extension: sorted,
    },
  };
}

const UKEY_RE = /^[a-z\d][a-z]$/;
const TKEY_RE = /^[a-z]\d$/;

function canonicalizeUExtension(extension: { readonly singleton: string; readonly subtags: ReadonlyArray<string> }): { readonly singleton: string; readonly subtags: ReadonlyArray<string> } {
  const attributes: Array<string> = [];
  const keywords: Array<{ key: string; values: Array<string> }> = [];
  let currentKey: string | null = null;
  let currentValues: Array<string> = [];

  for (const subtag of extension.subtags) {
    if (subtag.length === 2 && UKEY_RE.test(subtag)) {
      if (currentKey) {
        keywords.push({ key: currentKey, values: currentValues });
      }
      currentKey = subtag;
      currentValues = [];
    } else if (currentKey) {
      currentValues.push(subtag);
    } else {
      attributes.push(subtag);
    }
  }

  if (currentKey) {
    keywords.push({ key: currentKey, values: currentValues });
  }

  keywords.sort((left, right) => {
    if (left.key < right.key) {
      return -1;
    }
    if (left.key > right.key) {
      return 1;
    }
    return 0;
  });

  attributes.sort();

  const subtags: Array<string> = [...attributes];
  for (const keyword of keywords) {
    subtags.push(keyword.key, ...keyword.values);
  }

  return { singleton: extension.singleton, subtags };
}

function canonicalizeTExtension(extension: { readonly singleton: string; readonly subtags: ReadonlyArray<string> }): { readonly singleton: string; readonly subtags: ReadonlyArray<string> } {
  const sourceParts: Array<string> = [];
  const fields: Array<{ key: string; values: Array<string> }> = [];
  let currentKey: string | null = null;
  let currentValues: Array<string> = [];
  let inSource = true;

  for (const subtag of extension.subtags) {
    if (TKEY_RE.test(subtag)) {
      inSource = false;
      if (currentKey) {
        fields.push({ key: currentKey, values: currentValues });
      }
      currentKey = subtag;
      currentValues = [];
    } else if (inSource) {
      sourceParts.push(subtag);
    } else {
      currentValues.push(subtag);
    }
  }

  if (currentKey) {
    fields.push({ key: currentKey, values: currentValues });
  }

  fields.sort((left, right) => {
    if (left.key < right.key) {
      return -1;
    }
    if (left.key > right.key) {
      return 1;
    }
    return 0;
  });

  const subtags: Array<string> = [...sourceParts];
  for (const field of fields) {
    subtags.push(field.key, ...field.values);
  }

  return { singleton: extension.singleton, subtags };
}

/** Canonicalize a BCP 47 tag per RFC 5646 §4.5 (case, deprecated subtags, suppress-script, extlang). Returns `null` for invalid input. */
export function canonicalize(tag: string): string | null {
  const parsed = parse(tag);
  if (!parsed) {
    return null;
  }

  if (parsed.type === 'grandfathered') {
    const preferred = GRANDFATHERED_PREFERRED[parsed.grandfathered.tag.toLowerCase()];
    if (preferred) {
      return canonicalize(preferred);
    }
    return stringify(parsed);
  }

  return stringify(canonicalizeTag(parsed));
}

// RFC 6067 — BCP 47 Extension U (Unicode Locale Extensions)
// RFC 6497 — BCP 47 Extension T (Transformed Content)
// https://www.rfc-editor.org/rfc/rfc6067
// https://www.rfc-editor.org/rfc/rfc6497

import type { BCP47Tag } from '../../types';

export interface BCP47ExtensionU {
  readonly attributes: ReadonlyArray<string>;
  readonly keywords: Record<string, string>;
}

export interface BCP47ExtensionT {
  readonly source: string | null;
  readonly fields: Record<string, string>;
}

const TKEY_RE = /^[a-z]\d$/i;
const UKEY_RE = /^[a-z\d][a-z]$/i;

function isUnicodeKey(subtag: string): boolean {
  return subtag.length === 2 && UKEY_RE.test(subtag);
}

/** Extract Unicode locale attributes and keywords from the `u` extension (RFC 6067). Returns `null` if absent. */
export function extensionU(tag: BCP47Tag): BCP47ExtensionU | null {
  if (tag.type !== 'langtag') {
    return null;
  }

  const uExtension = tag.langtag.extension.find(
    (entry) => entry.singleton === 'u'
  );
  if (!uExtension) {
    return null;
  }

  const attributes: Array<string> = [];
  const attributesSeen = new Set<string>();
  const keywords: Record<string, string> = {};
  let currentKey: string | null = null;
  let currentValues: Array<string> = [];

  for (const subtag of uExtension.subtags) {
    if (isUnicodeKey(subtag)) {
      if (currentKey && !(currentKey in keywords)) {
        keywords[currentKey] = currentValues.join('-');
      }
      currentKey = subtag;
      currentValues = [];
    } else if (currentKey) {
      currentValues.push(subtag);
    } else if (!attributesSeen.has(subtag)) {
      attributesSeen.add(subtag);
      attributes.push(subtag);
    }
  }

  if (currentKey && !(currentKey in keywords)) {
    keywords[currentKey] = currentValues.join('-');
  }

  return { attributes, keywords };
}

/** Extract transformed content data from the `t` extension (RFC 6497). Returns `null` if absent. */
export function extensionT(tag: BCP47Tag): BCP47ExtensionT | null {
  if (tag.type !== 'langtag') {
    return null;
  }

  const tExtension = tag.langtag.extension.find(
    (entry) => entry.singleton === 't'
  );
  if (!tExtension) {
    return null;
  }

  const sourceParts: Array<string> = [];
  const fields: Record<string, string> = {};
  let currentKey: string | null = null;
  let currentValues: Array<string> = [];
  let inSource = true;

  for (const subtag of tExtension.subtags) {
    if (TKEY_RE.test(subtag)) {
      inSource = false;
      if (currentKey && !(currentKey in fields)) {
        fields[currentKey] = currentValues.join('-');
      }
      currentKey = subtag;
      currentValues = [];
    } else if (inSource) {
      sourceParts.push(subtag);
    } else {
      currentValues.push(subtag);
    }
  }

  if (currentKey && !(currentKey in fields)) {
    fields[currentKey] = currentValues.join('-');
  }

  return {
    source: sourceParts.length > 0 ? sourceParts.join('-') : null,
    fields,
  };
}

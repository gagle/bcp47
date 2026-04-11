// RFC 5646 §2.1.1 — Formatting of Language Tags (case conventions)
// https://www.rfc-editor.org/rfc/rfc5646#section-2.1.1

import type { BCP47Tag } from '../../types';
import { titleCase } from '../../utilities';

/** Convert a parsed `BCP47Tag` object back into a well-formed language tag string. */
export function stringify(tag: BCP47Tag): string {
  switch (tag.type) {
    case 'grandfathered':
      return tag.grandfathered.tag;

    case 'privateuse':
      return 'x-' + tag.privateuse.map((subtag) => subtag.toLowerCase()).join('-');

    case 'langtag': {
      const parts: Array<string> = [];

      parts.push(tag.langtag.language.toLowerCase());
      for (const subtag of tag.langtag.extlang) {
        parts.push(subtag.toLowerCase());
      }

      if (tag.langtag.script) {
        parts.push(titleCase(tag.langtag.script));
      }

      if (tag.langtag.region) {
        parts.push(tag.langtag.region.toUpperCase());
      }

      for (const subtag of tag.langtag.variant) {
        parts.push(subtag.toLowerCase());
      }

      for (const extension of tag.langtag.extension) {
        parts.push(extension.singleton.toLowerCase());
        for (const subtag of extension.subtags) {
          parts.push(subtag.toLowerCase());
        }
      }

      if (tag.langtag.privateuse.length > 0) {
        parts.push('x');
        for (const subtag of tag.langtag.privateuse) {
          parts.push(subtag.toLowerCase());
        }
      }

      return parts.join('-');
    }
  }
}

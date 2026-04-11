// RFC 5646 §2.1 — Syntax (ABNF grammar for Language-Tag)
// https://www.rfc-editor.org/rfc/rfc5646#section-2.1

import type { BCP47Extension, BCP47Tag } from '../../types';
import { titleCase } from '../../utilities';

const IRREGULAR_GRANDFATHERED: Record<string, string> = {
  'en-gb-oed': 'en-GB-oed',
  'i-ami': 'i-ami',
  'i-bnn': 'i-bnn',
  'i-default': 'i-default',
  'i-enochian': 'i-enochian',
  'i-hak': 'i-hak',
  'i-klingon': 'i-klingon',
  'i-lux': 'i-lux',
  'i-mingo': 'i-mingo',
  'i-navajo': 'i-navajo',
  'i-pwn': 'i-pwn',
  'i-tao': 'i-tao',
  'i-tay': 'i-tay',
  'i-tsu': 'i-tsu',
  'sgn-be-fr': 'sgn-BE-FR',
  'sgn-be-nl': 'sgn-BE-NL',
  'sgn-ch-de': 'sgn-CH-DE',
};

const REGULAR_GRANDFATHERED: Record<string, string> = {
  'art-lojban': 'art-lojban',
  'cel-gaulish': 'cel-gaulish',
  'no-bok': 'no-bok',
  'no-nyn': 'no-nyn',
  'zh-guoyu': 'zh-guoyu',
  'zh-hakka': 'zh-hakka',
  'zh-min': 'zh-min',
  'zh-min-nan': 'zh-min-nan',
  'zh-xiang': 'zh-xiang',
};

const LANGTAG_RE = /^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|\d{3}))?((?:-(?:[\da-z]{5,8}|\d[\da-z]{3}))*)?((?:-[\da-wy-z](?:-[\da-z]{2,8})+)*)?(-x(?:-[\da-z]{1,8})+)?$|^(x(?:-[\da-z]{1,8})+)$/i;

/*
/
^
  (?:
    (
      en-GB-oed | i-ami | i-bnn | i-default | i-enochian | i-hak | i-klingon |
      i-lux | i-mingo | i-navajo | i-pwn | i-tao | i-tay | i-tsu | sgn-BE-FR |
      sgn-BE-NL | sgn-CH-DE
    ) |
    (
      art-lojban | cel-gaulish | no-bok | no-nyn | zh-guoyu | zh-hakka |
      zh-min | zh-min-nan | zh-xiang
    )
  )
$
|
^
  (
    (?:
      [a-z]{2,3}
      (?:
        (?:
          -[a-z]{3}
        ){1,3}
      )?
    ) |
    [a-z]{4} |
    [a-z]{5,8}
  )
  (?:
    -
    (
      [a-z]{4}
    )
  )?
  (?:
    -
    (
      [a-z]{2} |
      \d{3}
    )
  )?
  (
    (?:
      -
      (?:
        [\da-z]{5,8} |
        \d[\da-z]{3}
      )
    )*
  )?
  (
    (?:
      -
      [\da-wy-z]
      (?:
        -[\da-z]{2,8}
      )+
    )*
  )?
  (
    -x
    (?:
      -[\da-z]{1,8}
    )+
  )?
$
|
^
  (
    x
    (?:
      -[\da-z]{1,8}
    )+
  )
$
/i
*/

function splitSubtags(raw: string): Array<string> {
  const parts = raw.split('-');
  parts.shift();
  return parts.map((subtag) => subtag.toLowerCase());
}

function hasDuplicates(subtags: ReadonlyArray<string>): boolean {
  const seen = new Set<string>();
  for (const subtag of subtags) {
    if (seen.has(subtag)) {
      return true;
    }
    seen.add(subtag);
  }
  return false;
}

function parseLanguageAndExtlang(raw: string): { language: string; extlang: Array<string> } {
  const parts = raw.split('-');
  const language = parts.shift()!.toLowerCase();
  const extlang = parts.map((subtag) => subtag.toLowerCase());
  return { language, extlang };
}

function parseExtensions(raw: string): Array<BCP47Extension> | null {
  const tokens = raw.split('-');
  tokens.shift();

  const result: Array<BCP47Extension> = [];
  const singletonsSeen = new Set<string>();
  let currentSingleton: string | undefined;
  let currentSubtags: Array<string> = [];

  for (const token of tokens) {
    if (token.length === 1) {
      if (currentSingleton) {
        result.push({
          singleton: currentSingleton.toLowerCase(),
          subtags: currentSubtags.map((subtag) => subtag.toLowerCase())
        });
      }
      const lower = token.toLowerCase();
      if (singletonsSeen.has(lower)) {
        return null;
      }
      singletonsSeen.add(lower);
      currentSingleton = token;
      currentSubtags = [];
    } else {
      currentSubtags.push(token);
    }
  }

  // Guaranteed by regex: extension always starts with a singleton
  result.push({
    singleton: currentSingleton!.toLowerCase(),
    subtags: currentSubtags.map((subtag) => subtag.toLowerCase())
  });

  return result;
}

/** Parse a BCP 47 language tag string into a structured object. Returns `null` for invalid input. */
export function parse(tag: string): BCP47Tag | null {
  const match = LANGTAG_RE.exec(tag);
  if (!match) {
    return null;
  }

  match.shift();
  const [
    irregular, regular, languageGroup, script, region,
    variantGroup, extensionGroup, langPrivateuseGroup, standalonePrivateuseGroup
  ] = match;

  if (irregular) {
    return {
      type: 'grandfathered',
      grandfathered: {
        type: 'irregular',
        tag: IRREGULAR_GRANDFATHERED[irregular.toLowerCase()]!
      }
    };
  }

  if (regular) {
    return {
      type: 'grandfathered',
      grandfathered: {
        type: 'regular',
        tag: REGULAR_GRANDFATHERED[regular.toLowerCase()]!
      }
    };
  }

  if (standalonePrivateuseGroup) {
    const parts = standalonePrivateuseGroup.split('-');
    parts.shift();
    return {
      type: 'privateuse',
      privateuse: parts.map((subtag) => subtag.toLowerCase())
    };
  }

  // Guaranteed by regex: if not grandfathered or standalone privateuse, languageGroup exists
  const { language, extlang } = parseLanguageAndExtlang(languageGroup!);

  const variant = variantGroup ? splitSubtags(variantGroup) : [];
  if (hasDuplicates(variant)) {
    return null;
  }

  const extension = extensionGroup ? parseExtensions(extensionGroup) : [];
  if (!extension) {
    return null;
  }

  return {
    type: 'langtag',
    langtag: {
      language,
      extlang,
      script: script ? titleCase(script) : null,
      region: region ? region.toUpperCase() : null,
      variant,
      extension,
      privateuse: langPrivateuseGroup ? splitSubtags(langPrivateuseGroup).slice(1) : []
    }
  };
}

import type { BCP47Extension, BCP47Tag } from '../../types';
import { titleCase } from '../../utilities';

export interface LangtagOptions {
  readonly extlang?: ReadonlyArray<string>;
  readonly script?: string;
  readonly region?: string;
  readonly variant?: ReadonlyArray<string>;
  readonly extension?: ReadonlyArray<BCP47Extension>;
  readonly privateuse?: ReadonlyArray<string>;
}

const LANGUAGE_RE = /^[a-z]{2,8}$/i;
const EXTLANG_RE = /^[a-z]{3}$/i;
const SCRIPT_RE = /^[a-z]{4}$/i;
const REGION_RE = /^(?:[a-z]{2}|\d{3})$/i;
const VARIANT_RE = /^(?:[\da-z]{5,8}|\d[\da-z]{3})$/i;
const SINGLETON_RE = /^[\da-wy-z]$/i;
const EXTENSION_SUBTAG_RE = /^[\da-z]{2,8}$/i;
const PRIVATEUSE_RE = /^[\da-z]{1,8}$/i;

function validate(condition: boolean, message: string): void {
  if (!condition) {
    throw new RangeError(message);
  }
}

/** Build a `BCP47Tag` from parts with sensible defaults. Throws `RangeError` on invalid input. */
export function langtag(language: string, options?: LangtagOptions): BCP47Tag {
  validate(LANGUAGE_RE.test(language), `Invalid language: '${language}'`);

  const extlang = options?.extlang ?? [];
  if (extlang.length > 0) {
    validate(language.length <= 3, `Extlang is only valid with 2-3 character language subtags, got '${language}'`);
  }
  for (const subtag of extlang) {
    validate(EXTLANG_RE.test(subtag), `Invalid extlang: '${subtag}'`);
  }
  validate(extlang.length <= 3, `Too many extlang subtags: ${extlang.length} (max 3)`);

  if (options?.script !== undefined) {
    validate(SCRIPT_RE.test(options.script), `Invalid script: '${options.script}'`);
  }

  if (options?.region !== undefined) {
    validate(REGION_RE.test(options.region), `Invalid region: '${options.region}'`);
  }

  const variant = options?.variant ?? [];
  const variantsSeen = new Set<string>();
  for (const subtag of variant) {
    validate(VARIANT_RE.test(subtag), `Invalid variant: '${subtag}'`);
    const lower = subtag.toLowerCase();
    validate(!variantsSeen.has(lower), `Duplicate variant: '${subtag}'`);
    variantsSeen.add(lower);
  }

  const extension = options?.extension ?? [];
  const singletons = new Set<string>();
  for (const entry of extension) {
    validate(SINGLETON_RE.test(entry.singleton), `Invalid extension singleton: '${entry.singleton}'`);
    const lower = entry.singleton.toLowerCase();
    validate(!singletons.has(lower), `Duplicate extension singleton: '${entry.singleton}'`);
    singletons.add(lower);
    validate(entry.subtags.length > 0, `Extension '${entry.singleton}' must have at least one subtag`);
    for (const subtag of entry.subtags) {
      validate(EXTENSION_SUBTAG_RE.test(subtag), `Invalid extension subtag: '${subtag}'`);
    }
  }

  const privateuse = options?.privateuse ?? [];
  for (const subtag of privateuse) {
    validate(PRIVATEUSE_RE.test(subtag), `Invalid privateuse subtag: '${subtag}'`);
  }

  return {
    type: 'langtag',
    langtag: {
      language: language.toLowerCase(),
      extlang: extlang.map((subtag) => subtag.toLowerCase()),
      script: options?.script ? titleCase(options.script) : null,
      region: options?.region ? options.region.toUpperCase() : null,
      variant: variant.map((subtag) => subtag.toLowerCase()),
      extension: extension.map((entry) => ({
        singleton: entry.singleton.toLowerCase(),
        subtags: entry.subtags.map((subtag) => subtag.toLowerCase()),
      })),
      privateuse: privateuse.map((subtag) => subtag.toLowerCase()),
    }
  };
}

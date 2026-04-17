//#region src/types.d.ts
interface BCP47Extension {
  readonly singleton: string;
  readonly subtags: ReadonlyArray<string>;
}
interface BCP47Langtag {
  readonly language: string;
  readonly extlang: ReadonlyArray<string>;
  readonly script: string | null;
  readonly region: string | null;
  readonly variant: ReadonlyArray<string>;
  readonly extension: ReadonlyArray<BCP47Extension>;
  readonly privateuse: ReadonlyArray<string>;
}
type BCP47Grandfathered = {
  readonly type: 'irregular';
  readonly tag: string;
} | {
  readonly type: 'regular';
  readonly tag: string;
};
type BCP47Tag = {
  readonly type: 'langtag';
  readonly langtag: BCP47Langtag;
} | {
  readonly type: 'privateuse';
  readonly privateuse: ReadonlyArray<string>;
} | {
  readonly type: 'grandfathered';
  readonly grandfathered: BCP47Grandfathered;
};
//#endregion
//#region src/operators/parse/parse.d.ts
/** Parse a BCP 47 language tag string into a structured object. Returns `null` for invalid input. */
declare function parse(tag: string): BCP47Tag | null;
//#endregion
//#region src/operators/stringify/stringify.d.ts
/** Convert a parsed `BCP47Tag` object back into a well-formed language tag string. */
declare function stringify(tag: BCP47Tag): string;
//#endregion
//#region src/operators/langtag/langtag.d.ts
interface LangtagOptions {
  readonly extlang?: ReadonlyArray<string>;
  readonly script?: string;
  readonly region?: string;
  readonly variant?: ReadonlyArray<string>;
  readonly extension?: ReadonlyArray<BCP47Extension>;
  readonly privateuse?: ReadonlyArray<string>;
}
/** Build a `BCP47Tag` from parts with sensible defaults. Throws `RangeError` on invalid input. */
declare function langtag(language: string, options?: LangtagOptions): BCP47Tag;
//#endregion
//#region src/operators/canonicalize/canonicalize.d.ts
/** Canonicalize a BCP 47 tag per RFC 5646 §4.5 (case, deprecated subtags, suppress-script, extlang). Returns `null` for invalid input. */
declare function canonicalize(tag: string): string | null;
//#endregion
//#region src/operators/filter/filter.d.ts
/** Find all matching tags via Extended Filtering per RFC 4647 §3.3.2. Supports `*` wildcards. */
declare function filter(tags: ReadonlyArray<string>, patterns: ReadonlyArray<string> | string): Array<string>;
//#endregion
//#region src/operators/lookup/lookup.d.ts
/** Find the single best matching tag via Lookup per RFC 4647 §3.4. Returns first match, `defaultValue`, or `null`. */
declare function lookup(tags: ReadonlyArray<string>, preferences: ReadonlyArray<string> | string, defaultValue?: string): string | null;
//#endregion
//#region src/operators/extension/extension.d.ts
interface BCP47ExtensionU {
  readonly attributes: ReadonlyArray<string>;
  readonly keywords: Record<string, string>;
}
interface BCP47ExtensionT {
  readonly source: string | null;
  readonly fields: Record<string, string>;
}
/** Extract Unicode locale attributes and keywords from the `u` extension (RFC 6067). Returns `null` if absent. */
declare function extensionU(tag: BCP47Tag): BCP47ExtensionU | null;
/** Extract transformed content data from the `t` extension (RFC 6497). Returns `null` if absent. */
declare function extensionT(tag: BCP47Tag): BCP47ExtensionT | null;
//#endregion
//#region src/operators/extension/cldr-keys.d.ts
declare const UNICODE_LOCALE_KEYS: {
  readonly ca: "Calendar";
  readonly cf: "Currency format";
  readonly co: "Collation";
  readonly cu: "Currency";
  readonly dx: "Dictionary break exclusions";
  readonly em: "Emoji presentation";
  readonly fw: "First day of week";
  readonly hc: "Hour cycle";
  readonly ka: "Collation alternate handling";
  readonly kb: "Collation backward sorting";
  readonly kc: "Collation case level";
  readonly kf: "Collation case first";
  readonly kk: "Collation normalization";
  readonly kn: "Collation numeric ordering";
  readonly kr: "Collation reorder";
  readonly ks: "Collation strength";
  readonly kv: "Collation max variable";
  readonly lb: "Line break";
  readonly lw: "Word break";
  readonly ms: "Measurement system";
  readonly mu: "Measurement unit";
  readonly nu: "Numbering system";
  readonly rg: "Region override";
  readonly sd: "Subdivision";
  readonly ss: "Sentence break suppressions";
  readonly tz: "Timezone";
  readonly va: "Common variant";
};
declare const TRANSFORM_KEYS: {
  readonly d0: "Transform destination";
  readonly h0: "Hybrid locale";
  readonly i0: "Input method";
  readonly k0: "Keyboard";
  readonly m0: "Transform mechanism";
  readonly s0: "Transform source";
  readonly t0: "Machine translation";
  readonly x0: "Private use transform";
};
//#endregion
//#region src/operators/accept-language/accept-language.d.ts
interface AcceptLanguage {
  readonly tag: string;
  readonly quality: number;
}
/** Parse an `Accept-Language` header into entries sorted by quality descending (RFC 9110 §12.5.4). */
declare function acceptLanguage(header: string): ReadonlyArray<AcceptLanguage>;
//#endregion
export { type AcceptLanguage, type BCP47Extension, type BCP47ExtensionT, type BCP47ExtensionU, type BCP47Grandfathered, type BCP47Langtag, type BCP47Tag, type LangtagOptions, TRANSFORM_KEYS, UNICODE_LOCALE_KEYS, acceptLanguage, canonicalize, extensionT, extensionU, filter, langtag, lookup, parse, stringify };
//# sourceMappingURL=index.d.mts.map
// RFC 9110 §12.5.4 — Accept-Language (weight: §12.4.2)
// https://www.rfc-editor.org/rfc/rfc9110#section-12.5.4

export interface AcceptLanguage {
  readonly tag: string;
  readonly quality: number;
}

// RFC 9110 §12.4.2: qvalue = ( "0" [ "." 0*3DIGIT ] ) / ( "1" [ "." 0*3("0") ] )
const QUALITY_RE = /;\s*q=(0(?:\.\d{0,3})?|1(?:\.0{0,3})?)(?:\s*$|\s*,|\s*;)/i;
const HAS_QUALITY_PARAM_RE = /;\s*q=/i;
const SEMICOLON_PARAMS_RE = /;.*/;
const LANGUAGE_RANGE_RE = /^(?:\*|[a-z]{1,8}(?:-[a-z\d]{1,8})*)$/i;

/** Parse an `Accept-Language` header into entries sorted by quality descending (RFC 9110 §12.5.4). */
export function acceptLanguage(header: string): ReadonlyArray<AcceptLanguage> {
  if (!header.trim()) {
    return [];
  }

  const entries: Array<AcceptLanguage> = [];

  for (const segment of header.split(',')) {
    const trimmed = segment.trim();
    if (!trimmed) {
      continue;
    }

    const tag = trimmed.replace(SEMICOLON_PARAMS_RE, '').trim();
    if (!tag || !LANGUAGE_RANGE_RE.test(tag)) {
      continue;
    }

    const qualityMatch = QUALITY_RE.exec(trimmed);
    if (!qualityMatch && HAS_QUALITY_PARAM_RE.test(trimmed)) {
      continue;
    }
    const quality = qualityMatch ? parseFloat(qualityMatch[1]!) : 1.0;

    entries.push({ tag, quality });
  }

  entries.sort((left, right) => right.quality - left.quality);

  return entries;
}

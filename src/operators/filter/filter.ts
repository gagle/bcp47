// RFC 4647 §3.3.2 — Extended Filtering
// https://www.rfc-editor.org/rfc/rfc4647#section-3.3.2


function matchSubtags(rangeSubtags: ReadonlyArray<string>, tagSubtags: ReadonlyArray<string>): boolean {
  let rangeIndex = 0;
  let tagIndex = 0;

  if (rangeSubtags[0] !== '*' && rangeSubtags[0]!.toLowerCase() !== tagSubtags[0]!.toLowerCase()) {
    return false;
  }
  rangeIndex++;
  tagIndex++;

  while (rangeIndex < rangeSubtags.length) {
    const rangeSubtag = rangeSubtags[rangeIndex]!;

    if (rangeSubtag === '*') {
      rangeIndex++;
      continue;
    }

    if (tagIndex >= tagSubtags.length) {
      return false;
    }

    const tagSubtag = tagSubtags[tagIndex]!;

    if (rangeSubtag.toLowerCase() === tagSubtag.toLowerCase()) {
      rangeIndex++;
      tagIndex++;
      continue;
    }

    if (tagSubtag.length === 1) {
      return false;
    }

    tagIndex++;
  }

  return true;
}

/** Find all matching tags via Extended Filtering per RFC 4647 §3.3.2. Supports `*` wildcards. */
export function filter(
  tags: ReadonlyArray<string>,
  patterns: ReadonlyArray<string> | string,
): Array<string> {
  const rangeList = typeof patterns === 'string' ? [patterns] : patterns;
  const results: Array<string> = [];
  const seen = new Set<string>();

  for (const range of rangeList) {
    if (range === '*') {
      for (const tag of tags) {
        const lower = tag.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          results.push(tag);
        }
      }
      continue;
    }

    const rangeSubtags = range.split('-');
    for (const tag of tags) {
      const tagLower = tag.toLowerCase();
      if (seen.has(tagLower)) {
        continue;
      }

      if (matchSubtags(rangeSubtags, tag.split('-'))) {
        seen.add(tagLower);
        results.push(tag);
      }
    }
  }

  return results;
}

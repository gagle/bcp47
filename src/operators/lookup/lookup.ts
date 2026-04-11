// RFC 4647 §3.4 — Lookup
// https://www.rfc-editor.org/rfc/rfc4647#section-3.4

function truncate(subtags: Array<string>): Array<string> {
  subtags.pop();
  while (subtags.length > 0 && subtags[subtags.length - 1]!.length === 1) {
    subtags.pop();
  }
  return subtags;
}

/** Find the single best matching tag via Lookup per RFC 4647 §3.4. Returns first match, `defaultValue`, or `null`. */
export function lookup(
  tags: ReadonlyArray<string>,
  preferences: ReadonlyArray<string> | string,
  defaultValue?: string,
): string | null {
  const rangeList = typeof preferences === 'string' ? [preferences] : preferences;
  const tagMap = new Map<string, string>();
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (!tagMap.has(lower)) {
      tagMap.set(lower, tag);
    }
  }

  for (const range of rangeList) {
    if (range === '*') {
      continue;
    }

    let subtags = range.split('-');
    while (subtags.length > 0) {
      const candidate = subtags.join('-').toLowerCase();
      const matched = tagMap.get(candidate);
      if (matched) {
        return matched;
      }
      subtags = truncate(subtags);
    }
  }

  return defaultValue ?? null;
}

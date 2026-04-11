// CLDR BCP 47 Unicode locale extension keys
// Source: https://github.com/unicode-org/cldr/tree/main/common/bcp47
export const UNICODE_LOCALE_KEYS = {
  ca: 'Calendar',
  cf: 'Currency format',
  co: 'Collation',
  cu: 'Currency',
  dx: 'Dictionary break exclusions',
  em: 'Emoji presentation',
  fw: 'First day of week',
  hc: 'Hour cycle',
  ka: 'Collation alternate handling',
  kb: 'Collation backward sorting',
  kc: 'Collation case level',
  kf: 'Collation case first',
  kk: 'Collation normalization',
  kn: 'Collation numeric ordering',
  kr: 'Collation reorder',
  ks: 'Collation strength',
  kv: 'Collation max variable',
  lb: 'Line break',
  lw: 'Word break',
  ms: 'Measurement system',
  mu: 'Measurement unit',
  nu: 'Numbering system',
  rg: 'Region override',
  sd: 'Subdivision',
  ss: 'Sentence break suppressions',
  tz: 'Timezone',
  va: 'Common variant',
} as const satisfies Record<string, string>;

// CLDR BCP 47 transformed content extension keys
// Source: https://github.com/unicode-org/cldr/tree/main/common/bcp47
export const TRANSFORM_KEYS = {
  d0: 'Transform destination',
  h0: 'Hybrid locale',
  i0: 'Input method',
  k0: 'Keyboard',
  m0: 'Transform mechanism',
  s0: 'Transform source',
  t0: 'Machine translation',
  x0: 'Private use transform',
} as const satisfies Record<string, string>;

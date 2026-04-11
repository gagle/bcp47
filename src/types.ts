export interface BCP47Extension {
  readonly singleton: string;
  readonly subtags: ReadonlyArray<string>;
}

export interface BCP47Langtag {
  readonly language: string;
  readonly extlang: ReadonlyArray<string>;
  readonly script: string | null;
  readonly region: string | null;
  readonly variant: ReadonlyArray<string>;
  readonly extension: ReadonlyArray<BCP47Extension>;
  readonly privateuse: ReadonlyArray<string>;
}

export type BCP47Grandfathered =
  | { readonly type: 'irregular'; readonly tag: string }
  | { readonly type: 'regular'; readonly tag: string };

export type BCP47Tag =
  | { readonly type: 'langtag'; readonly langtag: BCP47Langtag }
  | { readonly type: 'privateuse'; readonly privateuse: ReadonlyArray<string> }
  | { readonly type: 'grandfathered'; readonly grandfathered: BCP47Grandfathered };

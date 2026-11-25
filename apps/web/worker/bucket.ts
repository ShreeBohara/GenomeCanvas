// The part of Cloudflare's R2Bucket binding that the release route uses. Written
// out here, not taken from @cloudflare/workers-types, so the route depends only
// on what it calls and a test can stand in for the bucket with a plain object.

export interface ReleaseObjectHead {
  readonly size: number;
  /** The entity tag, already quoted, as it goes in an ETag header. */
  readonly httpEtag: string;
}

export interface ReleaseObjectBody extends ReleaseObjectHead {
  readonly body: ReadableStream<Uint8Array>;
}

export interface ReleaseBucket {
  head(key: string): Promise<ReleaseObjectHead | null>;
  get(
    key: string,
    options?: { readonly range?: { readonly offset: number; readonly length: number } },
  ): Promise<ReleaseObjectBody | null>;
}

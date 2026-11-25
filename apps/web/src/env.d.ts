interface ImportMetaEnv {
  /** Where the release folder is, absolute or relative to the page. Defaults to the sample release. */
  readonly VITE_RELEASE_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

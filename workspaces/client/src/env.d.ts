/// <reference types="@rsbuild/core/types" />

interface RsbuildTypeOptions {
  strictImportMetaEnv: true;
}

interface ImportMetaEnv {
  readonly API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

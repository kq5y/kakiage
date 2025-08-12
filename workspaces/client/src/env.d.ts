/// <reference types="@rsbuild/core/types" />

interface RsbuildTypeOptions {
  strictImportMetaEnv: true;
}

interface ImportMetaEnv {
  readonly PUBLIC_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

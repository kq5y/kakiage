/// <reference types="vite/client" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string; // e.g. http://<PI_IP>:8080
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

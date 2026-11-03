import type { NextConfig } from 'next';

const config: NextConfig = {
  // driver nativo do SQLite: não deve ser empacotado pelo bundler
  serverExternalPackages: ['@libsql/client', 'libsql'],
};

export default config;

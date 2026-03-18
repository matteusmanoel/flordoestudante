import type { Config } from 'tailwindcss';

/**
 * Config base compartilhada. Cada app pode estender e sobrescrever content/paths.
 */
const config: Config = {
  content: [],
  theme: { extend: {} },
  plugins: [],
};

export default config;

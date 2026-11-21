import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const config = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Illustrations are static SVG files and the logo is a small PNG; next/image adds nothing here.
      '@next/next/no-img-element': 'off',
    },
  },
  {
    // Rendered outside the locale layout / router context: plain anchors are intentional.
    files: ['src/app/not-found.tsx', 'src/app/[[]locale[]]/error.tsx'],
    rules: { '@next/next/no-html-link-for-pages': 'off' },
  },
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'playwright-report/**', 'test-results/**', 'input-assets/**', '.pgdata/**'] },
];
export default config;

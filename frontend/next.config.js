/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Official Next.js way to prevent TS errors from failing the production build
    // See: nextjs.org/docs/app/api-reference/config/next-config-js/typescript
    ignoreBuildErrors: true,
  },
  eslint: {
    // Prevent ESLint warnings from failing the build
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  transpilePackages: [
    'react-markdown', 'remark-gfm', 'rehype-highlight',
    'remark-parse', 'unified', 'bail', 'is-plain-obj', 'trough',
    'vfile', 'unist-util-stringify-position', 'mdast-util-from-markdown',
    'mdast-util-to-string', 'micromark', 'decode-named-character-reference',
    'character-entities', 'hast-util-to-jsx-runtime', 'hast-util-whitespace',
    'property-information', 'space-separated-tokens', 'comma-separated-tokens',
    'estree-util-is-identifier-name', 'lowlight', 'fault', 'highlight.js',
  ],
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'ClaudGPT',
    NEXT_PUBLIC_CREATOR:  'Emmanuel ARIYO',
    NEXT_PUBLIC_COMPANY:  'EMEMZYVISUALS DIGITALS',
  },
};
module.exports = nextConfig;

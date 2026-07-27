/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
const repositoryName = 'Wellness-Companion';
const basePath = isGitHubPages ? `/${repositoryName}` : '';

const nextConfig = {
  reactStrictMode: true,
  output: isGitHubPages ? 'export' : undefined,
  basePath,
  assetPrefix: basePath,
  trailingSlash: isGitHubPages,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_STATIC_EXPORT: isGitHubPages ? 'true' : 'false',
    NEXT_PUBLIC_MEALDB_KEY: process.env.NEXT_PUBLIC_MEALDB_KEY || '1',
  },
};

module.exports = nextConfig;

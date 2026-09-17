import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isGitHubPages ? '/atlas-dos-assassinatos-multiplos' : '',
  assetPrefix: isGitHubPages ? '/atlas-dos-assassinatos-multiplos/' : '',
  env: { NEXT_PUBLIC_BASE_PATH: isGitHubPages ? '/atlas-dos-assassinatos-multiplos' : '' },
  images: { unoptimized: true },
};

export default nextConfig;

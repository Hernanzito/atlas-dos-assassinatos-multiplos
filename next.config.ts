import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isGitHubPages ? '/atlas-urbano-leaflet' : '',
  assetPrefix: isGitHubPages ? '/atlas-urbano-leaflet/' : '',
  images: { unoptimized: true },
};

export default nextConfig;

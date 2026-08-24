/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable response compression
  compress: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sngs-matrimonial.s3.ap-south-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'sngs-matrimonial-prod.s3.ap-south-1.amazonaws.com',
      },
    ],
    // Enable modern image formats for better compression
    formats: ['image/avif', 'image/webp'],
    // Optimize image loading
    minimumCacheTTL: 60,
  },

  // Optimize package imports for smaller bundles
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },

  // Disable source maps in production for smaller bundles
  productionBrowserSourceMaps: false,
};

export default nextConfig;

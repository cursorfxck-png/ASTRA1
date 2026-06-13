/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bfgynclddehatuwfxehr.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'framerusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'sneakcares.site',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Optimize webpack for faster builds
  webpack: (config, { dev, isServer }) => {
    // Disable source maps in dev for faster builds
    if (dev) {
      config.devtool = false;
    }

    // Fix webpack cache warning for large strings
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false,
      // Minimize string serialization issues
      minimize: !dev,
    };

    // Optimize cache
    if (dev) {
      config.cache = {
        type: 'filesystem',
        compression: 'gzip',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      };
    }

    // Disable unnecessary plugins in development
    if (dev && !isServer) {
      config.plugins = config.plugins.filter(
        plugin => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin'
      );
    }

    // Optimize module resolution
    config.resolve.symlinks = false;

    return config;
  },
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Faster Fast Refresh
  experimental: {
    optimizePackageImports: ['@clerk/nextjs', '@supabase/supabase-js', 'react-image-crop'],
    // Turbopack for faster builds (Next.js 15+)
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Faster builds
  swcMinify: true,
  productionBrowserSourceMaps: false,
  // Reduce output bloat
  output: 'standalone',
};

export default nextConfig;


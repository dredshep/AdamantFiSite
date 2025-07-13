/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable error overlay in development to prevent interference with browser extension errors
  // devIndicators: {
  //   buildActivity: true,
  //   buildActivityPosition: 'bottom-left',
  // },
  devIndicators: false,
  onDemandEntries: {
    // Keep the error page open indefinitely
    maxInactiveAge: 1000 * 60 * 60,
  },
  webpack: (config, { isServer, dev }) => {
    if (dev && !isServer) {
      // Disable the client-side error overlay
      config.devtool = false;
    }
    return config;
  },
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
};

module.exports = nextConfig;

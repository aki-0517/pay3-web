/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_LINK_CREATOR_ADDRESS_MAINNET: process.env.NEXT_PUBLIC_LINK_CREATOR_ADDRESS_MAINNET,
    NEXT_PUBLIC_LINK_CREATOR_ADDRESS_SEPOLIA: process.env.NEXT_PUBLIC_LINK_CREATOR_ADDRESS_SEPOLIA,
  },
  webpack: (config) => {
    config.externals = [
      ...(config.externals || []),
      "pino-pretty",
      "encoding",
      "lokijs"
    ];
    return config;
  },
}

export default nextConfig

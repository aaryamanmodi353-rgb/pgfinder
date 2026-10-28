/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  allowedDevOrigins: ["127.0.0.1"],
  typescript: { tsconfigPath: "tsconfig.frontend.json" },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.BACKEND_API_ORIGIN ?? "http://127.0.0.1:3000"}/api/v1/:path*`,
      },
    ];
  },
};
export default nextConfig;

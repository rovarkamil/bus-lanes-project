/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "*.utfs.io",
      },
      {
        protocol: "https",
        hostname: "gdizbxgmdibqhljksgwn.supabase.co",
      },
    ],
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,


  images: {
    remotePatterns: [
     {
      protocol: "https",
      hostname: "zaanvar-care.b-cdn.net"
     }
    ],
  },

};

export default nextConfig;


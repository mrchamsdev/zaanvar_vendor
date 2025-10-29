/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,


  // images: {
  //   remotePatterns: [
  //    {
  //     protocol: "https",
  //     hostname: "zaanvar-care.b-cdn.net"
  //    },
  //      {
  //     protocol: "https",
  //     hostname: "cdn.builder.io"
  //    }
  //   ],
  // },


  images: {
    remotePatterns: [
       {
      protocol: "https",
      hostname: "zaanvar-care.b-cdn.net",
    },
      {
        protocol: 'https',
        hostname: 'cdn.builder.io',
      },
      {
        protocol: 'https',
        hostname: 'zaanvar.b-cdn.net',
      },
      {
        protocol: 'https',
        hostname: 'zaanvarprods3.b-cdn.net', // Added for new image CDN
      },
      {
        protocol: 'https',
        hostname: 'dev-api.zaanvar.com', 
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com', 
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: "https",
        hostname: "dev-wp-api.zaanvar.com",
      },
      {
        protocol: "https",
        hostname: "zaanvar-wp-images.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "zaanvar-wp-images.b-cdn.net",
      },
      {
        protocol: "https",
        hostname: "zaanvaerwebstories.b-cdn.net",
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'www.shutterstock.com',
      },
      
    ],
  },




};

export default nextConfig;


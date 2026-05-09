import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'meo.comick.pictures' },
      { protocol: 'https', hostname: 'meo3.comick.pictures' },
      { protocol: 'https', hostname: 'images.comick.io' },
      { protocol: 'https', hostname: '*.comick.io' },
      { protocol: 'https', hostname: 'mangapark.io' },
      { protocol: 'https', hostname: '*.mangapark.io' },
      { protocol: 'https', hostname: '*.mangapark.net' },
      { protocol: 'https', hostname: '*.mangapark.com' },
      { protocol: 'https', hostname: 's4.anilist.co' },
      { protocol: 'https', hostname: '*.anilist.co' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
};

export default nextConfig;

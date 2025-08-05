/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'melodygram.com'],
  },
  async headers() {
    return [
      {
        // Add bypass header for temp audio files to work with ngrok warning page
        source: '/temp-audio/:path*',
        headers: [
          {
            key: 'ngrok-skip-browser-warning',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      {
        // Add bypass header for temp avatar images to work with ngrok warning page
        source: '/temp-avatars/:path*',
        headers: [
          {
            key: 'ngrok-skip-browser-warning',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig 
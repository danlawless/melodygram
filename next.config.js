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
    ]
  },
}

module.exports = nextConfig 
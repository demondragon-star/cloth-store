/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        // Temporarily ignore build errors due to React 19 type compatibility issues
        ignoreBuildErrors: false,
    },
    images: {
        domains: ['nitagdeebdaoiejakeld.supabase.co'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
        ],
    },
    experimental: {
        instrumentationHook: true,
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
}

module.exports = nextConfig

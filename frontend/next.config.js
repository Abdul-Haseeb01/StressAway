/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Allow TensorFlow.js to work properly
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            path: false,
            crypto: false,
        };
        return config;
    },
    // Image optimization
    images: {
        domains: ['zdxtprplgdknpyrabhil.supabase.co'],
    },
};

module.exports = nextConfig;

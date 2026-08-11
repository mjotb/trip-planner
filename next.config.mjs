/** @type {import('next').NextConfig} */
// basePath يُملأ تلقائيًا عند النشر على GitHub Pages عبر متغير البيئة NEXT_PUBLIC_BASE_PATH
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  output: 'export',
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;

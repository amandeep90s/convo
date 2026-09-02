/** @type {import('next').NextConfig} */
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);

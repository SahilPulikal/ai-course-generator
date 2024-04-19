/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // whitelisting domain
    domains: ["lh3.googleusercontent.com", "s3.us-west-2.amazonaws.com"],
  },
};

module.exports = nextConfig;

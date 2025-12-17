import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "www.gravatar.com",
				pathname: "/avatar/**"
			},
			{
				protocol: "https",
				hostname: "i.imgur.com",
				port: "",
				pathname: "/**"
			},
			{
				protocol: "https",
				hostname: "raw.githubusercontent.com",
				port: "",
				pathname: "/**"
			}
		]
	},
	turbopack: {
		root: path.resolve(__dirname, "..")
	},
	webpack: config => {
		config.module.rules.push({
			test: /\.(glb|gltf)$/,
			type: "asset/resource"
		});

		return config;
	},
	async rewrites() {
		// Backend URL is hardcoded for proxy - users only access via frontend
		const backendUrl = process.env.BACKEND_URI || "http://localhost:3000";
		return [
			{
				source: "/api/:path*",
				destination: `${backendUrl}/api/:path*`
			}
		];
	},
	outputFileTracingRoot: path.resolve(__dirname, "..")
};

export default withNextIntl(nextConfig);

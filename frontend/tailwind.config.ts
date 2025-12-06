import type { Config } from "tailwindcss";

// Tailwind CSS v4 config
// In Tailwind v4, most configuration is done in CSS using @theme directive
// This file is kept minimal for compatibility with tools
export default {
	content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./contexts/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"]
} satisfies Config;

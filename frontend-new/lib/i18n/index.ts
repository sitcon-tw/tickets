import { defaultLocale, locales } from "./config";

export const t = (lang: string, data: Record<string, Record<string, string>>): Record<string, any> => {
	const result: Record<string, any> = {};
	for (const key in data) {
		result[key] = data[key][lang] || data[key][defaultLocale];
	}
	result.t = Object.keys(data[Object.keys(data || {})[0]]);
	return result;
};

export const localesList = (): string[] => Object.keys(locales);
export const local = (url: string): string => {
	return localesList().find(lang => url.startsWith(`/${lang}`)) || defaultLocale;
};

export const l = (url: string) => {
	const currentLocale = local(url);
	return (path?: string, lang: string = ""): string => {
		const base = lang || currentLocale;
		if (!path) path = url.replace(`/${currentLocale}/`, "");
		return `/${base}${path}`;
	};
};

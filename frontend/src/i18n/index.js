import { defaultLocale, locales } from "./config.js";

export const t = (lang, data) => {
	const result = {};
	for (const key in data) {
		result[key] = data[key][lang] || data[key][defaultLocale];
	}
	result.t = Object.keys(data[Object.keys(data || {})[0]]);
	return result;
};
export const localesList = () => Object.keys(locales);
export const local = url => {	
	return localesList().find(lang => url.toString().startsWith(`/${lang}`)) || defaultLocale;
};

export const l = url => {
	const currentLocale = local(url.pathname);
	return (path, lang = "") => {
		const base = lang || currentLocale;
		if (!path) path = url.pathname.replace(`${currentLocale}/`, "");
		return `/${base}${path}`;
	};
};

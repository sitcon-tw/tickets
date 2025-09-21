export const defaultLocale = 'zh-Hant'
export const locales = { en: 'en-US', 'zh-Hant': 'zh-Hant', 'zh-Hans': 'zh-Hans' }
export type Locale = keyof typeof locales

export const t = (lang: Locale, data: Record<string, Record<string, string>>) => {
  const result: Record<string, any> = {}
  for (const key in data) {
    result[key] = data[key][lang] || data[key][defaultLocale]
  }
  result.t = Object.keys(data[Object.keys(data || {})[0]] || {})
  return result
}

export const localesList = () => Object.keys(locales) as Locale[]

export const localFromPath = (pathname: string): Locale => {
  const found = localesList().find(l => pathname.startsWith(`/${l}`)) as Locale | undefined
  return found || (defaultLocale as Locale)
}

export const l = (pathname: string) => (path?: string, lang?: Locale) => {
  const current = localFromPath(pathname)
  const base = lang || current
  const p = path || pathname.replace(`${current}/`, '')
  return `/${base}${p}`
}

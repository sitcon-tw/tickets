export type Locale = 'en' | 'zh-Hant' | 'zh-Hans'

export const messages: Record<Locale, Record<string, string>> = {
  'zh-Hant': {
    home_title: '首頁',
    login_title: '登入／註冊',
    send_magic_link: '寄送 Magic Link',
    sent_title: '已發送 Magic Link',
    retry: '重試',
    admin: '管理員頁面',
  },
  en: {
    home_title: 'Home',
    login_title: 'Sign in / Sign up',
    send_magic_link: 'Send Magic Link',
    sent_title: 'Magic Link Sent',
    retry: 'Retry',
    admin: 'Admin',
  },
  'zh-Hans': {
    home_title: '首页',
    login_title: '登录／注册',
    send_magic_link: '发送 Magic Link',
    sent_title: '已发送 Magic Link',
    retry: '重试',
    admin: '管理员页面',
  },
}

export function detectLocaleFromPath(pathname: string): Locale {
  if (pathname.startsWith('/en')) return 'en'
  if (pathname.startsWith('/zh-Hans')) return 'zh-Hans'
  return 'zh-Hant'
}

export function useI18n(pathname: string) {
  const locale = detectLocaleFromPath(pathname)
  const t = (key: string) => messages[locale][key] ?? messages['zh-Hant'][key] ?? key
  return { t, locale }
}

import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh-Hant', 'zh-Hans'],
  defaultLocale: 'zh-Hant',
  localePrefix: 'always'
});

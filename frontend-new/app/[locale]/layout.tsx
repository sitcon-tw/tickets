import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const site = process.env.SITE || 'https://sitcon2026.example.com';

  return {
    title: 'SITCON 2026',
    description: 'SITCON 2026 Registration System',
    openGraph: {
      title: 'SITCON 2026',
      description: 'SITCON 2026 Registration System',
      url: `${site}/${locale}`,
      siteName: 'SITCON 2026',
      locale: locale,
      type: 'website',
    },
    alternates: {
      canonical: `${site}/${locale}`,
      languages: {
        'en': `${site}/en`,
        'zh-Hant': `${site}/zh-Hant`,
        'zh-Hans': `${site}/zh-Hans`,
        'x-default': `${site}/${routing.defaultLocale}`,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

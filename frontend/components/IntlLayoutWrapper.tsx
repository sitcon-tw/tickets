import LayoutWrapper from "@/components/LayoutWrapper";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

export default async function IntlLayoutWrapper({ children }: { children: React.ReactNode }) {
	const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

	return (
		<NextIntlClientProvider locale={locale} messages={messages}>
			<LayoutWrapper>{children}</LayoutWrapper>
		</NextIntlClientProvider>
	);
}

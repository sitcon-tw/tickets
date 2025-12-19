import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import LayoutWrapper from "@/components/LayoutWrapper";

export default async function IntlLayoutWrapper({ children }: { children: React.ReactNode }) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<NextIntlClientProvider locale={locale} messages={messages}>
			<LayoutWrapper>{children}</LayoutWrapper>
		</NextIntlClientProvider>
	);
}

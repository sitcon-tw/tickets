import LayoutWrapper from "@/components/LayoutWrapper";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

export default async function IntlLayoutWrapper({ children }: { children: React.ReactNode }) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<NextIntlClientProvider locale={locale} messages={messages}>
			<LayoutWrapper>{children}</LayoutWrapper>
		</NextIntlClientProvider>
	);
}

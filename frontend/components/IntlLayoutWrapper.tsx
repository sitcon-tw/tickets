import LayoutWrapper from "@/components/LayoutWrapper";
import RouteLocaleProvider from "@/components/RouteLocaleProvider";
import { getLocale } from "next-intl/server";

export default async function IntlLayoutWrapper({ children }: { children: React.ReactNode }) {
	const locale = await getLocale();

	return (
		<RouteLocaleProvider initialLocale={locale}>
			<LayoutWrapper>{children}</LayoutWrapper>
		</RouteLocaleProvider>
	);
}

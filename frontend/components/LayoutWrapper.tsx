"use client";

import AdminNav from "@/components/AdminNav";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import TodayEventNotification from "@/components/TodayEventNotification";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const isAdminLayout = pathname.includes("/admin");

	return (
		<>
			<Nav />
			<div className="min-h-svh flex items-stretch">
				<AdminNav />
				<div className="min-w-0 grow">
					<div className={cn("flex flex-col w-full h-full mx-auto", isAdminLayout && "max-w-7xl px-4 pt-20 sm:px-8 max-md:pt-16")}>
						<div className="grow">{children}</div>
						<Footer />
					</div>
				</div>
			</div>
			<TodayEventNotification />
		</>
	);
}

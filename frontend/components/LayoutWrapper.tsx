"use client";

import AdminNav from "@/components/AdminNav";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import { usePathname } from "next/navigation";

export default function LayoutWrapper({
	children
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const isAdminLayout = pathname.includes("/admin");

	return (
		<>
			<Nav />
			<main className="min-h-svh flex items-stretch">
				<AdminNav />
				<div className="grow">
					<div className={`flex flex-col w-full h-full mx-auto ${isAdminLayout && "pt-20 max-w-6xl"}`}>
						<div className="grow">{children}</div>
						<Footer />
					</div>
				</div>
			</main>
		</>
	);
}

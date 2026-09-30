import { ConfirmProvider } from "@/components/admin/ConfirmProvider";
import TopLoadingBar from "@/components/TopLoadingBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return (
		<ConfirmProvider>
			<TopLoadingBar />
			{children}
		</ConfirmProvider>
	);
}

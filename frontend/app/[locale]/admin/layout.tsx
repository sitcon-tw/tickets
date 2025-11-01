import AdminNav from "@/components/AdminNav";
import TopLoadingBar from "@/components/TopLoadingBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<TopLoadingBar />
			<AdminNav />
			{children}
		</>
	);
}

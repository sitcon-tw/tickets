import TopLoadingBar from "@/components/TopLoadingBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<TopLoadingBar />
			<div className="admin-main-container">
				{children}
			</div>
		</>
	);
}

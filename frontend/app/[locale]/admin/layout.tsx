import TopLoadingBar from "@/components/TopLoadingBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<TopLoadingBar />
			{children}
		</>
	);
}

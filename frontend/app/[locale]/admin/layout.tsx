import TopLoadingBar from "@/components/TopLoadingBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<TopLoadingBar />
			<div className="flex-1 flex flex-col ml-0 md:ml-68">{children}</div>
		</>
	);
}

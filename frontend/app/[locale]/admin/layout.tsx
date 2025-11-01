import AdminNav from "@/components/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<AdminNav />
			{children}
		</>
	);
}

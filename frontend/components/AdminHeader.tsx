interface AdminHeaderProps {
	title: string;
	description?: string;
}

export default function AdminHeader({ title, description }: AdminHeaderProps) {
	return (
		<header className="mt-8 mb-8">
			<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
			{description && <p className="mt-2 text-gray-600 dark:text-gray-400">{description}</p>}
		</header>
	);
}

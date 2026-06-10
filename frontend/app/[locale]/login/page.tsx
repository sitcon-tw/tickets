import { getServerSession } from "@/lib/api/server-auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Login from "./login-client";

export const metadata: Metadata = {
	title: "Login - SITCONTIX",
	description: "Log in or register for SITCONTIX with a magic link."
};

type LoginPageProps = {
	params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: LoginPageProps) {
	const [{ locale }, session] = await Promise.all([params, getServerSession()]);
	if (session?.user) {
		redirect(`/${locale}`);
	}

	return <Login />;
}

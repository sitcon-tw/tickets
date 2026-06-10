import type { Metadata } from "next";
import VerifyPage from "./verify-client";

export const metadata: Metadata = {
	title: "Phone Verification - SITCONTIX",
	description: "Verify your phone number for SITCONTIX registration."
};

export default function VerifyRoutePage() {
	return <VerifyPage />;
}

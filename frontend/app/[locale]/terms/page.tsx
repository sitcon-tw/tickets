import type { Metadata } from "next";
import TermsClient from "./terms-client";

export const metadata: Metadata = {
	title: "Terms of Service and Privacy Policy - SITCONTIX",
	description: "Read the SITCONTIX terms of service and privacy policy."
};

export default function TermsPage() {
	return <TermsClient />;
}

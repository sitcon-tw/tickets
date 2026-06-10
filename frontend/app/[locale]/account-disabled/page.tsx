import type { Metadata } from "next";
import AccountDisabledClient from "./account-disabled-client";

export const metadata: Metadata = {
	title: "Account Disabled - SITCONTIX",
	description: "Account disabled notice for SITCONTIX."
};

export default function AccountDisabled() {
	return <AccountDisabledClient />;
}

import { generateMetadata as generateEventMetadata } from "../layout";
import Success from "./success-client";

export function generateMetadata(props: Parameters<typeof generateEventMetadata>[0]) {
	return generateEventMetadata(props);
}

export default function SuccessRoutePage() {
	return <Success />;
}

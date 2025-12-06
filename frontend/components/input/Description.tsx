import { ReactNode } from "react";

export default function Description({ children }: { children: ReactNode }) {
	return <div className="my-4 p-4 bg-[#464646] border-l-[3px] border-l-[#007acc] text-sm leading-normal">{children}</div>;
}

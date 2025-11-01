"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({ showSpinner: false, trickleSpeed: 200, minimum: 0.1 });

export default function TopLoadingBar() {
	const pathname = usePathname();

	useEffect(() => {
		// Inject custom NProgress styles
		const style = document.createElement("style");
		style.id = "nprogress-custom-styles";
		style.innerHTML = `
			#nprogress {
				pointer-events: none;
			}
			#nprogress .bar {
				background: #3b82f6;
				position: fixed;
				z-index: 9999;
				top: 0;
				left: 0;
				width: 100%;
				height: 4px;
			}
			#nprogress .peg {
				display: block;
				position: absolute;
				right: 0px;
				width: 100px;
				height: 100%;
				box-shadow: 0 0 10px #3b82f6, 0 0 5px #3b82f6;
				opacity: 1.0;
				transform: rotate(3deg) translate(0px, -4px);
			}
		`;
		document.head.appendChild(style);

		return () => {
			const existingStyle = document.getElementById("nprogress-custom-styles");
			if (existingStyle) {
				document.head.removeChild(existingStyle);
			}
		};
	}, []);

	useEffect(() => {
		NProgress.done();
	}, [pathname]);

	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const anchor = target.closest("a");

			// Trigger loading bar on any click that might navigate
			if (anchor && anchor.classList.contains("cursor-pointer")) {
				NProgress.start();
			}
		};

		document.addEventListener("click", handleClick, true);

		return () => {
			document.removeEventListener("click", handleClick, true);
		};
	}, []);

	return null;
}

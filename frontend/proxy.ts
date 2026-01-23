import type { NextRequest } from 'next/server'
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const middleware = createMiddleware(routing);

export default function handler(request: NextRequest) {
	const response = middleware(request);
	response.headers.set('Vary', 'RSC');
	return response;
}

export const config = {
	matcher: ["/((?!api|_next|_vercel|.*\\.ics|.*\\..*).*)"]
};

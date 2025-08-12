// Proxy auth requests to the backend
export const prerender = false;

export async function ALL({ request, params }) {
	const authPath = params.all || "";
	const backendUrl = `${process.env.BACKEND_URI}/api/auth/${authPath}`;

	// Forward the request to the backend
	const response = await fetch(backendUrl, {
		method: request.method,
		headers: request.headers,
		body: request.method !== "GET" && request.method !== "HEAD" ? await request.text() : undefined
	});

	return response;
}

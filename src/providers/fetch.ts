import { availableFunctions } from '../services/functions';

export async function fetchAIResponse(provider: string, url: string, headers: Record<string, string>, body: Record<string, any>) {
	const tools = provider === 'tool-use' ? availableFunctions : undefined;
	const bodyWithTools = tools ? { ...body, tools } : body;

	const response = await fetch(url, {
		method: 'POST',
		headers,
		body: JSON.stringify(bodyWithTools),
	});

	if (!response.ok) {
		console.error(`Failed to get response for ${provider} via the ${url} endpoint`, response);
		throw new Error('Unknown error - could not parse error response');
	}

	return response.json();
}

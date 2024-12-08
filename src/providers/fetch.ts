import { availableFunctions } from '../services/functions';
import { AppError } from '../utils/errors';

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
		throw new AppError('Unknown error - could not parse error response', 500);
	}

	const data = (await response.json()) as Record<string, any>;

	return { ...data, logId: response.headers.get('cf-aig-log-id') };
}

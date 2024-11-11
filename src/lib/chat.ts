import { availableFunctions } from '../services/functions';
import { getProviderFromModel } from './models';

export const gatewayId = 'llm-assistant';

export function getMessages({ provider, systemPrompt, messageHistory }: { provider: string; systemPrompt: string; messageHistory: any[] }) {
	const cleanedMessageHistory = messageHistory.filter((message) => message.content);

	if (cleanedMessageHistory.length < 0) {
		return [];
	}

	if (provider === 'anthropic') {
		const messages = cleanedMessageHistory.map((message) => {
			return {
				role: message.role,
				content: message.content,
			};
		});

		return messages;
	}

	const messages = [
		{
			role: 'system',
			content: systemPrompt,
		},
		...cleanedMessageHistory,
	];

	return messages;
}

export async function getWorkersAIResponse({ model, messages, env }: { model: string; messages: any[]; env: any }) {
	const supportsFunctions = model === '@hf/nousresearch/hermes-2-pro-mistral-7b';

	const modelResponse = await env.AI.run(
		model,
		{
			messages,
			tools: supportsFunctions ? availableFunctions : undefined,
		},
		{
			gateway: {
				id: gatewayId,
				skipCache: false,
				cacheTtl: 3360,
			},
		}
	);

	return modelResponse;
}

export function getGatewayBaseUrl(env: any) {
	const url = `https://gateway.ai.cloudflare.com/v1/${env.ACCOUNT_ID}/${gatewayId}`;

	return url;
}

export function getGatewayExternalProviderUrl(env: any, provider: string) {
	const providers = ['anthropic'];

	if (!providers.includes(provider)) {
		throw new Error(`The provider ${provider} is not supported`);
	}

	const baseUrl = getGatewayBaseUrl(env);

	const url = `${baseUrl}/${provider}`;

	return url;
}

export async function getAnthropicAIResponse({
	model,
	messages,
	systemPrompt,
	env,
}: {
	model: string;
	messages: any[];
	systemPrompt: string;
	env: any;
}) {
	const baseUrl = getGatewayExternalProviderUrl(env, 'anthropic');
	const url = `${baseUrl}/v1/messages`;

	if (!env.ANTHROPIC_API_KEY) {
		throw new Error('Missing ANTHROPIC_API_KEY');
	}

	const modelResponse = await fetch(url, {
		method: 'POST',
		headers: {
			'x-api-key': env.ANTHROPIC_API_KEY,
			'anthropic-version': '2023-06-01',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			model,
			max_tokens: 1024,
			system: systemPrompt,
			messages,
		}),
	});

	if (!modelResponse.ok) {
		throw new Error('Failed to get response from Anthropic');
	}

	const data: {
		content: {
			text: string;
		}[];
	} = await modelResponse.json();

	const response = data.content
		.map((content: any) => {
			return content.text;
		})
		.join(' ');

	console.log({
		...data,
		response,
	});

	return {
		...data,
		response,
	};
}

export function getAIResponse({
	model,
	systemPrompt,
	messageHistory,
	env,
}: {
	model: string;
	systemPrompt: string;
	messageHistory: any[];
	env: any;
}) {
	const provider = getProviderFromModel(model);

	const messages = getMessages({
		provider,
		systemPrompt,
		messageHistory,
	});

	if (provider === 'anthropic') {
		return getAnthropicAIResponse({ model, messages, systemPrompt, env });
	}

	if (provider !== 'cloudflare') {
		throw new Error(`The provider ${provider} cannot be used with this function`);
	}

	return getWorkersAIResponse({ model, messages, env });
}

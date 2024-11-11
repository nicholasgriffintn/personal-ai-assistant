import { availableFunctions } from '../services/functions';
import { getProviderFromModel } from './models';
import type { Message, IEnv } from '../types';

export const gatewayId = 'llm-assistant';

interface AIResponseParams {
	model: string;
	messages: Message[];
	env: IEnv;
}

interface AnthropicAIResponseParams extends AIResponseParams {
	systemPrompt: string;
}

export function getMessages({
	provider,
	systemPrompt,
	messageHistory,
}: {
	provider: string;
	systemPrompt: string;
	messageHistory: Message[];
}): Message[] {
	const cleanedMessageHistory = messageHistory.filter((message) => message.content);

	if (cleanedMessageHistory.length === 0) {
		return [];
	}

	if (provider === 'anthropic') {
		return cleanedMessageHistory.map((message) => ({
			role: message.role,
			content: message.content,
		}));
	}

	return [
		{
			role: 'system',
			content: systemPrompt,
		},
		...cleanedMessageHistory,
	];
}

export async function getWorkersAIResponse({ model, messages, env }: AIResponseParams) {
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

export function getGatewayBaseUrl(env: IEnv): string {
	return `https://gateway.ai.cloudflare.com/v1/${env.ACCOUNT_ID}/${gatewayId}`;
}

export function getGatewayExternalProviderUrl(env: IEnv, provider: string): string {
	const supportedProviders = ['anthropic', 'grok'];

	if (!supportedProviders.includes(provider)) {
		throw new Error(`The provider ${provider} is not supported`);
	}

	return `${getGatewayBaseUrl(env)}/${provider}`;
}

export async function getAnthropicAIResponse({ model, messages, systemPrompt, env }: AnthropicAIResponseParams) {
	if (!env.ANTHROPIC_API_KEY) {
		throw new Error('Missing ANTHROPIC_API_KEY');
	}

	const url = `${getGatewayExternalProviderUrl(env, 'anthropic')}/v1/messages`;

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

	const data: { content: { text: string }[] } = await modelResponse.json();

	const response = data.content.map((content) => content.text).join(' ');

	return { ...data, response };
}

export async function getGrokAIResponse({ model, messages, env }: AIResponseParams) {
	if (!env.GROK_API_KEY) {
		throw new Error('Missing GROK_API_KEY');
	}

	const url = `${getGatewayExternalProviderUrl(env, 'grok')}/v1/chat/completions`;

	const modelResponse = await fetch(url, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.GROK_API_KEY}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			model,
			messages,
		}),
	});

	if (!modelResponse.ok) {
		throw new Error('Failed to get response from Anthropic');
	}

	const data: {
		choices: {
			message: {
				content: string;
			};
		}[];
	} = await modelResponse.json();

	const response = data.choices.map((choice) => choice.message.content).join(' ');

	return { ...data, response };
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
	env: IEnv;
}) {
	const provider = getProviderFromModel(model);

	const messages = getMessages({
		provider,
		systemPrompt,
		messageHistory,
	});

	switch (provider) {
		case 'anthropic':
			return getAnthropicAIResponse({ model, messages, systemPrompt, env });
		case 'grok':
			return getGrokAIResponse({ model, messages, env });
		default:
			return getWorkersAIResponse({ model, messages, env });
	}
}
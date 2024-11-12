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

function filterMessages(messageHistory: Message[]): Message[] {
	return messageHistory.filter((message) => message.content);
}

function formatMessages(provider: string, systemPrompt: string, messageHistory: Message[]): Message[] {
	const cleanedMessageHistory = filterMessages(messageHistory);

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

async function fetchAIResponse(url: string, headers: Record<string, string>, body: Record<string, any>) {
	const response = await fetch(url, {
		method: 'POST',
		headers,
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		throw new Error('Failed to get response from AI provider');
	}

	return response.json();
}

export function getGatewayBaseUrl(env: IEnv): string {
	return `https://gateway.ai.cloudflare.com/v1/${env.ACCOUNT_ID}/${gatewayId}`;
}

export function getGatewayExternalProviderUrl(env: IEnv, provider: string): string {
	const supportedProviders = ['anthropic', 'grok', 'huggingface', 'perplexity-ai', 'replicate'];

	if (!supportedProviders.includes(provider)) {
		throw new Error(`The provider ${provider} is not supported`);
	}

	return `${getGatewayBaseUrl(env)}/${provider}`;
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

export async function getAnthropicAIResponse({ model, messages, systemPrompt, env }: AnthropicAIResponseParams) {
	if (!env.ANTHROPIC_API_KEY) {
		throw new Error('Missing ANTHROPIC_API_KEY');
	}

	const url = `${getGatewayExternalProviderUrl(env, 'anthropic')}/v1/messages`;

	const headers = {
		'x-api-key': env.ANTHROPIC_API_KEY,
		'anthropic-version': '2023-06-01',
		'Content-Type': 'application/json',
	};

	const body = {
		model,
		max_tokens: 1024,
		system: systemPrompt,
		messages,
	};

	const data: any = await fetchAIResponse(url, headers, body);

	const response = data.content.map((content: { text: string }) => content.text).join(' ');

	return { ...data, response };
}

export async function getGrokAIResponse({ model, messages, env }: AIResponseParams) {
	if (!env.GROK_API_KEY) {
		throw new Error('Missing GROK_API_KEY');
	}

	const url = `${getGatewayExternalProviderUrl(env, 'grok')}/v1/chat/completions`;

	const headers = {
		Authorization: `Bearer ${env.GROK_API_KEY}`,
		'Content-Type': 'application/json',
	};

	const body = {
		model,
		messages,
	};

	const data: any = await fetchAIResponse(url, headers, body);

	const response = data.choices.map((choice: { message: { content: string } }) => choice.message.content).join(' ');

	return { ...data, response };
}

export async function getHuggingFaceAIResponse({ model, messages, env }: AIResponseParams) {
	if (!env.HUGGINGFACE_TOKEN) {
		throw new Error('Missing HUGGINGFACE_TOKEN');
	}

	const url = `${getGatewayExternalProviderUrl(env, 'huggingface')}/${model}/v1/chat/completions`;

	const headers = {
		Authorization: `Bearer ${env.HUGGINGFACE_TOKEN}`,
		'Content-Type': 'application/json',
		'x-wait-for-model': 'true',
	};

	const body = {
		model,
		messages,
	};

	const data: any = await fetchAIResponse(url, headers, body);

	const response = data.choices.map((choice: { message: { content: string } }) => choice.message.content).join(' ');

	return { ...data, response };
}

export async function getPerplexityAIResponse({ model, messages, env }: AIResponseParams) {
	if (!env.PERPLEXITY_API_KEY) {
		throw new Error('Missing PERPLEXITY_API_KEY');
	}

	const url = `${getGatewayExternalProviderUrl(env, 'perplexity-ai')}/chat/completions`;

	const headers = {
		Authorization: `Bearer ${env.PERPLEXITY_API_KEY}`,
		'Content-Type': 'application/json',
	};

	const body = {
		model,
		messages,
	};

	const data: any = await fetchAIResponse(url, headers, body);

	const response = data.choices.map((choice: { message: { content: string } }) => choice.message.content).join(' ');

	return { ...data, response };
}

export async function getReplicateAIResponse({ model, messages, env }: AIResponseParams) {
	if (!env.REPLICATE_API_TOKEN) {
		throw new Error('Missing REPLICATE_API_TOKEN');
	}

	const url = `${getGatewayExternalProviderUrl(env, 'replicate')}/models/${model}/predictions`;

	const headers = {
		Authorization: `Bearer ${env.REPLICATE_API_TOKEN}`,
		'Content-Type': 'application/json',
		Prefer: 'wait',
	};

	const lastMessage = messages[messages.length - 1];

	const body = {
		input: lastMessage.content,
	};

	const data: any = await fetchAIResponse(url, headers, body);

	return { ...data, response: data.output };
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

	const messages = formatMessages(provider, systemPrompt, messageHistory);

	switch (provider) {
		case 'anthropic':
			return getAnthropicAIResponse({ model, messages, systemPrompt, env });
		case 'grok':
			return getGrokAIResponse({ model, messages, env });
		case 'huggingface':
			return getHuggingFaceAIResponse({ model, messages, env });
		case 'perplexity-ai':
			return getPerplexityAIResponse({ model, messages, env });
		case 'replicate':
			return getReplicateAIResponse({ model, messages, env });
		default:
			return getWorkersAIResponse({ model, messages, env });
	}
}

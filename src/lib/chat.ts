import { availableFunctions } from '../services/functions';
import { getModelConfigByMatchingModel } from './models';
import type { Message, IEnv, IUser, RequireAtLeastOne } from '../types';

export const gatewayId = 'llm-assistant';

interface AIResponseParamsBase {
	chatId?: string;
	appUrl?: string;
	systemPrompt?: string;
	messages: Message[];
	env: IEnv;
	model?: string;
	version?: string;
	user?: IUser;
}

type AIResponseParams = RequireAtLeastOne<AIResponseParamsBase, 'model' | 'version'>;

// Helper functions
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

async function fetchAIResponse(provider: string, url: string, headers: Record<string, string>, body: Record<string, any>) {
	const tools = provider === 'tool-use' ? availableFunctions : undefined;
	const bodyWithTools = tools ? { ...body, tools } : body;

	const response = await fetch(url, {
		method: 'POST',
		headers,
		body: JSON.stringify(bodyWithTools),
	});

	if (!response.ok) {
		throw new Error('Failed to get response from AI provider');
	}

	return response.json();
}

// Gateway URL functions
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

// AI Response functions
async function getAIResponseFromProvider(provider: string, url: string, headers: Record<string, string>, body: Record<string, any>) {
	const data: any = await fetchAIResponse(provider, url, headers, body);
	const response = data.choices.map((choice: { message: { content: string } }) => choice.message.content).join(' ');
	return { ...data, response };
}

export async function getWorkersAIResponse({ model, messages, env, user }: AIResponseParams) {
	if (!model) {
		throw new Error('Missing model');
	}

	const modelConfig = getModelConfigByMatchingModel(model);
	const type = modelConfig?.type || 'text';

	const supportsFunctions = model === '@hf/nousresearch/hermes-2-pro-mistral-7b';

	const params: {
		tools?: Record<string, any>[];
		messages?: Message[];
		prompt?: string;
	} = {
		tools: supportsFunctions ? availableFunctions : undefined,
	};

	if (type === 'image') {
		params['prompt'] = messages[messages.length - 1].content;
	} else {
		params['messages'] = messages;
	}

	const modelResponse = await env.AI.run(model, params, {
		gateway: {
			id: gatewayId,
			skipCache: false,
			cacheTtl: 3360,
			metadata: {
				email: user?.email,
			},
		},
	});

	if (type === 'image') {
		try {
			const imageId = Math.random().toString(36);
			const imageKey = `${model}/${imageId}.png`;
			await env.ASSETS_BUCKET.put(imageKey, modelResponse, {
				contentType: 'image/png',
			});
			return {
				response: `Image Generated: [${imageId}](https://assistant-assets.nickgriffin.uk/${imageKey})`,
			};
		} catch (e) {
			console.error(e);
			return '';
		}
	}

	return modelResponse;
}

export async function getAnthropicAIResponse({ model, messages, systemPrompt, env, user }: AIResponseParams) {
	if (!env.ANTHROPIC_API_KEY) {
		throw new Error('Missing ANTHROPIC_API_KEY');
	}

	const url = `${getGatewayExternalProviderUrl(env, 'anthropic')}/v1/messages`;

	const headers = {
		'x-api-key': env.ANTHROPIC_API_KEY,
		'anthropic-version': '2023-06-01',
		'Content-Type': 'application/json',
		'cf-aig-metadata': JSON.stringify({
			email: user?.email,
		}),
	};

	const body = {
		model,
		max_tokens: 1024,
		system: systemPrompt,
		messages,
	};

	const data: any = await fetchAIResponse('anthropic', url, headers, body);

	const response = data.content.map((content: { text: string }) => content.text).join(' ');

	return { ...data, response };
}

export async function getGrokAIResponse({ model, messages, env, user }: AIResponseParams) {
	if (!env.GROK_API_KEY) {
		throw new Error('Missing GROK_API_KEY');
	}

	const url = `${getGatewayExternalProviderUrl(env, 'grok')}/v1/chat/completions`;

	const headers = {
		Authorization: `Bearer ${env.GROK_API_KEY}`,
		'Content-Type': 'application/json',
		'cf-aig-metadata': JSON.stringify({
			email: user?.email,
		}),
	};

	const body = {
		model,
		messages,
	};

	return getAIResponseFromProvider('grok', url, headers, body);
}

export async function getHuggingFaceAIResponse({ model, messages, env, user }: AIResponseParams) {
	if (!env.HUGGINGFACE_TOKEN) {
		throw new Error('Missing HUGGINGFACE_TOKEN');
	}

	const url = `${getGatewayExternalProviderUrl(env, 'huggingface')}/${model}/v1/chat/completions`;

	const headers = {
		Authorization: `Bearer ${env.HUGGINGFACE_TOKEN}`,
		'Content-Type': 'application/json',
		'x-wait-for-model': 'true',
		'cf-aig-metadata': JSON.stringify({
			email: user?.email,
		}),
	};

	const body = {
		model,
		messages,
	};

	return getAIResponseFromProvider('huggingface', url, headers, body);
}

export async function getPerplexityAIResponse({ model, messages, env, user }: AIResponseParams) {
	if (!env.PERPLEXITY_API_KEY) {
		throw new Error('Missing PERPLEXITY_API_KEY');
	}

	const url = `${getGatewayExternalProviderUrl(env, 'perplexity-ai')}/chat/completions`;

	const headers = {
		Authorization: `Bearer ${env.PERPLEXITY_API_KEY}`,
		'Content-Type': 'application/json',
		'cf-aig-metadata': JSON.stringify({
			email: user?.email,
		}),
	};

	const body = {
		model,
		messages,
	};

	return getAIResponseFromProvider('perplexity', url, headers, body);
}

export async function getReplicateAIResponse({ chatId, appUrl, model, version, messages, env, user }: AIResponseParams) {
	if (!env.REPLICATE_API_TOKEN) {
		throw new Error('Missing REPLICATE_API_TOKEN');
	}

	if (!chatId) {
		throw new Error('Missing chatId');
	}

	const baseUrl = getGatewayExternalProviderUrl(env, 'replicate');
	const url = model ? `${baseUrl}/models/${model}/predictions` : `${baseUrl}/predictions`;

	const headers = {
		Authorization: `Bearer ${env.REPLICATE_API_TOKEN}`,
		'Content-Type': 'application/json',
		Prefer: 'wait=5',
		'cf-aig-metadata': JSON.stringify({
			email: user?.email,
		}),
	};

	const lastMessage = messages[messages.length - 1];

	const baseWebhookUrl = appUrl || 'https:///assistant.nicholasgriffin.workers.dev';
	const webhookUrl = `${baseWebhookUrl}/webhooks/replicate?chatId=${chatId}&token=${env.WEBHOOK_SECRET}`;
	const body = {
		version,
		input: lastMessage.content,
		webhook: webhookUrl,
		webhook_events_filter: ['output', 'completed'],
	};

	const data: any = await fetchAIResponse('replicate', url, headers, body);

	return { ...data, response: data.output };
}

// Main function to get AI response
export function getAIResponse({
	chatId,
	appUrl,
	model,
	systemPrompt,
	messageHistory,
	env,
	user,
}: {
	appUrl?: string;
	chatId?: string;
	model: string;
	systemPrompt: string;
	messageHistory: any[];
	env: IEnv;
	user?: IUser;
}) {
	const modelConfig = getModelConfigByMatchingModel(model);
	const provider = modelConfig?.provider || 'unknown';

	const messages = formatMessages(provider, systemPrompt, messageHistory);

	switch (provider) {
		case 'anthropic':
			return getAnthropicAIResponse({ model, messages, systemPrompt, env, user });
		case 'grok':
			return getGrokAIResponse({ model, messages, env, user });
		case 'huggingface':
			return getHuggingFaceAIResponse({ model, messages, env, user });
		case 'perplexity-ai':
			return getPerplexityAIResponse({ model, messages, env, user });
		case 'replicate':
			return getReplicateAIResponse({ chatId, appUrl, model, messages, env, user });
		default:
			return getWorkersAIResponse({ model, messages, env, user });
	}
}

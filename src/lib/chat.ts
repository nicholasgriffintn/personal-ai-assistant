import { getModelConfigByMatchingModel } from './models';
import type { Message, IEnv, IUser, RequireAtLeastOne } from '../types';
import { AIProviderFactory } from '../providers/factory';
import { formatMessages } from '../utils/messages';

export const gatewayId = 'llm-assistant';

interface AIResponseParamsBase {
	chatId?: string;
	appUrl?: string;
	systemPrompt?: string;
	messages: Message[];
	message?: string;
	env: IEnv;
	model?: string;
	version?: string;
	user?: IUser;
	webhookUrl?: string;
	webhookEvents?: string[];
}

export type AIResponseParams = RequireAtLeastOne<AIResponseParamsBase, 'model' | 'version'>;

// Gateway URL functions
export function getGatewayBaseUrl(env: IEnv): string {
	return `https://gateway.ai.cloudflare.com/v1/${env.ACCOUNT_ID}/${gatewayId}`;
}

export function getGatewayExternalProviderUrl(env: IEnv, provider: string): string {
	const supportedProviders = ['anthropic', 'grok', 'huggingface', 'perplexity-ai', 'replicate', 'mistral', 'openrouter'];

	if (!supportedProviders.includes(provider)) {
		throw new Error(`The provider ${provider} is not supported`);
	}

	return `${getGatewayBaseUrl(env)}/${provider}`;
}

// Main function to get AI response
export async function getAIResponse({
	chatId,
	appUrl,
	model,
	systemPrompt,
	messages,
	message,
	env,
	user,
}: {
	appUrl?: string;
	chatId?: string;
	model: string;
	systemPrompt: string;
	messages: Message[];
	message: string;
	env: IEnv;
	user?: IUser;
}) {
	const modelConfig = getModelConfigByMatchingModel(model);
	const provider = AIProviderFactory.getProvider(modelConfig?.provider || 'workers');
	const formattedMessages = formatMessages(provider.name, systemPrompt, messages);

	return provider.getResponse({
		chatId,
		appUrl,
		model,
		systemPrompt,
		messages: formattedMessages,
		message,
		env,
		user,
	});
}

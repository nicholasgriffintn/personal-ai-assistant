import { AIProviderFactory } from '../../providers/factory';
import type { GetAiResponseParams, IEnv } from '../../types';
import { formatMessages } from '../../utils/messages';
import { getModelConfigByMatchingModel } from '../models';

export const gatewayId = 'llm-assistant';

export function getGatewayBaseUrl(env: IEnv): string {
	return `https://gateway.ai.cloudflare.com/v1/${env.ACCOUNT_ID}/${gatewayId}`;
}

export function getGatewayExternalProviderUrl(env: IEnv, provider: string): string {
	const supportedProviders = AIProviderFactory.getProviders();

	if (!supportedProviders.includes(provider)) {
		throw new Error(`The provider ${provider} is not supported`);
	}

	return `${getGatewayBaseUrl(env)}/${provider}`;
}

export async function getAIResponse({
	chatId,
	appUrl,
	model,
	systemPrompt,
	messages,
	message,
	env,
	user,
	mode = 'normal',
	temperature,
	max_tokens,
	top_p,
}: GetAiResponseParams) {
	if (!model) {
		throw new Error('Model is required');
	}

	const modelConfig = getModelConfigByMatchingModel(model);
	const provider = AIProviderFactory.getProvider(modelConfig?.provider || 'workers');

	const filteredMessages = mode === 'normal' ? messages.filter((msg) => !msg.mode || msg.mode === 'normal') : messages;

	const formattedMessages = formatMessages(provider.name, filteredMessages, systemPrompt, model);

	return provider.getResponse({
		chatId,
		appUrl,
		model,
		systemPrompt,
		messages: formattedMessages,
		message,
		env,
		user,
		temperature,
		max_tokens,
		top_p,
	});
}

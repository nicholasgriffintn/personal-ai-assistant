import { AIProvider, getAIResponseFromProvider } from './base';
import { getGatewayExternalProviderUrl } from '../lib/chat';
import type { AIResponseParams } from '../lib/chat';
import { AppError } from '../utils/errors';

export class PerplexityProvider implements AIProvider {
	name = 'perplexity-ai';

	async getResponse({ model, messages, env, user }: AIResponseParams) {
		if (!env.PERPLEXITY_API_KEY || !env.AI_GATEWAY_TOKEN) {
			throw new AppError('Missing PERPLEXITY_API_KEY or AI_GATEWAY_TOKEN', 400);
		}

		const url = `${getGatewayExternalProviderUrl(env, 'perplexity-ai')}/chat/completions`;
		const headers = {
			'cf-aig-authorization': env.AI_GATEWAY_TOKEN,
			Authorization: `Bearer ${env.PERPLEXITY_API_KEY}`,
			'Content-Type': 'application/json',
			'cf-aig-metadata': JSON.stringify({ email: user?.email }),
		};

		const body = {
			model,
			messages,
			max_tokens: 1024,
		};

		return getAIResponseFromProvider('perplexity-ai', url, headers, body);
	}
}

import { AIProvider, getAIResponseFromProvider } from './base';
import { getGatewayExternalProviderUrl } from '../lib/chat';
import type { AIResponseParams } from '../lib/chat';

export class PerplexityProvider implements AIProvider {
	name = 'perplexity-ai';

	async getResponse({ model, messages, env, user }: AIResponseParams) {
		if (!env.PERPLEXITY_API_KEY) {
			throw new Error('Missing PERPLEXITY_API_KEY');
		}

		const url = `${getGatewayExternalProviderUrl(env, 'perplexity-ai')}/chat/completions`;
		const headers = {
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

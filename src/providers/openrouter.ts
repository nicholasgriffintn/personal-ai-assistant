import { AIProvider, getAIResponseFromProvider } from './base';
import { getGatewayExternalProviderUrl } from '../lib/chat';
import type { AIResponseParams } from '../lib/chat';

export class OpenRouterProvider implements AIProvider {
	name = 'openrouter';

	async getResponse({ model, messages, env, user }: AIResponseParams) {
		if (!env.OPENROUTER_API_KEY) {
			throw new Error('Missing OPENROUTER_API_KEY');
		}

		const url = `${getGatewayExternalProviderUrl(env, 'openrouter')}/v1/chat/completions`;
		const headers = {
			Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
			'Content-Type': 'application/json',
			'cf-aig-metadata': JSON.stringify({ email: user?.email }),
		};

		const body = {
			model,
			messages,
			temperature: 0.7,
			max_tokens: 1024,
		};

		return getAIResponseFromProvider('openrouter', url, headers, body);
	}
}

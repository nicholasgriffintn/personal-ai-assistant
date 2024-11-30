import { AIProvider, getAIResponseFromProvider } from './base';
import { getGatewayExternalProviderUrl } from '../lib/chat';
import type { AIResponseParams } from '../lib/chat';

export class MistralProvider implements AIProvider {
	name = 'mistral';

	async getResponse({ model, messages, env, user }: AIResponseParams) {
		if (!env.MISTRAL_API_KEY) {
			throw new Error('Missing MISTRAL_API_KEY');
		}

		const url = `${getGatewayExternalProviderUrl(env, 'mistral')}/v1/chat/completions`;
		const headers = {
			Authorization: `Bearer ${env.MISTRAL_API_KEY}`,
			'Content-Type': 'application/json',
			'cf-aig-metadata': JSON.stringify({ email: user?.email }),
		};

		const body = {
			model,
			messages,
			temperature: 0.7,
			max_tokens: 1024,
		};

		return getAIResponseFromProvider('mistral', url, headers, body);
	}
}

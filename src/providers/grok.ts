import { AIProvider, getAIResponseFromProvider } from './base';
import { getGatewayExternalProviderUrl } from '../lib/chat';
import type { AIResponseParams } from '../lib/chat';

export class GrokProvider implements AIProvider {
	name = 'grok';

	async getResponse({ model, messages, env, user }: AIResponseParams) {
		if (!env.GROK_API_KEY) {
			throw new Error('Missing GROK_API_KEY');
		}

		const url = `${getGatewayExternalProviderUrl(env, 'grok')}/v1/chat/completions`;
		const headers = {
			Authorization: `Bearer ${env.GROK_API_KEY}`,
			'Content-Type': 'application/json',
			'cf-aig-metadata': JSON.stringify({ email: user?.email }),
		};

		const body = {
			model,
			messages,
			temperature: 0.7,
		};

		return getAIResponseFromProvider('grok', url, headers, body);
	}
}

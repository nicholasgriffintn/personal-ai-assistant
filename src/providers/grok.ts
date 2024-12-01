import { AIProvider, getAIResponseFromProvider } from './base';
import { getGatewayExternalProviderUrl } from '../lib/chat';
import type { AIResponseParams } from '../lib/chat';
import { AppError } from '../utils/errors';

export class GrokProvider implements AIProvider {
	name = 'grok';

	async getResponse({ model, messages, env, user }: AIResponseParams) {
		if (!env.GROK_API_KEY || !env.AI_GATEWAY_TOKEN) {
			throw new AppError('Missing GROK_API_KEY or AI_GATEWAY_TOKEN', 400);
		}

		const url = `${getGatewayExternalProviderUrl(env, 'grok')}/v1/chat/completions`;
		const headers = {
			'cf-aig-authorization': env.AI_GATEWAY_TOKEN,
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

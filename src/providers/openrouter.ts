import { AIProvider, getAIResponseFromProvider } from './base';
import { getGatewayExternalProviderUrl } from '../lib/chat';
import type { AIResponseParams } from '../lib/chat';
import { AppError } from '../utils/errors';

export class OpenRouterProvider implements AIProvider {
	name = 'openrouter';

	async getResponse({ model, messages, env, user, temperature, max_tokens, top_p }: AIResponseParams) {
		if (!env.OPENROUTER_API_KEY || !env.AI_GATEWAY_TOKEN) {
			throw new AppError('Missing OPENROUTER_API_KEY or AI_GATEWAY_TOKEN', 400);
		}

		const url = `${getGatewayExternalProviderUrl(env, 'openrouter')}/v1/chat/completions`;
		const headers = {
			'cf-aig-authorization': env.AI_GATEWAY_TOKEN,
			Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
			'Content-Type': 'application/json',
			'cf-aig-metadata': JSON.stringify({ email: user?.email }),
		};

		const body = {
			model,
			messages,
			temperature,
			max_tokens,
			top_p,
		};

		return getAIResponseFromProvider('openrouter', url, headers, body);
	}
}

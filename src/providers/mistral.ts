import { AIProvider, getAIResponseFromProvider } from './base';
import { getGatewayExternalProviderUrl } from '../lib/chat';
import type { AIResponseParams } from '../types';
import { AppError } from '../utils/errors';

export class MistralProvider implements AIProvider {
	name = 'mistral';

	async getResponse({ model, messages, env, user, temperature, max_tokens, top_p }: AIResponseParams) {
		if (!env.MISTRAL_API_KEY || !env.AI_GATEWAY_TOKEN) {
			throw new AppError('Missing MISTRAL_API_KEY or AI_GATEWAY_TOKEN', 400);
		}

		const url = `${getGatewayExternalProviderUrl(env, 'mistral')}/v1/chat/completions`;
		const headers = {
			'cf-aig-authorization': env.AI_GATEWAY_TOKEN,
			Authorization: `Bearer ${env.MISTRAL_API_KEY}`,
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

		return getAIResponseFromProvider('mistral', url, headers, body);
	}
}

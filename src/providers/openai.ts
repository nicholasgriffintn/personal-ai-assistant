import { AIProvider, getAIResponseFromProvider } from './base';
import { getGatewayExternalProviderUrl } from '../lib/chat';
import type { AIResponseParams } from '../types';
import { AppError } from '../utils/errors';

export class OpenAIProvider implements AIProvider {
	name = 'openai';

	async getResponse({ model, messages, env, user, systemPrompt, temperature, max_tokens, top_p }: AIResponseParams) {
		if (!env.OPENAI_API_KEY || !env.AI_GATEWAY_TOKEN) {
			throw new AppError('Missing OPENAI_API_KEY or AI_GATEWAY_TOKEN', 400);
		}

		const url = `${getGatewayExternalProviderUrl(env, 'openai')}/chat/completions`;
		const headers = {
			'cf-aig-authorization': env.AI_GATEWAY_TOKEN,
			Authorization: `Bearer ${env.OPENAI_API_KEY}`,
			'Content-Type': 'application/json',
			'cf-aig-metadata': JSON.stringify({ email: user?.email }),
		};

		const body = {
			model,
			messages,
			temperature,
			max_completion_tokens: max_tokens,
			top_p,
		};

		return getAIResponseFromProvider('openai', url, headers, body);
	}
}

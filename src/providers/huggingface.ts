import { AIProvider, getAIResponseFromProvider } from './base';
import { getGatewayExternalProviderUrl } from '../lib/chat';
import type { AIResponseParams } from '../lib/chat';
import { AppError } from '../utils/errors';

export class HuggingFaceProvider implements AIProvider {
	name = 'huggingface';

	async getResponse({ model, messages, env, user, temperature, max_tokens, top_p }: AIResponseParams) {
		if (!env.HUGGINGFACE_TOKEN || !env.AI_GATEWAY_TOKEN) {
			throw new AppError('Missing HUGGINGFACE_TOKEN or AI_GATEWAY_TOKEN', 400);
		}

		const url = `${getGatewayExternalProviderUrl(env, 'huggingface')}/models/${model}`;
		const headers = {
			'cf-aig-authorization': env.AI_GATEWAY_TOKEN,
			Authorization: `Bearer ${env.HUGGINGFACE_TOKEN}`,
			'Content-Type': 'application/json',
			'cf-aig-metadata': JSON.stringify({ email: user?.email }),
		};

		const body = {
			inputs: messages,
			parameters: {
				max_new_tokens: max_tokens,
				temperature,
				top_p,
			},
		};

		return getAIResponseFromProvider('huggingface', url, headers, body);
	}
}

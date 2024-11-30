import { AIProvider, getAIResponseFromProvider } from './base';
import { getGatewayExternalProviderUrl } from '../lib/chat';
import type { AIResponseParams } from '../lib/chat';

export class HuggingFaceProvider implements AIProvider {
	name = 'huggingface';

	async getResponse({ model, messages, env, user }: AIResponseParams) {
		if (!env.HUGGINGFACE_TOKEN) {
			throw new Error('Missing HUGGINGFACE_TOKEN');
		}

		const url = `${getGatewayExternalProviderUrl(env, 'huggingface')}/models/${model}`;
		const headers = {
			Authorization: `Bearer ${env.HUGGINGFACE_TOKEN}`,
			'Content-Type': 'application/json',
			'cf-aig-metadata': JSON.stringify({ email: user?.email }),
		};

		const body = {
			inputs: messages,
			parameters: {
				max_new_tokens: 1024,
				temperature: 0.7,
			},
		};

		return getAIResponseFromProvider('huggingface', url, headers, body);
	}
}

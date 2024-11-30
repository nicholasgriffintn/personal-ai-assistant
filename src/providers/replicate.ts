import { AIProvider, getAIResponseFromProvider } from './base';
import { getGatewayExternalProviderUrl } from '../lib/chat';
import type { AIResponseParams } from '../lib/chat';

export class ReplicateProvider implements AIProvider {
	name = 'replicate';

	async getResponse({ model, messages, env, user }: AIResponseParams) {
		if (!env.REPLICATE_API_TOKEN) {
			throw new Error('Missing REPLICATE_API_TOKEN');
		}

		const url = `${getGatewayExternalProviderUrl(env, 'replicate')}/v1/predictions`;
		const headers = {
			Authorization: `Token ${env.REPLICATE_API_TOKEN}`,
			'Content-Type': 'application/json',
			'cf-aig-metadata': JSON.stringify({ email: user?.email }),
		};

		const body = {
			version: model,
			input: {
				prompt: messages[messages.length - 1].content,
			},
		};

		return getAIResponseFromProvider('replicate', url, headers, body);
	}
}

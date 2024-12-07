import { AIProvider, getAIResponseFromProvider } from './base';
import { getGatewayExternalProviderUrl } from '../lib/chat';
import type { AIResponseParams } from '../types';
import { AppError } from '../utils/errors';

export class ReplicateProvider implements AIProvider {
	name = 'replicate';

	async getResponse({ model, messages, env, user }: AIResponseParams) {
		if (!env.REPLICATE_API_TOKEN || !env.AI_GATEWAY_TOKEN) {
			throw new AppError('Missing REPLICATE_API_TOKEN or AI_GATEWAY_TOKEN', 400);
		}

		const url = `${getGatewayExternalProviderUrl(env, 'replicate')}/v1/predictions`;
		const headers = {
			'cf-aig-authorization': env.AI_GATEWAY_TOKEN,
			Authorization: `Token ${env.REPLICATE_API_TOKEN}`,
			'Content-Type': 'application/json',
			'cf-aig-metadata': JSON.stringify({ email: user?.email }),
		};

		const body = {
			version: model,
			input: {
				// @ts-ignore
				...messages[messages.length - 1].content,
			},
		};

		return getAIResponseFromProvider('replicate', url, headers, body);
	}
}

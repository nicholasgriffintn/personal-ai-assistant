import { AIProvider } from './base';
import { getGatewayExternalProviderUrl } from '../lib/chat';
import type { AIResponseParams } from '../lib/chat';
import { fetchAIResponse } from './fetch';

export class AnthropicProvider implements AIProvider {
	name = 'anthropic';

	async getResponse({ model, messages, systemPrompt, env, user }: AIResponseParams) {
		if (!env.ANTHROPIC_API_KEY) {
			throw new Error('Missing ANTHROPIC_API_KEY');
		}

		const url = `${getGatewayExternalProviderUrl(env, 'anthropic')}/v1/messages`;
		const headers = {
			'x-api-key': env.ANTHROPIC_API_KEY,
			'anthropic-version': '2023-06-01',
			'Content-Type': 'application/json',
			'cf-aig-metadata': JSON.stringify({ email: user?.email }),
		};

		const body = {
			model,
			max_tokens: 1024,
			system: systemPrompt,
			messages,
		};

		const data: any = await fetchAIResponse('anthropic', url, headers, body);
		const response = data.content.map((content: { text: string }) => content.text).join(' ');

		return { ...data, response };
	}
}

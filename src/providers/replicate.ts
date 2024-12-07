import { AIProvider, getAIResponseFromProvider } from './base';
import { getGatewayExternalProviderUrl } from '../lib/chat';
import type { AIResponseParams } from '../types';
import { AppError } from '../utils/errors';

export class ReplicateProvider implements AIProvider {
	name = 'replicate';

	async getResponse({ chatId, appUrl, model, messages, env, user }: AIResponseParams) {
		if (!env.REPLICATE_API_TOKEN || !env.AI_GATEWAY_TOKEN || !env.WEBHOOK_SECRET) {
			throw new AppError('Missing REPLICATE_API_TOKEN or WEBHOOK_SECRET or AI_GATEWAY_TOKEN', 400);
		}

		if (!chatId) {
			throw new AppError('Missing chatId', 400);
		}

		const lastMessage = messages[messages.length - 1];
		if (!lastMessage.content) {
			throw new AppError('Missing last message content', 400);
		}

		const url = `${getGatewayExternalProviderUrl(env, 'replicate')}/v1/predictions`;
		const headers = {
			'cf-aig-authorization': env.AI_GATEWAY_TOKEN,
			Authorization: `Token ${env.REPLICATE_API_TOKEN}`,
			'Content-Type': 'application/json',
			'cf-aig-metadata': JSON.stringify({ email: user?.email }),
		};

		const baseWebhookUrl = appUrl || 'https:///assistant.nicholasgriffin.workers.dev';
		const webhookUrl = `${baseWebhookUrl}/webhooks/replicate?chatId=${chatId}&token=${env.WEBHOOK_SECRET}`;

		const body = {
			version: model,
			input: lastMessage.content,
			webhook: webhookUrl,
			webhook_events_filter: ['output', 'completed'],
		};

		return getAIResponseFromProvider('replicate', url, headers, body);
	}
}

import type { IEnv, ChatRole } from '../../../types';
import { AIProviderFactory } from '../../../providers/factory';
import { generateArticleReportPrompt } from '../../../lib/prompts';

export interface Params {
	articles: string;
}

export interface Response {
	status: 'success' | 'error';
	name: string;
	content: string;
	data: any;
}

export async function generateArticlesReport({
	chatId,
	appUrl,
	env,
	args,
}: {
	chatId: string;
	appUrl: string | undefined;
	env: IEnv;
	args: Params;
}): Promise<Response> {
	if (!args.articles) {
		return {
			status: 'error',
			name: 'articles_report',
			content: 'Missing articles',
			data: {},
		};
	}

	try {
		const provider = AIProviderFactory.getProvider('perplexity-ai');

		const data = await provider.getResponse({
			chatId,
			appUrl,
			model: 'llama-3.1-sonar-large-128k-online',
			messages: [
				{
					role: 'user' as ChatRole,
					content: generateArticleReportPrompt(args.articles),
				},
			],
			env: env,
		});

		return {
			status: 'success',
			name: 'articles_report',
			content: data.content,
			data,
		};
	} catch (error) {
		return {
			status: 'error',
			name: 'articles_report',
			content: error instanceof Error ? error.message : 'Failed to generate report',
			data: {},
		};
	}
}

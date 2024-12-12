import type { IEnv, ChatRole } from '../../../types';
import { AIProviderFactory } from '../../../providers/factory';
import { generateArticleReportPrompt } from '../../../lib/prompts';
import { verifyQuotes } from '../../../utils/verify';
import { extractQuotes } from '../../../utils/extract';

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

		const quotes = extractQuotes(data.content);
		const verifiedQuotes = verifyQuotes(args.articles, quotes);

		return {
			status: 'success',
			name: 'articles_report',
			content: data.content,
			data: {
				model: data.model,
				id: data.id,
				citations: data.citations,
				logId: data.logId,
				verifiedQuotes,
			},
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

import type { IEnv, ChatRole } from '../../../types';
import { AIProviderFactory } from '../../../providers/factory';
import { analyseArticlePrompt } from '../../../lib/prompts';

export interface Params {
	article: string;
}

export interface Response {
	status: 'success' | 'error';
	name: string;
	content: string;
	data: any;
}

export async function analyseArticle({
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
	if (!args.article) {
		return {
			status: 'error',
			name: 'analyse_article',
			content: 'Missing article',
			data: {},
		};
	}

	try {
		const provider = AIProviderFactory.getProvider('groq');

		const data = await provider.getResponse({
			chatId,
			appUrl,
			model: 'llama-3.3-70b-specdec',
			messages: [
				{
					role: 'system' as ChatRole,
					content: analyseArticlePrompt(args.article),
				},
			],
			env: env,
		});

		return {
			status: 'success',
			name: 'analyse_article',
			content: data.content,
			data,
		};
	} catch (error) {
		return {
			status: 'error',
			name: 'analyse_article',
			content: error instanceof Error ? error.message : 'Failed to analyse article',
			data: {},
		};
	}
}

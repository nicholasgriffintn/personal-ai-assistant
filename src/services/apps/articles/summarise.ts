import type { IEnv, ChatRole } from "../../../types";
import { AIProviderFactory } from "../../../providers/factory";
import { summariseArticlePrompt } from "../../../lib/prompts";
import { verifyQuotes } from "../../../utils/verify";
import { extractQuotes } from "../../../utils/extract";

export interface Params {
	article: string;
}

export interface Response {
	status: "success" | "error";
	name: string;
	content: string;
	data: any;
}

export async function summariseArticle({
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
			status: "error",
			name: "summarise_article",
			content: "Missing article",
			data: {},
		};
	}

	try {
		const provider = AIProviderFactory.getProvider("perplexity-ai");

		const data = await provider.getResponse({
			chatId,
			appUrl,
			model: "llama-3.1-sonar-large-128k-online",
			messages: [
				{
					role: "user" as ChatRole,
					content: summariseArticlePrompt(args.article),
				},
			],
			env: env,
		});

		const quotes = extractQuotes(data.content);
		const verifiedQuotes = verifyQuotes(args.article, quotes);

		return {
			status: "success",
			name: "summarise_article",
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
			status: "error",
			name: "summarise_article",
			content:
				error instanceof Error ? error.message : "Failed to summarise article",
			data: {},
		};
	}
}

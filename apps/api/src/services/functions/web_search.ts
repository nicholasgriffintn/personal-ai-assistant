import type { IFunction, IRequest, Message, ChatRole } from "../../types";
import { performWebSearch } from "../apps/web-search";
import { getAIResponse } from "../../lib/chat";
import { webSearchSystemPrompt } from "../../lib/prompts";

export const web_search: IFunction = {
	name: "web_search",
	description:
		"Search the web for current information. Use this when you need to find up-to-date information about a topic.",
	parameters: {
		type: "object",
		properties: {
			query: {
				type: "string",
				description: "The search query to look up",
			},
			search_depth: {
				type: "string",
				description:
					"The depth of the search - 'basic' for quick results or 'advanced' for more comprehensive results",
				default: "basic",
			},
			include_answer: {
				type: "boolean",
				description:
					"Whether to include an AI-generated answer in the response",
				default: false,
			},
			include_raw_content: {
				type: "boolean",
				description:
					"Whether to include the raw content from the search results",
				default: false,
			},
			include_images: {
				type: "boolean",
				description: "Whether to include images in the search results",
				default: false,
			},
		},
		required: ["query"],
	},
	function: async (
		completion_id: string,
		args: any,
		req: IRequest,
		appUrl?: string,
	) => {
		const result = await performWebSearch(args, req);

		if (result.status === "error") {
			return {
				status: "error",
				name: "web_search",
				content: result.error || "Unknown error occurred",
				data: {},
			};
		}

		const messages: Message[] = [
			{
				role: "assistant" as ChatRole,
				content: webSearchSystemPrompt(),
			},
			{
				role: "user" as ChatRole,
				content: `Please summarize the following search results for the query: "${args.query}"\n\nSearch Results:\n${result.data?.results
					.map(
						(r, i) =>
							`[${i + 1}] ${r.title}\n${r.content}\nSource: ${r.url}\n`,
					)
					.join("\n")}`,
			},
		];

    const aiResponse = await getAIResponse({
      completion_id,
      appUrl,
      user: req.user,
			env: req.env,
			messages,
			message: args.query,
			model: "llama-3.3-70b-versatile",
		});

		return {
			status: "success",
			name: "web_search",
			content: aiResponse.response || "Search completed but no summary could be generated",
			data: {
				...result.data,
				summary: aiResponse.response,
			},
		};
	},
};

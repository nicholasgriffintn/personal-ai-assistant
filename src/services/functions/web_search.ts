import type { IFunction, IRequest } from "../../types";
import { performWebSearch } from "../apps/web-search";

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
		chatId: string,
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

		return {
			status: "success",
			name: "web_search",
			content: "Web search completed successfully",
			data: result.data,
		};
	},
};

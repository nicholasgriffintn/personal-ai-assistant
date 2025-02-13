import type { IRequest } from "../../types";

export interface WebSearchParams {
	query: string;
	search_depth?: "basic" | "advanced";
	include_answer?: boolean;
	include_raw_content?: boolean;
	include_images?: boolean;
}

interface TavilySearchResult {
	results: Array<{
		title: string;
		content: string;
		url: string;
		score: number;
	}>;
	answer?: string;
	images?: Array<{
		url: string;
	}>;
}

export interface WebSearchResult {
	status: "success" | "error";
	error?: string;
	data?: TavilySearchResult;
}

export const performWebSearch = async (
	params: WebSearchParams,
	req: IRequest,
): Promise<WebSearchResult> => {
	if (!req.env.TAVILY_API_KEY) {
		return {
			status: "error",
			error: "Tavily API key not configured",
		};
	}

	try {
		const response = await fetch("https://api.tavily.com/search", {
			method: "POST",
			headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${req.env.TAVILY_API_KEY}`,
			},
			body: JSON.stringify({
				query: params.query,
				search_depth: params.search_depth || "basic",
				include_answer: params.include_answer || false,
				include_raw_content: params.include_raw_content || false,
				include_images: params.include_images || false,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			return {
				status: "error",
				error: `Error performing web search: ${error}`,
			};
		}

		const data = await response.json() as TavilySearchResult;
		return {
			status: "success",
			data,
		};
	} catch (error) {
		return {
			status: "error",
			error: `Error performing web search: ${error}`,
		};
	}
}; 
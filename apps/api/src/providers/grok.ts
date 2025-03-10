import type { ChatCompletionParameters } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { type AIProvider, getAIResponseFromProvider } from "./base";

export class GrokProvider implements AIProvider {
	name = "grok";

	async getResponse(params: ChatCompletionParameters) {
		if (!params.env.GROK_API_KEY || !params.env.AI_GATEWAY_TOKEN) {
			throw new AssistantError(
				"Missing GROK_API_KEY or AI_GATEWAY_TOKEN",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		const endpoint = "v1/chat/completions";
		const headers = {
			"cf-aig-authorization": params.env.AI_GATEWAY_TOKEN,
			Authorization: `Bearer ${params.env.GROK_API_KEY}`,
			"Content-Type": "application/json",
			"cf-aig-metadata": JSON.stringify({
				email: params.user?.email || "anonymous@undefined.computer",
			}),
		};

		return getAIResponseFromProvider(
			"grok",
			endpoint,
			headers,
			params,
			params.env,
		);
	}
}

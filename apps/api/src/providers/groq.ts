import type { ChatCompletionParameters } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { type AIProvider, getAIResponseFromProvider } from "./base";

export class GroqProvider implements AIProvider {
	name = "groq";

	async getResponse(params: ChatCompletionParameters) {
		if (!params.env.GROQ_API_KEY || !params.env.AI_GATEWAY_TOKEN) {
			throw new AssistantError(
				"Missing GROQ_API_KEY or AI_GATEWAY_TOKEN",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		const endpoint = "chat/completions";
		const headers = {
			"cf-aig-authorization": params.env.AI_GATEWAY_TOKEN,
			Authorization: `Bearer ${params.env.GROQ_API_KEY}`,
			"Content-Type": "application/json",
			"cf-aig-metadata": JSON.stringify({
				email: params.user?.email || "anonymous@undefined.computer",
			}),
		};

		return getAIResponseFromProvider(
			"groq",
			endpoint,
			headers,
			params,
			params.env,
		);
	}
}

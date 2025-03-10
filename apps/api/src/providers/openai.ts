import type { ChatCompletionParameters } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { type AIProvider, getAIResponseFromProvider } from "./base";

export class OpenAIProvider implements AIProvider {
	name = "openai";

	async getResponse(params: ChatCompletionParameters) {
		if (!params.env.OPENAI_API_KEY || !params.env.AI_GATEWAY_TOKEN) {
			throw new AssistantError(
				"Missing OPENAI_API_KEY or AI_GATEWAY_TOKEN",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		if (!params.model) {
			throw new AssistantError("Missing model", ErrorType.PARAMS_ERROR);
		}

		const endpoint = "chat/completions";
		const headers = {
			"cf-aig-authorization": params.env.AI_GATEWAY_TOKEN,
			Authorization: `Bearer ${params.env.OPENAI_API_KEY}`,
			"Content-Type": "application/json",
			"cf-aig-metadata": JSON.stringify({
				email: params.user?.email || "anonymous@undefined.computer",
			}),
		};

		return getAIResponseFromProvider(
			"openai",
			endpoint,
			headers,
			params,
			params.env,
		);
	}
}

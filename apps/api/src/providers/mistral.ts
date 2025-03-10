import type { ChatCompletionParameters } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { type AIProvider, getAIResponseFromProvider } from "./base";

export class MistralProvider implements AIProvider {
	name = "mistral";

	async getResponse(params: ChatCompletionParameters) {
		if (!params.model) {
			throw new AssistantError("Missing model", ErrorType.PARAMS_ERROR);
		}

		if (!params.env.MISTRAL_API_KEY || !params.env.AI_GATEWAY_TOKEN) {
			throw new AssistantError(
				"Missing MISTRAL_API_KEY or AI_GATEWAY_TOKEN",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		const endpoint = "v1/chat/completions";
		const headers = {
			"cf-aig-authorization": params.env.AI_GATEWAY_TOKEN,
			Authorization: `Bearer ${params.env.MISTRAL_API_KEY}`,
			"Content-Type": "application/json",
			"cf-aig-metadata": JSON.stringify({
				email: params.user?.email || "anonymous@undefined.computer",
			}),
		};

		return getAIResponseFromProvider(
			"mistral",
			endpoint,
			headers,
			params,
			params.env,
		);
	}
}

import type { ChatCompletionParameters } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { type AIProvider, getAIResponseFromProvider } from "./base";

export class OllamaProvider implements AIProvider {
	name = "ollama";

	async getResponse(params: ChatCompletionParameters) {
		if (params.env.OLLAMA_ENABLED !== "true") {
			throw new AssistantError(
				"Missing OLLAMA_ENABLED",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		if (!params.model) {
			throw new AssistantError("Missing model", ErrorType.PARAMS_ERROR);
		}

		const ollamaUrl = params.env.OLLAMA_URL || "http://localhost:11434";
		const url = `${ollamaUrl}/api/chat`;
		const headers = {
			"Content-Type": "application/json",
		};

		return getAIResponseFromProvider(
			"ollama",
			url,
			headers,
			params,
			params.env,
		);
	}
}

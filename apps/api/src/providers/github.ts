import type { ChatCompletionParameters } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { type AIProvider, getAIResponseFromProvider } from "./base";

export class GithubModelsProvider implements AIProvider {
	name = "github-models";

	async getResponse(params: ChatCompletionParameters) {
		if (!params.env.GITHUB_MODELS_API_TOKEN) {
			throw new AssistantError(
				"Missing GITHUB_MODELS_API_TOKEN",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		if (!params.model) {
			throw new AssistantError("Missing model", ErrorType.PARAMS_ERROR);
		}

		const githubModelsUrl = "https://models.inference.ai.azure.com";
		const url = `${githubModelsUrl}/chat/completions`;
		const headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${params.env.GITHUB_MODELS_API_TOKEN}`,
		};

		return getAIResponseFromProvider(
			"github-models",
			url,
			headers,
			params,
			params.env,
		);
	}
}

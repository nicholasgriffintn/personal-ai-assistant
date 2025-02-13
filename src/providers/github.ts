import { getModelConfigByMatchingModel } from "../lib/models";
import { availableFunctions } from "../services/functions";
import type { AIResponseParams } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { type AIProvider, getAIResponseFromProvider } from "./base";

export class GithubModelsProvider implements AIProvider {
	name = "github-models";

	async getResponse({
		model,
		messages,
		env,
		user,
		temperature,
		max_tokens,
		top_p,
		top_k,
		seed,
		repetition_penalty,
		frequency_penalty,
		presence_penalty,
	}: AIResponseParams) {
		if (!env.GITHUB_MODELS_API_TOKEN) {
			throw new AssistantError(
				"Missing GITHUB_MODELS_API_TOKEN",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		if (!model) {
			throw new AssistantError("Missing model", ErrorType.PARAMS_ERROR);
		}

		const modelConfig = getModelConfigByMatchingModel(model);
		const supportsFunctions = modelConfig?.supportsFunctions || false;

		const githubModelsUrl = "https://models.inference.ai.azure.com";
		const url = `${githubModelsUrl}/chat/completions`;
		const headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${env.GITHUB_MODELS_API_TOKEN}`,
		};

		const body: Record<string, any> = {
			model,
			messages,
			temperature,
			max_completion_tokens: max_tokens,
			top_p,
			top_k,
			seed,
			repetition_penalty,
			frequency_penalty,
			presence_penalty,
			stream: false,
		};

		if (supportsFunctions) {
			body.tools = availableFunctions.map((func) => ({
				type: "function",
				function: {
					name: func.name,
					description: func.description,
					parameters: func.parameters,
				},
			}));
			body.parallel_tool_calls = false;
		}

		return getAIResponseFromProvider("github-models", url, headers, body, env);
	}
}

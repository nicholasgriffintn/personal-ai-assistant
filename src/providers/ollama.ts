import { getGatewayExternalProviderUrl } from "../lib/chat";
import { getModelConfigByMatchingModel } from "../lib/models";
import { availableFunctions } from "../services/functions";
import type { AIResponseParams } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { type AIProvider, getAIResponseFromProvider } from "./base";

export class OllamaProvider implements AIProvider {
	name = "ollama";

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
		if (env.OLLAMA_ENABLED !== "true") {
			throw new AssistantError(
				"Missing OLLAMA_ENABLED",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		if (!model) {
			throw new AssistantError("Missing model", ErrorType.PARAMS_ERROR);
		}

		const modelConfig = getModelConfigByMatchingModel(model);
		const supportsFunctions = modelConfig?.supportsFunctions || false;

		const ollamaUrl = env.OLLAMA_URL || "http://localhost:11434";
		const url = `${ollamaUrl}/api/chat`;
		const headers = {
			"Content-Type": "application/json",
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

		return getAIResponseFromProvider(
			"ollama",
			url,
			headers,
			body,
			env.ANALYTICS,
		);
	}
}

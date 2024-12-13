import { getGatewayExternalProviderUrl } from "../lib/chat";
import { getModelConfigByMatchingModel } from "../lib/models";
import { availableFunctions } from "../services/functions";
import type { AIResponseParams } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { type AIProvider, getAIResponseFromProvider } from "./base";

export class OpenAIProvider implements AIProvider {
	name = "openai";

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
		if (!env.OPENAI_API_KEY || !env.AI_GATEWAY_TOKEN) {
			throw new AssistantError(
				"Missing OPENAI_API_KEY or AI_GATEWAY_TOKEN",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		if (!model) {
			throw new AssistantError("Missing model", ErrorType.PARAMS_ERROR);
		}

		const modelConfig = getModelConfigByMatchingModel(model);
		const supportsFunctions = modelConfig?.supportsFunctions || false;

		const url = `${getGatewayExternalProviderUrl(env, "openai")}/chat/completions`;
		const headers = {
			"cf-aig-authorization": env.AI_GATEWAY_TOKEN,
			Authorization: `Bearer ${env.OPENAI_API_KEY}`,
			"Content-Type": "application/json",
			"cf-aig-metadata": JSON.stringify({ email: user?.email }),
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

		return getAIResponseFromProvider("openai", url, headers, body);
	}
}

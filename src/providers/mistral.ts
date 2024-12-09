import { getGatewayExternalProviderUrl } from "../lib/chat";
import { getModelConfigByMatchingModel } from "../lib/models";
import { availableFunctions } from "../services/functions";
import type { AIResponseParams } from "../types";
import { AppError } from "../utils/errors";
import { type AIProvider, getAIResponseFromProvider } from "./base";

export class MistralProvider implements AIProvider {
	name = "mistral";

	async getResponse({
		model,
		messages,
		env,
		user,
		disableFunctions,
		temperature,
		max_tokens,
		top_p,
		top_k,
		seed,
		repetition_penalty,
		frequency_penalty,
		presence_penalty,
	}: AIResponseParams) {
		if (!model) {
			throw new AppError("Missing model", 400);
		}

		if (!env.MISTRAL_API_KEY || !env.AI_GATEWAY_TOKEN) {
			throw new AppError("Missing MISTRAL_API_KEY or AI_GATEWAY_TOKEN", 400);
		}

		const modelConfig = getModelConfigByMatchingModel(model);
		const supportsFunctions = modelConfig?.supportsFunctions || false;

		const url = `${getGatewayExternalProviderUrl(env, "mistral")}/v1/chat/completions`;
		const headers = {
			"cf-aig-authorization": env.AI_GATEWAY_TOKEN,
			Authorization: `Bearer ${env.MISTRAL_API_KEY}`,
			"Content-Type": "application/json",
			"cf-aig-metadata": JSON.stringify({ email: user?.email }),
		};

		const body: Record<string, any> = {
			model,
			messages,
			temperature,
			max_tokens,
			top_p,
			top_k,
			seed,
			repetition_penalty,
			frequency_penalty,
			presence_penalty,
		};

		if (supportsFunctions && !disableFunctions) {
			body.tools = availableFunctions.map((func) => ({
				type: "function",
				function: {
					name: func.name,
					description: func.description,
					parameters: func.parameters,
				},
			}));
		}

		return getAIResponseFromProvider("mistral", url, headers, body);
	}
}

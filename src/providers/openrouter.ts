import { getGatewayExternalProviderUrl } from "../lib/chat";
import type { AIResponseParams } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { type AIProvider, getAIResponseFromProvider } from "./base";

export class OpenRouterProvider implements AIProvider {
	name = "openrouter";

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
		if (!env.OPENROUTER_API_KEY || !env.AI_GATEWAY_TOKEN) {
			throw new AssistantError(
				"Missing OPENROUTER_API_KEY or AI_GATEWAY_TOKEN",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		const url = `${getGatewayExternalProviderUrl(env, "openrouter")}/v1/chat/completions`;
		const headers = {
			"cf-aig-authorization": env.AI_GATEWAY_TOKEN,
			Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
			"Content-Type": "application/json",
			"cf-aig-metadata": JSON.stringify({ email: user?.email }),
		};

		const body = {
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

		return getAIResponseFromProvider(
			"openrouter",
			url,
			headers,
			body,
			env.ANALYTICS,
		);
	}
}

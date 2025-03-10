import type { AIResponseParams } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { type AIProvider, getAIResponseFromProvider } from "./base";

export class DeepSeekProvider implements AIProvider {
	name = "deepseek";

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
		if (!env.DEEPSEEK_API_KEY || !env.AI_GATEWAY_TOKEN) {
			throw new AssistantError(
				"Missing DEEPSEEK_API_KEY or AI_GATEWAY_TOKEN",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		const endpoint = "chat/completions";
		const headers = {
			"cf-aig-authorization": env.AI_GATEWAY_TOKEN,
			Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
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

		return getAIResponseFromProvider("deepseek", endpoint, headers, body, env);
	}
}

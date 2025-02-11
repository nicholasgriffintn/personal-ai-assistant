import type { AIResponseParams } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { type AIProvider, getAIResponseFromProvider } from "./base";

export class HuggingFaceProvider implements AIProvider {
	name = "huggingface";

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
		if (!env.HUGGINGFACE_TOKEN || !env.AI_GATEWAY_TOKEN) {
			throw new AssistantError(
				"Missing HUGGINGFACE_TOKEN or AI_GATEWAY_TOKEN",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		/*
			TODO: Need to support requesting later

			{
				"error": "Model HuggingFaceTB/SmolLM2-1.7B-Instruct is currently loading",
				"estimated_time": 136.9101104736328
			}
		*/

		const endpoint = `${model}/v1/chat/completions`;
		const headers = {
			"cf-aig-authorization": env.AI_GATEWAY_TOKEN,
			Authorization: `Bearer ${env.HUGGINGFACE_TOKEN}`,
			"Content-Type": "application/json",
			"cf-aig-metadata": JSON.stringify({ email: user?.email }),
		};

		const body = {
			model,
			messages,
			max_tokens,
			temperature,
			top_p,
			top_k,
			seed,
			repetition_penalty,
			frequency_penalty,
			presence_penalty,
		};

		const data = await getAIResponseFromProvider(
			"huggingface",
			endpoint,
			headers,
			body,
			env,
		);

		return data;
	}
}

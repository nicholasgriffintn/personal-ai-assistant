import type { ChatCompletionParameters } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { type AIProvider, getAIResponseFromProvider } from "./base";

export class HuggingFaceProvider implements AIProvider {
	name = "huggingface";

	async getResponse(params: ChatCompletionParameters) {
		if (!params.env.HUGGINGFACE_TOKEN || !params.env.AI_GATEWAY_TOKEN) {
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

		const endpoint = `${params.model}/v1/chat/completions`;
		const headers = {
			"cf-aig-authorization": params.env.AI_GATEWAY_TOKEN,
			Authorization: `Bearer ${params.env.HUGGINGFACE_TOKEN}`,
			"Content-Type": "application/json",
			"cf-aig-metadata": JSON.stringify({
				email: params.user?.email || "anonymous@undefined.computer",
			}),
		};

		const data = await getAIResponseFromProvider(
			"huggingface",
			endpoint,
			headers,
			params,
			params.env,
		);

		return data;
	}
}

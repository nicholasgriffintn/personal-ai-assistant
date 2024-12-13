import { getGatewayExternalProviderUrl } from "../lib/chat";
import type { AIResponseParams } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { type AIProvider, getAIResponseFromProvider } from "./base";

export class GoogleStudioProvider implements AIProvider {
	name = "google-ai-studio";

	async getResponse({
		model,
		messages,
		env,
		user,
		systemPrompt,
		temperature,
		max_tokens,
		top_p,
		top_k,
		seed,
		repetition_penalty,
		frequency_penalty,
		presence_penalty,
	}: AIResponseParams) {
		if (!env.GOOGLE_STUDIO_API_KEY || !env.AI_GATEWAY_TOKEN) {
			throw new AssistantError(
				"Missing GOOGLE_STUDIO_API_KEY or AI_GATEWAY_TOKEN",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		const isBeta = model?.includes("gemini-exp");

		const url = `${getGatewayExternalProviderUrl(env, "google-ai-studio")}/${isBeta ? "v1beta" : "v1"}/models/${model}:generateContent`;
		const headers = {
			"cf-aig-authorization": env.AI_GATEWAY_TOKEN,
			"x-goog-api-key": env.GOOGLE_STUDIO_API_KEY,
			"Content-Type": "application/json",
			"cf-aig-metadata": JSON.stringify({ email: user?.email }),
		};

		const body = {
			contents: messages,
			systemInstruction: {
				role: "system",
				parts: [
					{
						text: systemPrompt,
					},
				],
			},
			generationConfig: {
				temperature,
				maxOutputTokens: max_tokens,
				topP: top_p,
				topK: top_k,
				seed,
				repetitionPenalty: repetition_penalty,
				frequencyPenalty: frequency_penalty,
				presencePenalty: presence_penalty,
			},
		};

		return getAIResponseFromProvider(
			"google-ai-studio",
			url,
			headers,
			body,
			env.ANALYTICS,
		);
	}
}

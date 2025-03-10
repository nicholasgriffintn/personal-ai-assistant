import type { ChatCompletionParameters } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { type AIProvider, getAIResponseFromProvider } from "./base";

export class GoogleStudioProvider implements AIProvider {
	name = "google-ai-studio";

	async getResponse(params: ChatCompletionParameters) {
		const { env, model, user } = params;

		if (!env.GOOGLE_STUDIO_API_KEY || !env.AI_GATEWAY_TOKEN) {
			throw new AssistantError(
				"Missing GOOGLE_STUDIO_API_KEY or AI_GATEWAY_TOKEN",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		const isBeta = model?.includes("gemini-exp");

		const endpoint = `${isBeta ? "v1beta" : "v1"}/models/${model}:generateContent`;
		const headers = {
			"cf-aig-authorization": env.AI_GATEWAY_TOKEN,
			"x-goog-api-key": env.GOOGLE_STUDIO_API_KEY,
			"Content-Type": "application/json",
			"cf-aig-metadata": JSON.stringify({
				email: user?.email || "anonymous@undefined.computer",
			}),
		};

		return getAIResponseFromProvider(
			"google-ai-studio",
			endpoint,
			headers,
			params,
			env,
		);
	}
}

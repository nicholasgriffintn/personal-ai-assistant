import { mapParametersToProvider } from "../lib/chat/parameters";
import { trackProviderMetrics } from "../lib/monitoring";
import type { ChatCompletionParameters } from "../types/chat";
import { AssistantError, ErrorType } from "../utils/errors";
import type { AIProvider } from "./base";
import { fetchAIResponse } from "./fetch";

export class AnthropicProvider implements AIProvider {
	name = "anthropic";

	async getResponse(params: ChatCompletionParameters) {
		const { env, model, user } = params;

		if (!env.ANTHROPIC_API_KEY || !env.AI_GATEWAY_TOKEN) {
			throw new AssistantError(
				"Missing ANTHROPIC_API_KEY or AI_GATEWAY_TOKEN",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		if (!model) {
			throw new AssistantError("Missing model", ErrorType.PARAMS_ERROR);
		}

		const endpoint = "v1/messages";
		const headers = {
			"cf-aig-authorization": env.AI_GATEWAY_TOKEN,
			"x-api-key": env.ANTHROPIC_API_KEY,
			"anthropic-version": "2023-06-01",
			"Content-Type": "application/json",
			"cf-aig-metadata": JSON.stringify({
				email: user?.email || "anonymous@undefined.computer",
			}),
		};

		return trackProviderMetrics({
			provider: "anthropic",
			model,
			operation: async () => {
				const body = mapParametersToProvider(params, "anthropic");
				const data: any = await fetchAIResponse(
					"anthropic",
					endpoint,
					headers,
					body,
					env,
				);
				const response = data.content
					.map((content: { text: string }) => content.text)
					.join(" ");

				return { ...data, response };
			},
			analyticsEngine: env.ANALYTICS,
			settings: {
				temperature: params.temperature,
				max_tokens: params.max_tokens,
				top_p: params.top_p,
				top_k: params.top_k,
				seed: params.seed,
				repetition_penalty: params.repetition_penalty,
				frequency_penalty: params.frequency_penalty,
			},
		});
	}
}

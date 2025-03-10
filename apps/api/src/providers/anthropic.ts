import { trackProviderMetrics } from "../lib/monitoring";
import type { AIResponseParams } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import type { AIProvider } from "./base";
import { fetchAIResponse } from "./fetch";

export class AnthropicProvider implements AIProvider {
	name = "anthropic";

	async getResponse({
		model,
		messages,
		systemPrompt,
		env,
		user,
		max_tokens,
		temperature,
		top_p,
		seed,
		repetition_penalty,
		frequency_penalty,
		presence_penalty,
		reasoning_effort,
		should_think,
	}: AIResponseParams) {
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
			"cf-aig-metadata": JSON.stringify({ email: user?.email }),
		};

		const reasoning_budget_tokens = max_tokens
			? reasoning_effort === 1
				? Math.floor(max_tokens * 0.5)
				: reasoning_effort === 2
					? Math.floor(max_tokens * 0.75)
					: reasoning_effort === 3
						? Math.floor(max_tokens * 0.9)
						: Math.floor(max_tokens * 0.75)
			: 1024;

		const settings = {
			temperature,
			max_tokens: max_tokens || 4096,
			top_p,
			seed,
			repetition_penalty,
			frequency_penalty,
			presence_penalty,
			thinking: should_think
				? {
						type: "enabled",
						budget_tokens: reasoning_budget_tokens,
					}
				: undefined,
		};

		const body = {
			model,
			system: systemPrompt,
			messages,
			...settings,
		};

		return trackProviderMetrics({
			provider: "anthropic",
			model,
			operation: async () => {
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
			settings,
		});
	}
}

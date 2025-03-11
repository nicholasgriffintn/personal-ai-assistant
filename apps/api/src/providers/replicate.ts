import { trackProviderMetrics } from "../lib/monitoring";
import type { ChatCompletionParameters } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { BaseProvider } from "./base";
import { fetchAIResponse } from "./fetch";

export class ReplicateProvider extends BaseProvider {
	name = "replicate";

	protected validateParams(params: ChatCompletionParameters): void {
		super.validateParams(params);

		if (
			!params.env.REPLICATE_API_TOKEN ||
			!params.env.AI_GATEWAY_TOKEN ||
			!params.env.WEBHOOK_SECRET
		) {
			throw new AssistantError(
				"Missing REPLICATE_API_TOKEN or WEBHOOK_SECRET or AI_GATEWAY_TOKEN",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		if (!params.completion_id) {
			throw new AssistantError("Missing completion_id", ErrorType.PARAMS_ERROR);
		}

		const lastMessage = params.messages[params.messages.length - 1];
		if (!lastMessage.content) {
			throw new AssistantError(
				"Missing last message content",
				ErrorType.PARAMS_ERROR,
			);
		}
	}

	protected getEndpoint(): string {
		return "v1/predictions";
	}

	protected getHeaders(
		params: ChatCompletionParameters,
	): Record<string, string> {
		return {
			"cf-aig-authorization": params.env.AI_GATEWAY_TOKEN || "",
			Authorization: `Token ${params.env.REPLICATE_API_TOKEN || ""}`,
			"Content-Type": "application/json",
			"cf-aig-metadata": JSON.stringify({
				email: params.user?.email || "anonymous@undefined.computer",
			}),
		};
	}

	async getResponse(params: ChatCompletionParameters): Promise<any> {
		this.validateParams(params);

		const endpoint = this.getEndpoint();
		const headers = this.getHeaders(params);

		const base_webhook_url =
			params.app_url || "https://chat-api.nickgriffin.uk";
		const webhook_url = `${base_webhook_url}/webhooks/replicate?completion_id=${params.completion_id}&token=${params.env.WEBHOOK_SECRET || ""}`;

		const lastMessage = params.messages[params.messages.length - 1];

		const body = {
			version: params.model,
			input: lastMessage.content,
			webhook: webhook_url,
			webhook_events_filter: ["output", "completed"],
		};

		return trackProviderMetrics({
			provider: this.name,
			model: params.model as string,
			operation: async () => {
				const data = await fetchAIResponse(
					this.name,
					endpoint,
					headers,
					body,
					params.env,
				);

				return this.formatResponse(data, params);
			},
			analyticsEngine: params.env?.ANALYTICS,
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

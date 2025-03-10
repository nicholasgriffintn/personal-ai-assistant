import type { ChatCompletionParameters } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { type AIProvider, getAIResponseFromProvider } from "./base";

export class ReplicateProvider implements AIProvider {
	name = "replicate";

	async getResponse({
		completion_id,
		app_url,
		model,
		messages,
		env,
		user,
	}: ChatCompletionParameters) {
		if (
			!env.REPLICATE_API_TOKEN ||
			!env.AI_GATEWAY_TOKEN ||
			!env.WEBHOOK_SECRET
		) {
			throw new AssistantError(
				"Missing REPLICATE_API_TOKEN or WEBHOOK_SECRET or AI_GATEWAY_TOKEN",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		if (!completion_id) {
			throw new AssistantError("Missing completion_id", ErrorType.PARAMS_ERROR);
		}

		const lastMessage = messages[messages.length - 1];
		if (!lastMessage.content) {
			throw new AssistantError(
				"Missing last message content",
				ErrorType.PARAMS_ERROR,
			);
		}

		const endpoint = "v1/predictions";
		const headers = {
			"cf-aig-authorization": env.AI_GATEWAY_TOKEN,
			Authorization: `Token ${env.REPLICATE_API_TOKEN}`,
			"Content-Type": "application/json",
			"cf-aig-metadata": JSON.stringify({
				email: user?.email || "anonymous@undefined.computer",
			}),
		};

		const base_webhook_url = app_url || "https://chat-api.nickgriffin.uk";
		const webhook_url = `${base_webhook_url}/webhooks/replicate?completion_id=${completion_id}&token=${env.WEBHOOK_SECRET}`;

		const body = {
			version: model,
			input: lastMessage.content,
			webhook: webhook_url,
			webhook_events_filter: ["output", "completed"],
		};

		// @ts-ignore
		return getAIResponseFromProvider("replicate", endpoint, headers, body, env);
	}
}

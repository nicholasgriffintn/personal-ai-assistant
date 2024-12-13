import { getGatewayExternalProviderUrl } from "../lib/chat";
import type { AIResponseParams } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { type AIProvider, getAIResponseFromProvider } from "./base";

export class ReplicateProvider implements AIProvider {
	name = "replicate";

	async getResponse({
		chatId,
		appUrl,
		model,
		messages,
		env,
		user,
	}: AIResponseParams) {
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

		if (!chatId) {
			throw new AssistantError("Missing chatId", ErrorType.PARAMS_ERROR);
		}

		const lastMessage = messages[messages.length - 1];
		if (!lastMessage.content) {
			throw new AssistantError(
				"Missing last message content",
				ErrorType.PARAMS_ERROR,
			);
		}

		const url = `${getGatewayExternalProviderUrl(env, "replicate")}/v1/predictions`;
		const headers = {
			"cf-aig-authorization": env.AI_GATEWAY_TOKEN,
			Authorization: `Token ${env.REPLICATE_API_TOKEN}`,
			"Content-Type": "application/json",
			"cf-aig-metadata": JSON.stringify({ email: user?.email }),
		};

		const baseWebhookUrl =
			appUrl || "https:///assistant.nicholasgriffin.workers.dev";
		const webhookUrl = `${baseWebhookUrl}/webhooks/replicate?chatId=${chatId}&token=${env.WEBHOOK_SECRET}`;

		const body = {
			version: model,
			input: lastMessage.content,
			webhook: webhookUrl,
			webhook_events_filter: ["output", "completed"],
		};

		return getAIResponseFromProvider(
			"replicate",
			url,
			headers,
			body,
			env.ANALYTICS,
		);
	}
}

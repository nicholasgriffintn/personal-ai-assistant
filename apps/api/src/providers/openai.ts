import type { ChatCompletionParameters } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { BaseProvider } from "./base";

export class OpenAIProvider extends BaseProvider {
	name = "openai";

	protected validateParams(params: ChatCompletionParameters): void {
		super.validateParams(params);

		if (!params.env.OPENAI_API_KEY || !params.env.AI_GATEWAY_TOKEN) {
			throw new AssistantError(
				"Missing OPENAI_API_KEY or AI_GATEWAY_TOKEN",
				ErrorType.CONFIGURATION_ERROR,
			);
		}
	}

	protected getEndpoint(): string {
		return "chat/completions";
	}

	protected getHeaders(
		params: ChatCompletionParameters,
	): Record<string, string> {
		return {
			"cf-aig-authorization": params.env.AI_GATEWAY_TOKEN || "",
			Authorization: `Bearer ${params.env.OPENAI_API_KEY}`,
			"Content-Type": "application/json",
			"cf-aig-metadata": JSON.stringify({
				email: params.user?.email || "anonymous@undefined.computer",
			}),
		};
	}
}

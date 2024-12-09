import { getGatewayExternalProviderUrl } from "../lib/chat";
import type { AIResponseParams } from "../types";
import { AppError } from "../utils/errors";
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
		top_k,
		seed,
		repetition_penalty,
		frequency_penalty,
		presence_penalty,
	}: AIResponseParams) {
		if (!env.ANTHROPIC_API_KEY || !env.AI_GATEWAY_TOKEN) {
			throw new AppError("Missing ANTHROPIC_API_KEY or AI_GATEWAY_TOKEN", 400);
		}

		const url = `${getGatewayExternalProviderUrl(env, "anthropic")}/v1/messages`;
		const headers = {
			"cf-aig-authorization": env.AI_GATEWAY_TOKEN,
			"x-api-key": env.ANTHROPIC_API_KEY,
			"anthropic-version": "2023-06-01",
			"Content-Type": "application/json",
			"cf-aig-metadata": JSON.stringify({ email: user?.email }),
		};

		const body = {
			model,
			max_tokens: max_tokens || 4096,
			system: systemPrompt,
			messages,
			temperature,
			top_p,
			top_k,
			seed,
			repetition_penalty,
			frequency_penalty,
			presence_penalty,
		};

		const data: any = await fetchAIResponse("anthropic", url, headers, body);
		const response = data.content
			.map((content: { text: string }) => content.text)
			.join(" ");

		return { ...data, response };
	}
}

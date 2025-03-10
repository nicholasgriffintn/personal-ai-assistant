import { mapParametersToProvider } from "../lib/chat/parameters";
import { trackProviderMetrics } from "../lib/monitoring";
import type { IEnv } from "../types";
import type { ChatCompletionParameters } from "../types/chat";
import { fetchAIResponse } from "./fetch";

export interface AIProvider {
	name: string;
	getResponse(params: ChatCompletionParameters): Promise<any>;
}

export async function getAIResponseFromProvider(
	provider: string,
	endpointOrUrl: string,
	headers: Record<string, string>,
	params: ChatCompletionParameters,
	env?: IEnv,
) {
	const analyticsEngine = env?.ANALYTICS;
	const body = mapParametersToProvider(params, provider);

	return trackProviderMetrics({
		provider,
		model: params.model as string,
		operation: async () => {
			const data: any = await fetchAIResponse(
				provider,
				endpointOrUrl,
				headers,
				body,
				env,
			);

			if (provider === "ollama") {
				return { ...data, response: data.message.content };
			}

			if (provider === "google-ai-studio") {
				const response = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
				return { ...data, response };
			}

			const message = data.choices?.[0]?.message;
			return { ...data, response: message?.content || "", ...message };
		},
		analyticsEngine,
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

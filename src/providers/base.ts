import type { AIResponseParams, IEnv } from "../types";
import { fetchAIResponse } from "./fetch";
import { trackProviderMetrics } from "../lib/monitoring";

export interface AIProvider {
	name: string;
	getResponse(params: AIResponseParams): Promise<any>;
}

export async function getAIResponseFromProvider(
	provider: string,
	endpointOrUrl: string,
	headers: Record<string, string>,
	body: Record<string, unknown>,
	env?: IEnv,
) {
	const analyticsEngine = env?.ANALYTICS;

	return trackProviderMetrics({
		provider,
		model: body.model as string,
		operation: async () => {
			const data: any = await fetchAIResponse(provider, endpointOrUrl, headers, body, env);

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
	});
}

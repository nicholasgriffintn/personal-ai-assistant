import { gatewayId } from "../lib/chat";
import { getModelConfigByMatchingModel } from "../lib/models";
import { uploadImageFromChat } from "../lib/upload";
import { availableFunctions } from "../services/functions";
import type { AIResponseParams } from "../types";
import type { Message } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import type { AIProvider } from "./base";
import { Monitoring, trackProviderMetrics } from "../lib/monitoring";

export class WorkersProvider implements AIProvider {
	name = "workers";

	async getResponse({
		model,
		messages,
		message,
		env,
		user,
		temperature,
		max_tokens,
		top_p,
		top_k,
		seed,
		repetition_penalty,
		frequency_penalty,
		presence_penalty,
	}: AIResponseParams) {
		if (!model) {
			throw new AssistantError("Missing model", ErrorType.PARAMS_ERROR);
		}

		const modelConfig = getModelConfigByMatchingModel(model);
		const type = modelConfig?.type || ["text"];
		const supportsFunctions = modelConfig?.supportsFunctions || false;

		const settings = {
			temperature,
			max_tokens,
			top_p,
			top_k,
			seed,
			repetition_penalty,
			frequency_penalty,
			presence_penalty,
		};

		const params: any = {
			...(type === "image" ? { prompt: message } : { messages }),
			...settings,
		};

		if (supportsFunctions) {
			params.tools = availableFunctions;
		}

		return trackProviderMetrics({
			provider: "workers",
			model,
			operation: async () => {
				// @ts-ignore
				const modelResponse = await env.AI.run(model, params, {
					gateway: {
						id: gatewayId,
						skipCache: false,
						cacheTtl: 3360,
						authorization: env.AI_GATEWAY_TOKEN,
						metadata: {
							email: user?.email,
						},
					},
				});

				return modelResponse;
			},
			analyticsEngine: env.ANALYTICS,
			settings,
		});
	}
}

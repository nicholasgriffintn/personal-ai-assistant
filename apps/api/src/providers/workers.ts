import { gatewayId } from "../constants/app";
import { mapParametersToProvider } from "../lib/chat/parameters";
import { getModelConfigByMatchingModel } from "../lib/models";
import { trackProviderMetrics } from "../lib/monitoring";
import { uploadImageFromChat } from "../lib/upload";
import type { ChatCompletionParameters } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import type { AIProvider } from "./base";

export class WorkersProvider implements AIProvider {
	name = "workers-ai";

	async getResponse(params: ChatCompletionParameters) {
		const { model, env, user } = params;

		if (!model) {
			throw new AssistantError("Missing model", ErrorType.PARAMS_ERROR);
		}

		const body = mapParametersToProvider(params, "workers-ai");

		return trackProviderMetrics({
			provider: "workers-ai",
			model,
			operation: async () => {
				// @ts-ignore
				const modelResponse = await env.AI.run(model, body, {
					gateway: {
						id: gatewayId,
						skipCache: false,
						cacheTtl: 3360,
						authorization: env.AI_GATEWAY_TOKEN,
						metadata: {
							email: user?.email || "anonymous@undefined.computer",
						},
					},
				});

				const modelConfig = getModelConfigByMatchingModel(model);
				const type = modelConfig?.type || ["text"];

				if (
					modelResponse &&
					(type.includes("text-to-image") || type.includes("image-to-image"))
				) {
					try {
						// @ts-ignore
						const upload = await uploadImageFromChat(modelResponse, env, model);

						return {
							response: "Image Generated.",
							data: upload,
						};
					} catch (error) {
						console.error(error);
						return "";
					}
				}

				return modelResponse;
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

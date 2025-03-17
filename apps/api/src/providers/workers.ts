import { gatewayId } from "../constants/app";
import { mapParametersToProvider } from "../lib/chat/parameters";
import { getModelConfigByMatchingModel } from "../lib/models";
import { trackProviderMetrics } from "../lib/monitoring";
import { uploadImageFromChat } from "../lib/upload";
import type { ChatCompletionParameters } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { BaseProvider } from "./base";

export class WorkersProvider extends BaseProvider {
	name = "workers-ai";

	protected validateParams(params: ChatCompletionParameters): void {
		super.validateParams(params);
	}

	protected getEndpoint(): string {
		return "";
	}

	protected getHeaders(): Record<string, string> {
		return {};
	}

	async getResponse(params: ChatCompletionParameters): Promise<any> {
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
					// @ts-ignore
					modelResponse?.image ||
					(modelResponse && type.includes("text-to-image")) ||
					type.includes("image-to-image")
				) {
					try {
						const imageKey = `generations/${params.completion_id}/${model}/${Date.now()}.png`;
						const upload = await uploadImageFromChat(
							// @ts-ignore
							modelResponse.image || modelResponse,
							env,
							imageKey,
						);

						if (!upload) {
							throw new AssistantError(
								"Failed to upload image",
								ErrorType.PROVIDER_ERROR,
							);
						}

						return {
							response: "Image Generated.",
							data: upload,
						};
					} catch (error) {
						console.error(error);
						return "";
					}
					// @ts-ignore - types of wrong
				} else if (modelResponse?.description) {
					return {
						// @ts-ignore - types of wrong
						response: modelResponse.description,
						data: modelResponse,
					};
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

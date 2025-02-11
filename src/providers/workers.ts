import { gatewayId } from "../constants/app";
import { getModelConfigByMatchingModel } from "../lib/models";
import { uploadImageFromChat } from "../lib/upload";
import { availableFunctions } from "../services/functions";
import type { AIResponseParams } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import type { AIProvider } from "./base";
import { trackProviderMetrics } from "../lib/monitoring";

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
			...(type.includes("image-to-text")
				? {
						prompt:
							typeof messages[0].content === "object" &&
							"text" in messages[0].content
								? messages[0].content.text
								: messages[0].content,
						image:
							typeof messages[0].content === "object" &&
							"image" in messages[0].content
								? messages[0].content.image
								: undefined,
					}
				: { messages }),
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

				if (modelResponse && type === "image") {
					try {
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
			settings,
		});
	}
}

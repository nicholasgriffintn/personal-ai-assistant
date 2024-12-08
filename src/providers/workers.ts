import { gatewayId } from "../lib/chat";
import { getModelConfigByMatchingModel } from "../lib/models";
import { uploadImageFromChat } from "../lib/upload";
import { availableFunctions } from "../services/functions";
import type { AIResponseParams } from "../types";
import type { Message } from "../types";
import { AppError } from "../utils/errors";
import type { AIProvider } from "./base";

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
			throw new AppError("Missing model", 400);
		}

		const modelConfig = getModelConfigByMatchingModel(model);
		const type = modelConfig?.type || ["text"];
		const supportsFunctions = modelConfig?.supportsFunctions || false;

		let params: {
			tools?: Record<string, any>[];
			messages?: Message[];
			prompt?: string;
			temperature?: number;
			max_tokens?: number;
			top_p?: number;
		};

		const defaultParams = {
			temperature,
			max_tokens,
			top_p,
			seed,
			repetition_penalty,
			frequency_penalty,
			presence_penalty,
		};

		if (type === "image") {
			params = {
				prompt: message,
				...defaultParams,
			};
		} else {
			params = {
				messages,
				...defaultParams,
			};
		}

		if (supportsFunctions) {
			params.tools = availableFunctions;
		}

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

		const isImageType =
			type.includes("text-to-image") || type.includes("image-to-image");
		if (modelResponse && isImageType) {
			try {
				const imageId = Math.random().toString(36);
				const imageKey = `${model}/${imageId}.png`;

				await uploadImageFromChat(modelResponse, env, imageKey);

				return {
					response: `Image Generated: [${imageId}](https://assistant-assets.nickgriffin.uk/${imageKey})`,
				};
			} catch (error) {
				console.error(error);
				return {
					response: "Could not generate image",
				};
			}
		}

		return modelResponse;
	}
}

import { AwsClient } from "aws4fetch";

import { gatewayId } from "../constants/app";
import { mapParametersToProvider } from "../lib/chat/parameters";
import { getModelConfigByMatchingModel } from "../lib/models";
import { trackProviderMetrics } from "../lib/monitoring";
import { uploadImageFromChat } from "../lib/upload";
import type { ChatCompletionParameters } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import type { AIProvider } from "./base";

export class BedrockProvider implements AIProvider {
	name = "bedrock";

	async getResponse(params: ChatCompletionParameters) {
		const { model, system_prompt, env } = params;

		if (!model) {
			throw new AssistantError("Missing model", ErrorType.PARAMS_ERROR);
		}

		const accessKey = env.BEDROCK_AWS_ACCESS_KEY;
		const secretKey = env.BEDROCK_AWS_SECRET_KEY;

		if (!accessKey || !secretKey || !env.AI_GATEWAY_TOKEN) {
			throw new AssistantError(
				"Missing AWS_ACCESS_KEY or AWS_SECRET_KEY or AI_GATEWAY_TOKEN",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		const region = "us-east-1";
		const bedrockUrl = `https://bedrock-runtime.${region}.amazonaws.com/model/${model}/invoke`;

		const body = mapParametersToProvider(params, "bedrock");

		return trackProviderMetrics({
			provider: "bedrock",
			model,
			operation: async () => {
				const awsClient = new AwsClient({
					accessKeyId: accessKey,
					secretAccessKey: secretKey,
					region,
					service: "bedrock",
				});

				const presignedRequest = await awsClient.sign(bedrockUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(body),
				});

				if (!presignedRequest.url) {
					throw new AssistantError(
						"Failed to get presigned request from Bedrock",
					);
				}

				const signedUrl = new URL(presignedRequest.url);
				signedUrl.host = "gateway.ai.cloudflare.com";
				signedUrl.pathname = `/v1/${env.ACCOUNT_ID}/${gatewayId}/aws-bedrock/bedrock-runtime/${region}/model/${model}/invoke`;

				const response = await fetch(signedUrl, {
					method: "POST",
					headers: presignedRequest.headers,
					body: JSON.stringify(body),
				});

				if (!response.ok) {
					throw new AssistantError("Failed to get response from Bedrock");
				}

				const data = (await response.json()) as any;

				const modelConfig = getModelConfigByMatchingModel(model);
				const type = modelConfig?.type || ["text"];
				const isImageType =
					type.includes("text-to-image") || type.includes("image-to-image");
				const isVideoType =
					type.includes("text-to-video") || type.includes("image-to-video");

				if (isVideoType) {
					return {
						response: data,
					};
				}

				if (isImageType) {
					const images = data.images;

					if (!images) {
						throw new AssistantError("No images returned from Bedrock");
					}

					const imageId = Math.random().toString(36);
					const imageKey = `${model}/${imageId}.png`;

					await uploadImageFromChat(images[0], env, imageKey);

					return {
						response: `Image Generated: [${imageId}](https://assistant-assets.nickgriffin.uk/${imageKey})`,
					};
				}

				if (!data.output.message.content[0].text) {
					throw new AssistantError("No content returned from Bedrock");
				}

				return {
					response: data.output.message.content[0].text,
				};
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

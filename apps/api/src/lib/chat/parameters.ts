import { availableFunctions } from "../../services/functions";
import type { ChatCompletionParameters, IBody, IEnv } from "../../types";
import { getModelConfigByMatchingModel } from "../models";

/**
 * Extracts chat completion parameters from request body
 */
export function extractChatParameters(
	request: IBody,
	env: IEnv,
): ChatCompletionParameters {
	return {
		model: request.model,
		version: request.version,
		messages: request.messages || [],
		temperature: request.temperature,
		top_p: request.top_p,
		n: request.n,
		stream: request.stream,
		stop: request.stop,
		max_tokens: request.max_tokens,
		presence_penalty: request.presence_penalty,
		frequency_penalty: request.frequency_penalty,
		repetition_penalty: request.repetition_penalty,
		logit_bias: request.logit_bias,
		metadata: request.metadata,
		completion_id: request.completion_id,
		reasoning_effort: request.reasoning_effort,
		should_think: request.should_think,
		store: request.store,
		use_rag: request.use_rag,
		rag_options: {
			topK: request.rag_options?.topK,
			scoreThreshold: request.rag_options?.scoreThreshold,
			type: request.rag_options?.type,
			namespace: request.rag_options?.namespace,
			includeMetadata: request.rag_options?.includeMetadata,
		},
		env: env,
	};
}

/**
 * Merges default parameters with user-provided parameters
 */
export function mergeParametersWithDefaults(
	params: Partial<ChatCompletionParameters>,
	defaults: Partial<ChatCompletionParameters> = {},
): ChatCompletionParameters {
	return {
		...defaults,
		...params,
		rag_options: {
			...defaults.rag_options,
			...params.rag_options,
		},
	} as ChatCompletionParameters;
}

/**
 * Provider-specific parameter transformations
 */
export function mapParametersToProvider(
	params: ChatCompletionParameters,
	providerName: string,
): Record<string, any> {
	const commonParams: Record<string, any> = {
		model: params.model,
		messages: params.messages,
		temperature: params.temperature,
		seed: params.seed,
		repetition_penalty: params.repetition_penalty,
		frequency_penalty: params.frequency_penalty,
		presence_penalty: params.presence_penalty,
		metadata: params.metadata,
		stream: params.stream,
	};

	if (providerName === "openai") {
		commonParams.max_completion_tokens = params.max_tokens || 4096;
	} else {
		commonParams.max_tokens = params.max_tokens || 4096;
	}

	let modelConfig = null;

	if (params.model) {
		modelConfig = getModelConfigByMatchingModel(params.model);
	}

	if (params.model && !params.disable_functions) {
		const supportsFunctions = modelConfig?.supportsFunctions || false;

		if (supportsFunctions) {
			commonParams.tools = availableFunctions.map((func) => ({
				type: "function",
				function: {
					name: func.name,
					description: func.description,
					parameters: func.parameters,
				},
			}));

			if (
				providerName === "openai" &&
				params.model !== "o1" &&
				params.model !== "o3-mini"
			) {
				commonParams.parallel_tool_calls = false;
			}
		}
	}

	if (params.model && params.should_think) {
	} else {
		commonParams.top_p = params.top_p;
	}

	switch (providerName) {
		case "workers-ai": {
			const type = modelConfig?.type || ["text"];
			return {
				...commonParams,
				stop: params.stop,
				n: params.n,
				random_seed: params.seed,
				...(type.includes("image-to-text") ||
				type.includes("image-to-image") ||
				type.includes("text-to-image")
					? {
							messages: undefined,
							prompt:
								typeof params.messages[0].content === "object" &&
								"text" in params.messages[0].content
									? params.messages[0].content.text
									: params.messages[0].content,
							image:
								typeof params.messages[0].content === "object" &&
								"image" in params.messages[0].content
									? params.messages[0].content.image
									: undefined,
						}
					: { messages: params.messages }),
			};
		}
		case "openai": {
			const newCommonParams = {
				...commonParams,
			};
			const supportsThinking = modelConfig?.hasThinking || false;
			if (supportsThinking) {
				newCommonParams.reasoning_effort = params.reasoning_effort;
			}
			return {
				...newCommonParams,
				store: params.store,
				logit_bias: params.logit_bias,
				n: params.n,
				stop: params.stop,
				user:
					typeof params.user === "string" ? params.user : params.user?.email,
			};
		}
		case "anthropic": {
			const newCommonParams = {
				...commonParams,
			};
			const supportsThinking = modelConfig?.hasThinking || false;
			if (supportsThinking) {
				newCommonParams.thinking = {
					type: "enabled",
					budget_tokens: calculateReasoningBudget(params),
				};
				newCommonParams.top_p = undefined;
			}
			return {
				...newCommonParams,
				system: params.system_prompt,
				stop_sequences: params.stop,
			};
		}
		case "deepseek": {
			return {
				...commonParams,
				messages: formatDeepSeekMessages(params),
			};
		}
		case "googlestudio":
			return {
				model: params.model,
				contents: formatGoogleStudioContents(params),
				systemInstruction: {
					role: "system",
					parts: [
						{
							text: params.system_prompt,
						},
					],
				},
				safetySettings: [
					{
						category: "HARM_CATEGORY_DANGEROUS_CONTENT",
						threshold: "BLOCK_NONE",
					},
					{ category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
					{ category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
					{
						category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
						threshold: "BLOCK_NONE",
					},
				],
				generationConfig: {
					temperature: params.temperature,
					maxOutputTokens: params.max_tokens,
					topP: params.top_p,
					topK: params.top_k,
					seed: params.seed,
					repetitionPenalty: params.repetition_penalty,
					frequencyPenalty: params.frequency_penalty,
					presencePenalty: params.presence_penalty,
					stopSequences: params.stop,
				},
			};
		case "bedrock": {
			const type = modelConfig?.type || ["text"];
			const isImageType =
				type.includes("text-to-image") || type.includes("image-to-image");
			const isVideoType =
				type.includes("text-to-video") || type.includes("image-to-video");

			if (isVideoType) {
				return {
					messages: params.messages,
					taskType: "TEXT_VIDEO",
					textToVideoParams: {
						text:
							typeof params.messages[params.messages.length - 1].content ===
							"string"
								? params.messages[params.messages.length - 1].content
								: // @ts-ignore
									params.messages[params.messages.length - 1].content[0].text ||
									"",
					},
					videoGenerationConfig: {
						durationSeconds: 6,
						fps: 24,
						dimension: "1280x720",
					},
				};
			}

			if (isImageType) {
				return {
					textToImageParams: {
						text:
							typeof params.messages[params.messages.length - 1].content ===
							"string"
								? params.messages[params.messages.length - 1].content
								: // @ts-ignore
									params.messages[params.messages.length - 1].content[0].text ||
									"",
					},
					taskType: "TEXT_IMAGE",
					imageGenerationConfig: {
						quality: "standard",
						width: 1280,
						height: 1280,
						numberOfImages: 1,
					},
				};
			}

			return {
				...(params.system_prompt && {
					system: [{ text: params.system_prompt }],
				}),
				messages: params.messages,
				inferenceConfig: {
					temperature: params.temperature,
					max_new_tokens: params.max_tokens,
					top_p: params.top_p,
					top_k: params.top_k,
					seed: params.seed,
					repetition_penalty: params.repetition_penalty,
					frequency_penalty: params.frequency_penalty,
					presence_penalty: params.presence_penalty,
					stop: params.stop,
				},
			};
		}
		default:
			return commonParams;
	}
}

/**
 * Helper function to calculate reasoning budget based on reasoning_effort
 */
function calculateReasoningBudget(params: ChatCompletionParameters): number {
	if (!params.max_tokens) return 1024;

	switch (params.reasoning_effort) {
		case "low":
			return Math.floor(params.max_tokens * 0.5);
		case "medium":
			return Math.floor(params.max_tokens * 0.75);
		case "high":
			return Math.floor(params.max_tokens * 0.9);
		default:
			return Math.floor(params.max_tokens * 0.75);
	}
}

/**
 * Format messages for DeepSeek models
 */
function formatDeepSeekMessages(params: ChatCompletionParameters): any[] {
	return params.messages.map((message) => ({
		role: message.role,
		content: message.content,
	}));
}

/**
 * Format messages for Google Studio models
 */
function formatGoogleStudioContents(params: ChatCompletionParameters): any[] {
	const contents = [];

	if (params.system_prompt) {
		contents.push({
			role: "system",
			parts: [{ text: params.system_prompt }],
		});
	}

	// biome-ignore lint/complexity/noForEach: It Works.
	params.messages.forEach((message) => {
		contents.push({
			role: message.role,
			parts: [{ text: message.content }],
		});
	});

	return contents;
}

import type { ModelConfig } from "../../types";
import { createModelConfig, createModelConfigObject } from "./utils";

const PROVIDER = "openai";

export const openaiModelConfig: ModelConfig = createModelConfigObject([
	createModelConfig("o1", PROVIDER, {
		name: "OpenAI o1",
		matchingModel: "o1",
		description:
			"Advanced model with exceptional capabilities in coding, analysis, math, reasoning, and multilingual support. Features a 200k context window and high reliability.",
		type: ["text"],
		supportsFunctions: true,
		card: "https://www.prompthub.us/models/o1",
		contextWindow: 200000,
		maxTokens: 100000,
		costPer1kInputTokens: 0.015,
		costPer1kOutputTokens: 0.06,
		strengths: ["coding", "analysis", "math", "reasoning", "multilingual"],
		contextComplexity: 5,
		reliability: 5,
		speed: 1,
		multimodal: true,
		isFeatured: true,
		includedInRouter: true,
		hasThinking: true,
		supportsResponseFormat: true,
	}),

	createModelConfig("o3-mini", PROVIDER, {
		name: "OpenAI o3 Mini",
		matchingModel: "o3-mini",
		description: "Fast, flexible, intelligent reasoning model",
		type: ["text"],
		card: "https://www.prompthub.us/models/o3-mini",
		contextWindow: 200000,
		maxTokens: 100000,
		costPer1kInputTokens: 0.0011,
		costPer1kOutputTokens: 0.0044,
		strengths: ["coding", "analysis", "math", "reasoning", "multilingual"],
		contextComplexity: 4,
		reliability: 4,
		speed: 3,
		isFeatured: true,
		includedInRouter: true,
		hasThinking: true,
		supportsResponseFormat: true,
	}),

	createModelConfig("gpt-4o", PROVIDER, {
		name: "OpenAI GPT-4o",
		matchingModel: "gpt-4o",
		description:
			"Enhanced GPT model with 128k context window, specialized in analysis, chat, coding, and multilingual tasks.",
		type: ["text"],
		supportsFunctions: true,
		card: "https://www.prompthub.us/models/gpt-4o",
		contextWindow: 128000,
		maxTokens: 16484,
		costPer1kInputTokens: 0.0025,
		costPer1kOutputTokens: 0.01,
		strengths: ["analysis", "chat", "coding", "multilingual"],
		contextComplexity: 4,
		reliability: 4,
		speed: 4,
		multimodal: true,
		isFeatured: true,
		includedInRouter: true,
		supportsResponseFormat: true,
	}),

	createModelConfig("gpt-4o-mini", PROVIDER, {
		name: "OpenAI GPT-4o Mini",
		matchingModel: "gpt-4o-mini",
		description:
			"Efficient version of GPT-4o optimized for faster response times while maintaining core capabilities.",
		type: ["text"],
		supportsFunctions: true,
		card: "https://www.prompthub.us/models/gpt-4o-mini",
		contextWindow: 128000,
		maxTokens: 16484,
		costPer1kInputTokens: 0.00015,
		costPer1kOutputTokens: 0.0006,
		strengths: ["analysis", "chat", "coding", "multilingual"],
		contextComplexity: 3,
		reliability: 3,
		speed: 5,
		isFeatured: true,
		includedInRouter: true,
		supportsResponseFormat: true,
	}),

	createModelConfig("gpt-4-turbo", PROVIDER, {
		name: "OpenAI GPT-4 Turbo",
		matchingModel: "gpt-4-turbo",
		type: ["text"],
		supportsFunctions: true,
	}),

	createModelConfig("gpt-4", PROVIDER, {
		name: "OpenAI GPT-4",
		matchingModel: "gpt-4",
		type: ["text"],
		supportsFunctions: true,
	}),

	createModelConfig("gpt-4.5", PROVIDER, {
		name: "OpenAI GPT-4.5",
		matchingModel: "gpt-4.5-preview",
		description:
			"GPT-4.5 excels at tasks that benefit from creative, open-ended thinking and conversation, such as writing, learning, or exploring new ideas.",
		type: ["text"],
		supportsFunctions: true,
		card: "https://platform.openai.com/docs/models/gpt-4.5-preview",
		contextWindow: 128000,
		maxTokens: 4096,
		costPer1kInputTokens: 0.01,
		costPer1kOutputTokens: 0.03,
		strengths: ["coding", "analysis", "reasoning", "multilingual"],
		contextComplexity: 5,
		reliability: 5,
		speed: 4,
		multimodal: true,
		isFeatured: true,
		includedInRouter: true,
		supportsResponseFormat: true,
	}),

	createModelConfig("gpt-3.5-turbo", PROVIDER, {
		name: "OpenAI GPT-3.5 Turbo",
		matchingModel: "gpt-3.5-turbo",
		type: ["text"],
	}),
]);

import type { ModelConfig, ModelConfigItem, ChatMode } from "../types";

export const defaultModel = "mistral-small";

export const webLLMModels: ModelConfig = {
	"Llama-3.2-1B-Instruct-q4f32_1-MLC": {
		id: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
		matchingModel: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
		name: "Llama 3.2 1B Instruct (Q4F32)",
		description: "Quantized Llama 3.2 1B model optimized for web browsers",
		strengths: ["text-generation"],
		provider: "web-llm",
		type: ["text"],
	},
	"Llama-3.2-3B-Instruct-q4f32_1-MLC": {
		id: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
		matchingModel: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
		name: "Llama 3.2 3B Instruct (Q4F32)",
		description: "Quantized Llama 3.2 3B model optimized for web browsers",
		strengths: ["text-generation"],
		provider: "web-llm",
		type: ["text"],
	},
	"Llama-3.1-8B-Instruct-q4f32_1-MLC": {
		id: "Llama-3.1-8B-Instruct-q4f32_1-MLC",
		matchingModel: "Llama-3.1-8B-Instruct-q4f32_1-MLC",
		name: "Llama 3.1 8B Instruct (Q4F32)",
		description: "Quantized Llama 3.1 8B model optimized for web browsers",
		strengths: ["text-generation"],
		provider: "web-llm",
		type: ["text"],
	},
	"Mistral-7B-Instruct-v0.3-q4f16_1-MLC": {
		id: "Mistral-7B-Instruct-v0.3-q4f16_1-MLC",
		matchingModel: "Mistral-7B-Instruct-v0.3-q4f16_1-MLC",
		name: "Mistral 7B Instruct v0.3 (Q4F16)",
		description: "Latest Mistral 7B v0.3 model optimized for web browsers",
		strengths: ["text-generation"],
		provider: "web-llm",
		type: ["text"],
	},
	"gemma-2-2b-it-q4f32_1-MLC": {
		id: "gemma-2-2b-it-q4f32_1-MLC",
		matchingModel: "gemma-2-2b-it-q4f32_1-MLC",
		name: "Gemma 2 2B IT (Q4F32)",
		description: "Google's Gemma 2B instruction-tuned model",
		strengths: ["text-generation"],
		provider: "web-llm",
		type: ["text"],
	},
	"gemma-2-9b-it-q4f32_1-MLC": {
		id: "gemma-2-9b-it-q4f32_1-MLC",
		matchingModel: "gemma-2-9b-it-q4f32_1-MLC",
		name: "Gemma 2 9B IT (Q4F32)",
		description: "Google's Gemma 9B instruction-tuned model",
		strengths: ["text-generation"],
		provider: "web-llm",
		type: ["text"],
	},
	"SmolLM2-1.7B-Instruct-q4f16_1-MLC": {
		id: "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
		matchingModel: "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
		name: "SmolLM2 1.7B Instruct (Q4F16)",
		description: "Efficient small language model optimized for web browsers",
		strengths: ["text-generation"],
		provider: "web-llm",
		type: ["text"],
	},
	"TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC": {
		id: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
		matchingModel: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
		name: "TinyLlama 1.1B Chat v1.0 (Q4F16)",
		description: "Efficient tiny language model optimized for web browsers",
		strengths: ["text-generation"],
		provider: "web-llm",
		type: ["text"],
	},
};

export function getAvailableModels(apiModels: ModelConfig) {
	return { ...webLLMModels, ...apiModels };
}

export function getFeaturedModelIds(models: ModelConfig) {
	return Object.entries(models).reduce((acc, [key, model]) => {
		if (model.isFeatured) {
			acc[key] = {
				...model,
				id: key,
			};
		}
		return acc;
	}, {} as Record<string, ModelConfigItem>);
}

export function getModelsByMode(models: ModelConfig, mode: ChatMode) {
	return Object.entries(models).reduce((acc, [key, model]) => {
		if (mode === "local" ? model.provider === "web-llm" : model.provider !== "web-llm") {
			acc[key] = {
				...model,
				id: key,
			};
		}
		return acc;
	}, {} as Record<string, ModelConfigItem>);
}
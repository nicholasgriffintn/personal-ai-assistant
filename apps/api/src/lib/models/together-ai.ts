import type { ModelConfig } from "../../types";

export const togetherAiModelConfig: ModelConfig = {
	"meta-llama/Llama-3.3-70B-Instruct-Turbo": {
		name: "Meta Llama 3.3 70B Instruct Turbo",
		matchingModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
		provider: "together-ai",
		type: ["text"],
		costPer1kOutputTokens: 0.00088,
		costPer1kInputTokens: 0.00088,
	},
	"meta-llama/Llama-3.3-8B-Instruct-Turbo": {
		name: "Meta Llama 3.3 8B Instruct Turbo",
		matchingModel: "meta-llama/Llama-3.3-8B-Instruct-Turbo",
		provider: "together-ai",
		type: ["text"],
		costPer1kOutputTokens: 0.0035,
		costPer1kInputTokens: 0.0035,
	},
	"meta-llama/Llama-3.3-70B-Instruct-Turbo-Free": {
		name: "Meta Llama 3.3 70B Instruct Turbo Free",
		matchingModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
		provider: "together-ai",
		type: ["text"],
		isFree: true,
	},
	"meta-llama/Llama-Vision-Free": {
		name: "Meta Llama Vision Free",
		matchingModel: "meta-llama/Llama-Vision-Free",
		provider: "together-ai",
		type: ["image-to-text"],
		isFree: true,
		multimodal: true,
	},
	"deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free": {
		name: "DeepSeek R1 Distill Llama 70B Free",
		matchingModel: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
		provider: "together-ai",
		type: ["text"],
		isFree: true,
	},
};

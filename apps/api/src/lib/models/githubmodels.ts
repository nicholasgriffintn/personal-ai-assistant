import type { ModelConfig } from "../../types";

export const githubModelsConfig: ModelConfig = {
	"Phi-3.5-MoE-instruct": {
		name: "Phi 3.5 MoE Instruct",
		matchingModel: "Phi-3.5-MoE-instruct",
		provider: "github-models",
		type: ["text"],
		card: "https://github.com/marketplace/models/azureml/Phi-3-5-MoE-instruct",
		contextWindow: 131000,
		maxTokens: 4096,
		costPer1kInputTokens: 0,
		costPer1kOutputTokens: 0,
		strengths: ["reasoning", "multilingual", "coding", "analysis"],
		contextComplexity: 4,
		reliability: 5,
		speed: 3,
		isFeatured: true,
		includedInRouter: true,
	},
	"Phi-3.5-mini-instruct": {
		name: "Phi 3.5 Mini Instruct",
		matchingModel: "Phi-3.5-mini-instruct",
		provider: "github-models",
		type: ["text"],
	},
	"Phi-3.5-vision-instruct": {
		name: "Phi 3.5 Vision Instruct",
		matchingModel: "Phi-3.5-vision-instruct",
		provider: "github-models",
		type: ["image-to-text"],
	},
};

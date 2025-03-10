import type { ModelConfig } from "../../types";

export const huggingfaceModelConfig: ModelConfig = {
	"smollm2-1.7b-instruct": {
		name: "HuggingFace SmolLM2 1.7B Instruct",
		matchingModel: "HuggingFaceTB/SmolLM2-1.7B-Instruct",
		provider: "huggingface",
		type: ["text"],
		isFree: true,
	},
};

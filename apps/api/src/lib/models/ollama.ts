import type { ModelConfig } from "../../types";

export const ollamaModelConfig: ModelConfig = {
	"ollama-llama-3.2-1b": {
		name: "Ollama Llama 3.2 1B",
		matchingModel: "llama3.2:1b",
		provider: "ollama",
		type: ["text"],
	},
	"ollama-llama-3.2-3b": {
		name: "Ollama Llama 3.2 3B",
		matchingModel: "llama3.2:3b",
		provider: "ollama",
		type: ["text"],
	},
};

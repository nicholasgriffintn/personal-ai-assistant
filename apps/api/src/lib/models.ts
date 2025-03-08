import type { ModelConfig } from "../types";

export const availableCapabilities = [
	"coding",
	"math",
	"creative",
	"analysis",
	"chat",
	"search",
	"multilingual",
	"reasoning",
	"vision",
	"summarization",
] as const;

export const availableModelTypes = [
	"text",
	"coding",
	"speech",
	"image-to-text",
	"image-to-image",
	"text-to-image",
	"embedding",
	"instruct",
	"text-to-video",
	"image-to-video",
] as const;

const modelConfig: ModelConfig = {
	auto: {
		matchingModel: "openrouter/auto",
		provider: "openrouter",
		type: ["text"],
	},
	"deepseek-chat": {
		matchingModel: "deepseek/deepseek-chat",
		provider: "openrouter",
		type: ["text"],
		card: "https://www.prompthub.us/models/deepseek-v3",
		contextWindow: 64000,
		maxTokens: 8000,
		costPer1kInputTokens: 0.00014,
		costPer1kOutputTokens: 0.00028,
		strengths: ["reasoning", "multilingual", "coding", "analysis"],
		contextComplexity: 4,
		reliability: 5,
		speed: 3,
		isFeatured: true,
		includedInRouter: true,
	},
	"deepseek-reasoner": {
		matchingModel: "deepseek-reasoner",
		provider: "deepseek",
		type: ["text"],
		card: "https://www.prompthub.us/models/deepseek-reasoner-r1",
		contextWindow: 64000,
		maxTokens: 8000,
		costPer1kInputTokens: 0.00055,
		costPer1kOutputTokens: 0.00219,
		strengths: ["reasoning", "multilingual", "coding", "analysis"],
		contextComplexity: 4,
		reliability: 5,
		speed: 3,
		isFeatured: true,
		includedInRouter: true,
	},
	"deepseek-coder-6.7b": {
		matchingModel: "@hf/thebloke/deepseek-coder-6.7b-instruct-awq",
		provider: "workers-ai",
		type: ["coding"],
		card: "https://www.prompthub.us/models/deepseek-coder-6.7b",
		contextWindow: 64000,
		maxTokens: 8000,
		costPer1kInputTokens: 0.00014,
		costPer1kOutputTokens: 0.00028,
	},
	"pixtral-large": {
		matchingModel: "pixtral-large-latest",
		provider: "mistral",
		type: ["image-to-text"],
		supportsFunctions: true,
		isFree: true,
		card: "https://www.prompthub.us/models/pixtral",
		contextWindow: 128000,
		maxTokens: 4096,
		costPer1kInputTokens: 0.0002,
		costPer1kOutputTokens: 0.0006,
		strengths: ["vision", "multilingual"],
		contextComplexity: 4,
		reliability: 4,
		speed: 3,
		isFeatured: true,
		includedInRouter: true,
	},
	codestral: {
		matchingModel: "codestral-latest",
		provider: "mistral",
		type: ["coding"],
		isFree: true,
		card: "https://www.prompthub.us/models/codestral",
		contextWindow: 32000,
		maxTokens: 4096,
		costPer1kInputTokens: 0.0002,
		costPer1kOutputTokens: 0.0006,
		strengths: ["coding", "multilingual"],
		contextComplexity: 4,
		reliability: 4,
		speed: 3,
		isFeatured: true,
		includedInRouter: true,
	},
	"mistral-large": {
		matchingModel: "mistral-large-latest",
		provider: "mistral",
		type: ["text"],
		supportsFunctions: true,
		isFree: true,
		card: "https://www.prompthub.us/models/mistral-large",
		contextWindow: 128000,
		maxTokens: 4096,
		costPer1kInputTokens: 0.002,
		costPer1kOutputTokens: 0.006,
		strengths: ["chat", "analysis", "creative"],
		contextComplexity: 4,
		reliability: 4,
		speed: 3,
		isFeatured: true,
		includedInRouter: true,
	},
	"mistral-small": {
		matchingModel: "mistral-small-latest",
		provider: "mistral",
		type: ["text"],
		supportsFunctions: true,
		isFree: true,
		card: "https://www.prompthub.us/models/mistral-small",
		contextWindow: 32768,
		maxTokens: 4096,
		costPer1kInputTokens: 0.002,
		costPer1kOutputTokens: 0.006,
		strengths: ["chat", "analysis", "creative", "multilingual"],
		contextComplexity: 3,
		reliability: 3,
		speed: 4,
		isFeatured: true,
		includedInRouter: true,
	},
	"mistral-nemo": {
		matchingModel: "open-mistral-nemo",
		provider: "mistral",
		type: ["text"],
		supportsFunctions: true,
		isFree: true,
		card: "https://www.prompthub.us/models/mistral-nemo",
		contextWindow: 32768,
		maxTokens: 4096,
		costPer1kInputTokens: 0.00015,
		costPer1kOutputTokens: 0.00015,
		strengths: ["chat", "analysis", "creative", "multilingual"],
		contextComplexity: 3,
		reliability: 3,
		speed: 4,
		isFeatured: true,
		includedInRouter: true,
	},
	"llama-3.1-sonar-small-128k-online": {
		matchingModel: "llama-3.1-sonar-small-128k-online",
		provider: "perplexity-ai",
		type: ["text"],
		card: "https://www.prompthub.us/models/llama-3-1-sonar-small",
		contextWindow: 127000,
		maxTokens: 127000,
		costPer1kInputTokens: 0.0002,
		costPer1kOutputTokens: 0.0002,
		strengths: ["chat", "analysis", "search"],
		contextComplexity: 3,
		reliability: 3,
		speed: 4,
		isFeatured: true,
		includedInRouter: true,
	},
	"llama-3.1-sonar-large-128k-online": {
		matchingModel: "llama-3.1-sonar-large-128k-online",
		provider: "perplexity-ai",
		type: ["text"],
		card: "https://www.prompthub.us/models/llama-3-1-sonar-large",
		contextWindow: 127000,
		maxTokens: 127000,
		costPer1kInputTokens: 0.001,
		costPer1kOutputTokens: 0.001,
		strengths: ["chat", "analysis", "search"],
		contextComplexity: 4,
		reliability: 4,
		speed: 3,
		isFeatured: true,
		includedInRouter: true,
	},
	"llama-3.1-sonar-huge-128k-online": {
		matchingModel: "llama-3.1-sonar-huge-128k-online",
		provider: "perplexity-ai",
		type: ["text"],
		card: "https://www.prompthub.us/models/llama-3-1-sonar-huge",
		contextWindow: 127000,
		maxTokens: 127000,
		costPer1kInputTokens: 0.005,
		costPer1kOutputTokens: 0.005,
		strengths: ["chat", "analysis", "search"],
		contextComplexity: 5,
		reliability: 4,
		speed: 3,
		isFeatured: true,
		includedInRouter: true,
	},
	"claude-3.5-sonnet": {
		matchingModel: "claude-3-5-sonnet-latest",
		provider: "anthropic",
		type: ["text"],
	},
	"claude-3.7-sonnet": {
		matchingModel: "claude-3-7-sonnet-latest",
		provider: "anthropic",
		type: ["text"],
		card: "https://www.prompthub.us/models/claude-3-7-sonnet",
		contextWindow: 200000,
		maxTokens: 8192,
		costPer1kInputTokens: 0.003,
		costPer1kOutputTokens: 0.015,
		strengths: ["chat", "analysis", "coding", "reasoning", "creative"],
		contextComplexity: 5,
		reliability: 5,
		speed: 4,
		multimodal: true,
		isFeatured: true,
		includedInRouter: true,
	},
	"claude-3.5-haiku": {
		matchingModel: "claude-3-5-haiku-latest",
		provider: "anthropic",
		type: ["text"],
		card: "https://www.prompthub.us/models/claude-3-5-haiku",
		contextWindow: 80000,
		maxTokens: 8192,
		costPer1kInputTokens: 0.001,
		costPer1kOutputTokens: 0.005,
		strengths: ["chat", "analysis", "reasoning", "creative"],
		contextComplexity: 3,
		reliability: 3,
		speed: 5,
		isFeatured: true,
		includedInRouter: true,
	},
	"claude-3-opus": {
		matchingModel: "claude-3-opus-latest",
		provider: "anthropic",
		type: ["text"],
		card: "https://www.prompthub.us/models/claude-3-opus",
		contextWindow: 200000,
		maxTokens: 4096,
		costPer1kInputTokens: 0.015,
		costPer1kOutputTokens: 0.075,
		strengths: ["chat", "analysis", "reasoning", "creative"],
		contextComplexity: 5,
		reliability: 5,
		speed: 3,
		multimodal: true,
		isFeatured: true,
		includedInRouter: true,
	},
	o1: {
		matchingModel: "o1",
		provider: "openai",
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
	},
	"o3-mini": {
		matchingModel: "o3-mini",
		provider: "openai",
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
	},
	"gpt-4o": {
		matchingModel: "gpt-4o",
		provider: "openai",
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
	},
	"gpt-4o-mini": {
		matchingModel: "gpt-4o-mini",
		provider: "openai",
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
	},
	"gpt-4-turbo": {
		matchingModel: "gpt-4-turbo",
		provider: "openai",
		type: ["text"],
		supportsFunctions: true,
	},
	"gpt-4": {
		matchingModel: "gpt-4",
		provider: "openai",
		type: ["text"],
		supportsFunctions: true,
	},
	"gpt-4.5": {
		matchingModel: "gpt-4.5-preview",
		provider: "openai",
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
	},
	"gpt-3.5-turbo": {
		matchingModel: "gpt-3.5-turbo",
		provider: "openai",
		type: ["text"],
	},
	whisper: {
		matchingModel: "@cf/openai/whisper",
		provider: "workers-ai",
		type: ["speech"],
	},
	"gemini-2.0-flash": {
		matchingModel: "google/gemini-2.0-flash-001",
		provider: "openrouter",
		type: ["text"],
		card: "https://www.prompthub.us/models/gemini-2-0-flash",
		contextWindow: 1048576,
		maxTokens: 8192,
		costPer1kInputTokens: 0,
		costPer1kOutputTokens: 0,
		strengths: ["coding", "analysis", "math", "multilingual"],
		contextComplexity: 4,
		reliability: 4,
		speed: 3,
		supportsFunctions: true,
		multimodal: true,
		isFeatured: true,
		includedInRouter: true,
	},
	"gemini-1.5-flash": {
		matchingModel: "google/gemini-flash-1.5",
		provider: "openrouter",
		type: ["text"],
	},
	"gemini-1.5-pro": {
		matchingModel: "google/gemini-pro-1.5",
		provider: "openrouter",
		type: ["text"],
	},
	"gemini-1.5-flash-8b": {
		matchingModel: "google/gemini-flash-1.5-8b",
		provider: "openrouter",
		type: ["text"],
	},
	"gemini-2-0-pro": {
		matchingModel: "google/gemini-2.0-pro-exp-02-05:free",
		provider: "openrouter",
		type: ["text"],
		isBeta: true,
		card: "https://www.prompthub.us/models/gemini-2-0-pro",
	},
	"llama3-groq-70b": {
		matchingModel: "llama3-groq-70b-8192-tool-use-preview",
		provider: "groq",
		type: ["text"],
		supportsFunctions: true,
	},
	"llama3-groq-8b": {
		matchingModel: "llama3-groq-8b-8192-tool-use-preview",
		provider: "groq",
		type: ["text"],
		supportsFunctions: true,
	},
	"llama-3.3-70b-versatile": {
		matchingModel: "llama-3.3-70b-versatile",
		provider: "groq",
		type: ["text"],
		card: "https://www.prompthub.us/models/llama-3-3-70b",
		contextWindow: 128000,
		maxTokens: 2048,
		costPer1kInputTokens: 0.00023,
		costPer1kOutputTokens: 0.0004,
		strengths: ["chat", "analysis", "creative", "multilingual"],
		contextComplexity: 4,
		reliability: 4,
		speed: 4,
		isFeatured: true,
		includedInRouter: true,
	},
	"llama-3.3-70b-specdec": {
		matchingModel: "llama-3.3-70b-specdec",
		provider: "groq",
		type: ["text"],
		card: "https://www.prompthub.us/models/llama-3-3-70b",
		contextWindow: 128000,
		maxTokens: 2048,
		costPer1kInputTokens: 0.00023,
		costPer1kOutputTokens: 0.0004,
		strengths: ["chat", "analysis", "creative", "multilingual"],
		contextComplexity: 4,
		reliability: 4,
		speed: 5,
		isFeatured: true,
		includedInRouter: true,
	},
	"Phi-3.5-MoE-instruct": {
		matchingModel: "Phi-3.5-MoE-instruct",
		provider: "github-models",
		type: ["text"],
		card: "https://github.com/marketplace/models/azureml/Phi-3-5-MoE-instruct",
		contextWindow: 131000,
		maxTokens: 4096,
		costPer1kInputTokens: 0,
		costPer1kOutputTokens: 0,
		strengths: ["reasoning", "multilingual", "coding", "analysis", "analysis"],
		contextComplexity: 4,
		reliability: 5,
		speed: 3,
		isFeatured: true,
		includedInRouter: true,
	},
	"phi-2": {
		matchingModel: "@cf/microsoft/phi-2",
		provider: "workers-ai",
		type: ["text"],
	},
	"Phi-3.5-mini-instruct": {
		matchingModel: "Phi-3.5-mini-instruct",
		provider: "github-models",
		type: ["text"],
	},
	"Phi-3.5-vision-instruct": {
		matchingModel: "Phi-3.5-vision-instruct",
		provider: "github-models",
		type: ["image-to-text"],
	},
	"llama-3.3-70b-instruct": {
		matchingModel: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
		provider: "workers-ai",
		type: ["text"],
	},
	"llama-3.2-1b-instruct": {
		matchingModel: "@cf/meta/llama-3.2-1b-instruct",
		provider: "workers-ai",
		type: ["text"],
	},
	"llama-3.2-3b-instruct": {
		matchingModel: "@cf/meta/llama-3.2-3b-instruct",
		provider: "workers-ai",
		type: ["text"],
	},
	"llama-3.1-70b-instruct": {
		matchingModel: "@cf/meta/llama-3.1-70b-instruct",
		provider: "workers-ai",
		type: ["text"],
	},
	"ollama-llama-3.2-1b": {
		matchingModel: "llama3.2:1b",
		provider: "ollama",
		type: ["text"],
	},
	"ollama-llama-3.2-3b": {
		matchingModel: "llama3.2:3b",
		provider: "ollama",
		type: ["text"],
	},
	"hermes-2-pro-mistral-7b": {
		matchingModel: "@hf/nousresearch/hermes-2-pro-mistral-7b",
		provider: "workers-ai",
		type: ["text"],
		supportsFunctions: true,
		isFree: true,
		isFeatured: true,
	},
	grok: {
		matchingModel: "grok-beta",
		provider: "grok",
		type: ["text"],
	},
	"embed-english": {
		matchingModel: "cohere.embed-english-v3",
		provider: "bedrock",
		type: ["embedding"],
	},
	"embed-multilingual": {
		matchingModel: "cohere.embed-multilingual-v3",
		provider: "bedrock",
		type: ["embedding"],
	},
	command: {
		matchingModel: "cohere.command-text-v14",
		provider: "bedrock",
		type: ["text", "instruct"],
	},
	"command-light": {
		matchingModel: "cohere.command-light-text-v14",
		provider: "bedrock",
		type: ["text", "instruct"],
	},
	"command-r": {
		matchingModel: "cohere.command-r-v1:0",
		provider: "bedrock",
		strengths: ["summarization"],
		type: ["text"],
	},
	"command-r-plus": {
		matchingModel: "cohere.command-r-plus-v1:0",
		provider: "bedrock",
		strengths: ["summarization"],
		type: ["text"],
	},
	"titan-image-generator": {
		matchingModel: "amazon.titan-image-generator-v1",
		provider: "bedrock",
		type: ["text-to-image", "image-to-image"],
	},
	"titan-multimodal-embeddings": {
		matchingModel: "amazon.titan-embed-image-v1",
		provider: "bedrock",
		type: ["embedding"],
	},
	"titan-text-embeddings": {
		matchingModel: "amazon.titan-embed-text-v2:0",
		provider: "bedrock",
		type: ["embedding"],
	},
	"titan-text-express": {
		matchingModel: "amazon.titan-text-express-v1",
		provider: "bedrock",
		type: ["text", "coding", "instruct"],
	},
	"titan-text-lite": {
		matchingModel: "amazon.titan-text-lite-v1",
		provider: "bedrock",
		type: ["text", "coding"],
	},
	"titan-text-premier": {
		matchingModel: "amazon.titan-text-premier-v1:0",
		provider: "bedrock",
		type: ["text", "coding"],
	},
	"nova-canvas": {
		matchingModel: "amazon.nova-canvas-v1:0",
		provider: "bedrock",
		type: ["image-to-image"],
	},
	"nova-lite": {
		matchingModel: "amazon.nova-lite-v1:0",
		provider: "bedrock",
		type: ["text"],
	},
	"nova-micro": {
		matchingModel: "amazon.nova-micro-v1:0",
		provider: "bedrock",
		type: ["text"],
	},
	"nova-pro": {
		matchingModel: "amazon.nova-pro-v1:0",
		provider: "bedrock",
		type: ["text"],
	},
	"nova-reel": {
		matchingModel: "amazon.nova-reel-v1:0",
		provider: "bedrock",
		type: ["text-to-video", "image-to-video"],
	},
	"jamba-large": {
		matchingModel: "ai21.jamba-1-5-large-v1:0",
		provider: "bedrock",
		type: ["text", "instruct"],
	},
	"jamba-mini": {
		matchingModel: "ai21.jamba-1-5-mini-v1:0",
		provider: "bedrock",
		type: ["text", "instruct"],
	},
	"jambda-instruct": {
		matchingModel: "ai21.jamba-instruct-v1:0",
		provider: "bedrock",
		strengths: ["summarization"],
		type: ["text", "instruct"],
	},
	"smollm2-1.7b-instruct": {
		matchingModel: "HuggingFaceTB/SmolLM2-1.7B-Instruct",
		provider: "huggingface",
		type: ["text"],
		isFree: true,
	},
	qwq: {
		matchingModel: "qwen/qwq-32b-preview",
		provider: "openrouter",
		type: ["text"],
	},
	"mythomax-l2-13b": {
		matchingModel: "gryphe/mythomax-l2-13b",
		provider: "openrouter",
		type: ["text"],
	},
	llava: {
		matchingModel: "@cf/llava-hf/llava-1.5-7b-hf",
		provider: "workers-ai",
		type: ["image-to-text"],
	},
	flux: {
		matchingModel: "@cf/black-forest-labs/flux-1-schnell",
		provider: "workers-ai",
		type: ["text-to-image"],
	},
	"stable-diffusion-1.5-img2img": {
		matchingModel: "@cf/runwayml/stable-diffusion-v1-5-img2img",
		provider: "workers-ai",
		type: ["image-to-image"],
	},
	"stable-diffusion-1.5-inpainting": {
		matchingModel: "@cf/runwayml/stable-diffusion-v1-5-inpainting",
		provider: "workers-ai",
		type: ["image-to-image"],
	},
	"stable-diffusion-xl-base-1.0": {
		matchingModel: "@cf/stabilityai/stable-diffusion-xl-base-1.0",
		provider: "workers-ai",
		type: ["text-to-image"],
	},
	"stable-diffusion-xl-lightning": {
		matchingModel: "@cf/bytedance/stable-diffusion-xl-lightning",
		provider: "workers-ai",
		type: ["text-to-image"],
	},
	openchat: {
		matchingModel: "@cf/openchat/openchat-3.5-0106",
		provider: "workers-ai",
		type: ["text"],
		isFree: true,
	},
	sqlcoder: {
		matchingModel: "@cf/defog/sqlcoder-7b-2",
		provider: "workers-ai",
		type: ["coding"],
		isFree: true,
	},
	tinyllama: {
		matchingModel: "@cf/tinyllama/tinyllama-1.1b-chat-v1.0",
		provider: "workers-ai",
		type: ["text"],
		isFree: true,
	},
	"una-cybertron-7b-v2": {
		matchingModel: "@cf/fblgit/una-cybertron-7b-v2-bf16",
		provider: "workers-ai",
		type: ["text"],
		isFree: true,
	},
	"bge-large-en-v1.5": {
		matchingModel: "@cf/baai/bge-base-en-v1.5",
		provider: "workers-ai",
		type: ["embedding"],
	},
};

export const defaultModel = "mistral-large";

export function getModelConfig(model?: string) {
	return (model && modelConfig[model]) || modelConfig[defaultModel];
}

export function getModelConfigByModel(model: string) {
	return model && modelConfig[model as keyof typeof modelConfig];
}

export function getMatchingModel(model: string = defaultModel) {
	return model && getModelConfig(model).matchingModel;
}

export function getModelConfigByMatchingModel(matchingModel: string) {
	for (const model in modelConfig) {
		if (
			modelConfig[model as keyof typeof modelConfig].matchingModel ===
			matchingModel
		) {
			return modelConfig[model as keyof typeof modelConfig];
		}
	}
	return null;
}

export function getModels() {
	return modelConfig;
}

export function getFreeModels() {
	return Object.entries(modelConfig).reduce((acc, [key, model]) => {
		if (model.isFree) {
			acc[key] = model;
		}
		return acc;
	}, {} as typeof modelConfig);
}

export function getFeaturedModels() {
	return Object.entries(modelConfig).reduce((acc, [key, model]) => {
		if (model.isFeatured) {
			acc[key] = model;
		}
		return acc;
	}, {} as typeof modelConfig);
}

export function getIncludedInRouterModels() {
	return Object.entries(modelConfig).reduce((acc, [key, model]) => {
		if (model.includedInRouter) {
			acc[key] = model;
		}
		return acc;
	}, {} as typeof modelConfig);
}

export function getModelsByCapability(capability: string) {
	return Object.entries(modelConfig).reduce((acc, [key, model]) => {
		if (model.strengths?.includes(capability as (typeof availableCapabilities)[number])) {
			acc[key] = model;
		}
		return acc;
	}, {} as typeof modelConfig);
}

export function getModelsByType(type: string) {
	return Object.entries(modelConfig).reduce((acc, [key, model]) => {
		if (model.type?.includes(type as (typeof availableModelTypes)[number])) {
			acc[key] = model;
		}
		return acc;
	}, {} as typeof modelConfig);
}

import type { Model, ModelConfig, ModelCapabilities } from "../types";

export const availableCapabilities = [
	"coding",
	"math",
	"creative",
	"analysis",
	"chat",
	"search",
	"multilingual",
	"reasoning",
] as const;

export const modelCapabilities: Record<string, ModelCapabilities> = {
	'gemini-2.0-flash-exp': {
		card: 'https://www.prompthub.us/models/gemini-2-0-flash',
		contextWindow: 1048576,
		maxTokens: 8192,
		costPer1kInputTokens: 0,
		costPer1kOutputTokens: 0,
		strengths: ['coding', 'analysis', 'math', 'multilingual'],
		contextComplexity: 4,
		reliability: 4,
		speed: 3,
		supportsFunctions: true,
		multimodal: true,
	},
	'o1-preview': {
		card: 'https://www.prompthub.us/models/o1-preview',
		contextWindow: 128000,
		maxTokens: 32800,
		costPer1kInputTokens: 0.015,
		costPer1kOutputTokens: 0.06,
		strengths: ['coding', 'analysis', 'math', 'reasoning', 'multilingual'],
		contextComplexity: 5,
		reliability: 4,
		speed: 2,
	},
	'o1-mini': {
		card: 'https://www.prompthub.us/models/o1-mini',
		contextWindow: 16384,
		maxTokens: 65500,
		costPer1kInputTokens: 0.003,
		costPer1kOutputTokens: 0.012,
		strengths: ['coding', 'analysis', 'math', 'reasoning', 'multilingual'],
		contextComplexity: 4,
		reliability: 4,
		speed: 3,
	},
	'gpt-4o': {
		card: 'https://www.prompthub.us/models/gpt-4o',
		contextWindow: 128000,
		maxTokens: 16484,
		costPer1kInputTokens: 0.0025,
		costPer1kOutputTokens: 0.01,
		strengths: ['analysis', 'chat', 'coding', 'multilingual'],
		contextComplexity: 4,
		reliability: 4,
		speed: 4,
		multimodal: true,
		supportsFunctions: true,
	},
	'gpt-4o-mini': {
		card: 'https://www.prompthub.us/models/gpt-4o-mini',
		contextWindow: 128000,
		maxTokens: 16484,
		costPer1kInputTokens: 0.00015,
		costPer1kOutputTokens: 0.0006,
		strengths: ['analysis', 'chat', 'coding', 'multilingual'],
		contextComplexity: 3,
		reliability: 3,
		speed: 5,
		supportsFunctions: true,
	},
	'claude-3.5-sonnet': {
		card: 'https://www.prompthub.us/models/claude-3-5-sonnet',
		contextWindow: 200000,
		maxTokens: 8192,
		costPer1kInputTokens: 0.003,
		costPer1kOutputTokens: 0.015,
		strengths: ['chat', 'analysis', 'coding', 'reasoning', 'creative'],
		contextComplexity: 5,
		reliability: 5,
		speed: 4,
		multimodal: true,
	},
	'claude-3.5-haiku': {
		card: 'https://www.prompthub.us/models/claude-3-5-haiku',
		contextWindow: 80000,
		maxTokens: 8192,
		costPer1kInputTokens: 0.001,
		costPer1kOutputTokens: 0.005,
		strengths: ['chat', 'analysis', 'reasoning', 'creative'],
		contextComplexity: 3,
		reliability: 3,
		speed: 5,
	},
	'claude-3-opus': {
		card: 'https://www.prompthub.us/models/claude-3-opus',
		contextWindow: 200000,
		maxTokens: 4096,
		costPer1kInputTokens: 0.015,
		costPer1kOutputTokens: 0.075,
		strengths: ['chat', 'analysis', 'reasoning', 'creative'],
		contextComplexity: 5,
		reliability: 5,
		speed: 3,
		multimodal: true,
	},
	'llama-3.1-sonar-small-128k-online': {
		card: 'https://www.prompthub.us/models/llama-3-1-sonar-small',
		contextWindow: 127000,
		maxTokens: 127000,
		costPer1kInputTokens: 0.0002,
		costPer1kOutputTokens: 0.0002,
		strengths: ['chat', 'analysis', 'search'],
		contextComplexity: 3,
		reliability: 3,
		speed: 4,
	},
	'llama-3.1-sonar-large-128k-online': {
		card: 'https://www.prompthub.us/models/llama-3-1-sonar-large',
		contextWindow: 127000,
		maxTokens: 127000,
		costPer1kInputTokens: 0.001,
		costPer1kOutputTokens: 0.001,
		strengths: ['chat', 'analysis', 'search'],
		contextComplexity: 4,
		reliability: 4,
		speed: 3,
	},
	'llama-3.1-sonar-huge-128k-online': {
		card: 'https://www.prompthub.us/models/llama-3-1-sonar-huge',
		contextWindow: 127000,
		maxTokens: 127000,
		costPer1kInputTokens: 0.005,
		costPer1kOutputTokens: 0.005,
		strengths: ['chat', 'analysis', 'search'],
		contextComplexity: 5,
		reliability: 4,
		speed: 3,
	},
	'mistral-large': {
		card: 'https://www.prompthub.us/models/mistral-large',
		contextWindow: 128000,
		maxTokens: 4096,
		costPer1kInputTokens: 0.002,
		costPer1kOutputTokens: 0.006,
		strengths: ['chat', 'analysis', 'creative'],
		contextComplexity: 4,
		reliability: 4,
		speed: 3,
		supportsFunctions: true,
	},
	'mistral-small': {
		card: 'https://www.prompthub.us/models/mistral-small',
		contextWindow: 32768,
		maxTokens: 4096,
		costPer1kInputTokens: 0.002,
		costPer1kOutputTokens: 0.006,
		strengths: ['chat', 'analysis', 'creative', 'multilingual'],
		contextComplexity: 3,
		reliability: 3,
		speed: 4,
		supportsFunctions: true,
	},
	'mistral-nemo': {
		card: 'https://www.prompthub.us/models/mistral-nemo',
		contextWindow: 32768,
		maxTokens: 4096,
		costPer1kInputTokens: 0.00015,
		costPer1kOutputTokens: 0.00015,
		strengths: ['chat', 'analysis', 'creative', 'multilingual'],
		contextComplexity: 3,
		reliability: 3,
		speed: 4,
		supportsFunctions: true,
	},
	'llama-3.3-70b-versatile': {
		card: 'https://www.prompthub.us/models/llama-3-3-70b',
		contextWindow: 128000,
		maxTokens: 2048,
		costPer1kInputTokens: 0.00023,
		costPer1kOutputTokens: 0.0004,
		strengths: ['chat', 'analysis', 'creative', 'multilingual'],
		contextComplexity: 4,
		reliability: 4,
		speed: 4,
	},
	'llama-3.3-70b-specdec': {
		card: 'https://www.prompthub.us/models/llama-3-3-70b',
		contextWindow: 128000,
		maxTokens: 2048,
		costPer1kInputTokens: 0.00023,
		costPer1kOutputTokens: 0.0004,
		strengths: ['chat', 'analysis', 'creative', 'multilingual'],
		contextComplexity: 4,
		reliability: 4,
		speed: 5,
	},
	codestral: {
		card: 'https://www.prompthub.us/models/codestral',
		contextWindow: 32000,
		maxTokens: 4096,
		costPer1kInputTokens: 0.0002,
		costPer1kOutputTokens: 0.0006,
		strengths: ['coding', 'multilingual'],
		contextComplexity: 4,
		reliability: 4,
		speed: 3,
	},
};

const modelConfig: ModelConfig = {
	auto: {
		matchingModel: 'openrouter/auto',
		provider: 'openrouter',
		type: ['text'],
	},
	'o1-preview': {
		matchingModel: 'o1-preview',
		provider: 'openai',
		type: ['text'],
	},
	'o1-mini': {
		matchingModel: 'o1-mini',
		provider: 'openai',
		type: ['text'],
	},
	'gpt-4o': {
		matchingModel: 'gpt-4o',
		provider: 'openai',
		type: ['text'],
		supportsFunctions: true,
	},
	'gpt-4o-mini': {
		matchingModel: 'gpt-4o-mini',
		provider: 'openai',
		type: ['text'],
		supportsFunctions: true,
	},
	'gpt-4-turbo': {
		matchingModel: 'gpt-4-turbo',
		provider: 'openai',
		type: ['text'],
		supportsFunctions: true,
	},
	'gpt-4': {
		matchingModel: 'gpt-4',
		provider: 'openai',
		type: ['text'],
		supportsFunctions: true,
	},
	'gpt-3.5-turbo': {
		matchingModel: 'gpt-3.5-turbo',
		provider: 'openai',
		type: ['text'],
	},
	'claude-3.5-sonnet': {
		matchingModel: 'claude-3-5-sonnet-latest',
		provider: 'anthropic',
		type: ['text'],
	},
	'claude-3.5-haiku': {
		matchingModel: 'claude-3-5-haiku-latest',
		provider: 'anthropic',
		type: ['text'],
	},
	'claude-3-opus': {
		matchingModel: 'claude-3-opus-latest',
		provider: 'anthropic',
		type: ['text'],
	},
	'llama-3.3-70b-instruct': {
		matchingModel: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
		provider: 'cloudflare',
		type: ['text'],
	},
	'llama-3.2-1b-instruct': {
		matchingModel: '@cf/meta/llama-3.2-1b-instruct',
		provider: 'cloudflare',
		type: ['text'],
	},
	'llama-3.2-3b-instruct': {
		matchingModel: '@cf/meta/llama-3.2-3b-instruct',
		provider: 'cloudflare',
		type: ['text'],
	},
	'llama-3.1-70b-instruct': {
		matchingModel: '@cf/meta/llama-3.1-70b-instruct',
		provider: 'cloudflare',
		type: ['text'],
	},
	'llama3-groq-70b': {
		matchingModel: 'llama3-groq-70b-8192-tool-use-preview',
		provider: 'groq',
		type: ['text'],
		supportsFunctions: true,
	},
	'llama3-groq-8b': {
		matchingModel: 'llama3-groq-8b-8192-tool-use-preview',
		provider: 'groq',
		type: ['text'],
		supportsFunctions: true,
	},
	'llama-3.3-70b-versatile': {
		matchingModel: 'llama-3.3-70b-versatile',
		provider: 'groq',
		type: ['text'],
	},
	'llama-3.3-70b-specdec': {
		matchingModel: 'llama-3.3-70b-specdec',
		provider: 'groq',
		type: ['text'],
	},
	'hermes-2-pro-mistral-7b': {
		matchingModel: '@hf/nousresearch/hermes-2-pro-mistral-7b',
		provider: 'cloudflare',
		type: ['text'],
		supportsFunctions: true,
	},
	llava: {
		matchingModel: '@cf/llava-hf/llava-1.5-7b-hf',
		provider: 'cloudflare',
		type: ['image-to-image'],
	},
	grok: {
		matchingModel: 'grok-beta',
		provider: 'grok',
		type: ['text'],
	},
	'smollm2-1.7b-instruct': {
		matchingModel: 'HuggingFaceTB/SmolLM2-1.7B-Instruct',
		provider: 'huggingface',
		type: ['text'],
	},
	'llama-3.1-sonar-small-128k-online': {
		matchingModel: 'llama-3.1-sonar-small-128k-online',
		provider: 'perplexity-ai',
		type: ['text'],
	},
	'llama-3.1-sonar-large-128k-online': {
		matchingModel: 'llama-3.1-sonar-large-128k-online',
		provider: 'perplexity-ai',
		type: ['text'],
	},
	'llama-3.1-sonar-huge-128k-online': {
		matchingModel: 'llama-3.1-sonar-huge-128k-online',
		provider: 'perplexity-ai',
		type: ['text'],
	},
	flux: {
		matchingModel: '@cf/black-forest-labs/flux-1-schnell',
		provider: 'cloudflare',
		type: ['text-to-image'],
	},
	'stable-diffusion-1.5-img2img': {
		matchingModel: '@cf/runwayml/stable-diffusion-v1-5-img2img',
		provider: 'cloudflare',
		type: ['image-to-image'],
	},
	'stable-diffusion-1.5-inpainting': {
		matchingModel: '@cf/runwayml/stable-diffusion-v1-5-inpainting',
		provider: 'cloudflare',
		type: ['image-to-image'],
	},
	'stable-diffusion-xl-base-1.0': {
		matchingModel: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
		provider: 'cloudflare',
		type: ['text-to-image'],
	},
	'stable-diffusion-xl-lightning': {
		matchingModel: '@cf/bytedance/stable-diffusion-xl-lightning',
		provider: 'cloudflare',
		type: ['text-to-image'],
	},
	whisper: {
		matchingModel: '@cf/openai/whisper',
		provider: 'cloudflare',
		type: ['speech'],
	},
	openchat: {
		matchingModel: '@cf/openchat/openchat-3.5-0106',
		provider: 'cloudflare',
		type: ['text'],
	},
	'phi-2': {
		matchingModel: '@cf/microsoft/phi-2',
		provider: 'cloudflare',
		type: ['text'],
	},
	sqlcoder: {
		matchingModel: '@cf/defog/sqlcoder-7b-2',
		provider: 'cloudflare',
		type: ['coding'],
	},
	tinyllama: {
		matchingModel: '@cf/tinyllama/tinyllama-1.1b-chat-v1.0',
		provider: 'cloudflare',
		type: ['text'],
	},
	'una-cybertron-7b-v2': {
		matchingModel: '@cf/fblgit/una-cybertron-7b-v2-bf16',
		provider: 'cloudflare',
		type: ['text'],
	},
	'deepseek-coder-6.7b': {
		matchingModel: '@hf/thebloke/deepseek-coder-6.7b-instruct-awq',
		provider: 'cloudflare',
		type: ['coding'],
	},
	'pixtral-large': {
		matchingModel: 'pixtral-large-latest',
		provider: 'mistral',
		type: ['image-to-image'],
		supportsFunctions: true,
	},
	codestral: {
		matchingModel: 'codestral-latest',
		provider: 'mistral',
		type: ['coding'],
	},
	'mistral-large': {
		matchingModel: 'mistral-large-latest',
		provider: 'mistral',
		type: ['text'],
		supportsFunctions: true,
	},
	'mistral-small': {
		matchingModel: 'mistral-small-latest',
		provider: 'mistral',
		type: ['text'],
		supportsFunctions: true,
	},
	'mistral-nemo': {
		matchingModel: 'open-mistral-nemo',
		provider: 'mistral',
		type: ['text'],
		supportsFunctions: true,
	},
	'gemini-2.0-flash': {
		matchingModel: 'google/gemini-2.0-flash-exp:free',
		provider: 'openrouter',
		type: ['text'],
	},
	'gemini-1.5-flash': {
		matchingModel: 'gemini-1.5-flash',
		provider: 'google-ai-studio',
		type: ['text'],
	},
	'gemini-1.5-pro': {
		matchingModel: 'gemini-1.5-pro',
		provider: 'google-ai-studio',
		type: ['text'],
	},
	'gemini-1.5-flash-8b': {
		matchingModel: 'gemini-1.5-flash-8b',
		provider: 'google-ai-studio',
		type: ['text'],
	},
	'gemini-experimental-1206': {
		matchingModel: 'google/gemini-exp-1206:free',
		provider: 'openrouter',
		type: ['text'],
		isBeta: true,
	},
	'bge-large-en-v1.5': {
		matchingModel: '@cf/baai/bge-base-en-v1.5',
		provider: 'cloudflare',
		type: ['embedding'],
	},
	'embed-english': {
		matchingModel: 'cohere.embed-english-v3',
		provider: 'bedrock',
		type: ['embedding'],
	},
	'embed-multilingual': {
		matchingModel: 'cohere.embed-multilingual-v3',
		provider: 'bedrock',
		type: ['embedding'],
	},
	command: {
		matchingModel: 'cohere.command-text-v14',
		provider: 'bedrock',
		type: ['text', 'instruct'],
	},
	'command-light': {
		matchingModel: 'cohere.command-light-text-v14',
		provider: 'bedrock',
		type: ['text', 'instruct'],
	},
	'command-r': {
		matchingModel: 'cohere.command-r-v1:0',
		provider: 'bedrock',
		type: ['nlp', 'text', 'summarization'],
	},
	'command-r-plus': {
		matchingModel: 'cohere.command-r-plus-v1:0',
		provider: 'bedrock',
		type: ['nlp', 'text', 'summarization'],
	},
	'titan-image-generator': {
		matchingModel: 'amazon.titan-image-generator-v1',
		provider: 'bedrock',
		type: ['text-to-image', 'image-to-image'],
	},
	'titan-multimodal-embeddings': {
		matchingModel: 'amazon.titan-embed-image-v1',
		provider: 'bedrock',
		type: ['embedding'],
	},
	'titan-text-embeddings': {
		matchingModel: 'amazon.titan-embed-text-v2:0',
		provider: 'bedrock',
		type: ['embedding'],
	},
	'titan-text-express': {
		matchingModel: 'amazon.titan-text-express-v1',
		provider: 'bedrock',
		type: ['text', 'coding', 'instruct'],
	},
	'titan-text-lite': {
		matchingModel: 'amazon.titan-text-lite-v1',
		provider: 'bedrock',
		type: ['text', 'coding'],
	},
	'titan-text-premier': {
		matchingModel: 'amazon.titan-text-premier-v1:0',
		provider: 'bedrock',
		type: ['text', 'coding'],
	},
	'nova-canvas': {
		matchingModel: 'amazon.nova-canvas-v1:0',
		provider: 'bedrock',
		type: ['image-to-image'],
	},
	'nova-lite': {
		matchingModel: 'amazon.nova-lite-v1:0',
		provider: 'bedrock',
		type: ['text', 'image-to-text', 'video-to-text'],
	},
	'nova-micro': {
		matchingModel: 'amazon.nova-micro-v1:0',
		provider: 'bedrock',
		type: ['text'],
	},
	'nova-pro': {
		matchingModel: 'amazon.nova-pro-v1:0',
		provider: 'bedrock',
		type: ['text', 'image-to-text', 'video-to-text'],
	},
	'nova-reel': {
		matchingModel: 'amazon.nova-reel-v1:0',
		provider: 'bedrock',
		type: ['text-to-video', 'image-to-video'],
	},
	'jamba-large': {
		matchingModel: 'ai21.jamba-1-5-large-v1:0',
		provider: 'bedrock',
		type: ['text', 'instruct'],
	},
	'jamba-mini': {
		matchingModel: 'ai21.jamba-1-5-mini-v1:0',
		provider: 'bedrock',
		type: ['text', 'instruct'],
	},
	'jambda-instruct': {
		matchingModel: 'ai21.jamba-instruct-v1:0',
		provider: 'bedrock',
		type: ['text', 'instruct', 'summarization'],
	},
	qwq: {
		matchingModel: 'qwen/qwq-32b-preview',
		provider: 'openrouter',
		type: ['text'],
	},
};

export const defaultModel = "mistral-large";

export function getModelConfig(model?: Model) {
	return (model && modelConfig[model]) || modelConfig[defaultModel];
}

export function getMatchingModel(model: Model = defaultModel) {
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

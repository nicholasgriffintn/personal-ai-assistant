import type { Model, ModelConfig } from '../types';

const modelConfig: ModelConfig = {
	'claude-3-5-sonnet': {
		matchingModel: 'claude-3-5-sonnet-20241022',
		provider: 'anthropic',
		type: 'text',
	},
	'claude-3.5-haiku': {
		matchingModel: 'claude-3.5-haiku-20241022',
		provider: 'anthropic',
		type: 'text',
	},
	'claude-3.5-opus': {
		matchingModel: 'claude-3.5-opus-20240229',
		provider: 'anthropic',
		type: 'text',
	},
	'llama-3.2-1b-instruct': {
		matchingModel: '@cf/meta/llama-3.2-1b-instruct',
		provider: 'cloudflare',
		type: 'text',
	},
	'llama-3.2-3b-instruct': {
		matchingModel: '@cf/meta/llama-3.2-3b-instruct',
		provider: 'cloudflare',
		type: 'text',
	},
	'llama-3.1-70b-instruct': {
		matchingModel: '@cf/meta/llama-3.1-70b-instruct',
		provider: 'cloudflare',
		type: 'text',
	},
	'hermes-2-pro-mistral-7b': {
		matchingModel: '@hf/nousresearch/hermes-2-pro-mistral-7b',
		provider: 'cloudflare',
		type: 'text',
	},
	grok: {
		matchingModel: 'grok-beta',
		provider: 'grok',
		type: 'text',
	},
	'mistral-nemo': {
		matchingModel: 'mistralai/Mistral-Nemo-Instruct-2407',
		provider: 'huggingface',
		type: 'text',
	},
	'smollm2-1.7b-instruct': {
		matchingModel: 'HuggingFaceTB/SmolLM2-1.7B-Instruct',
		provider: 'huggingface',
		type: 'text',
	},
	'llama-3.1-sonar-small-128k-online': {
		matchingModel: 'llama-3.1-sonar-small-128k-online',
		provider: 'perplexity-ai',
		type: 'text',
	},
	'llama-3.1-sonar-large-128k-online': {
		matchingModel: 'llama-3.1-sonar-large-128k-online',
		provider: 'perplexity-ai',
		type: 'text',
	},
	'llama-3.1-sonar-huge-128k-online': {
		matchingModel: 'llama-3.1-sonar-huge-128k-online',
		provider: 'perplexity-ai',
		type: 'text',
	},
	flux: {
		matchingModel: '@cf/black-forest-labs/flux-1-schnell',
		provider: 'cloudflare',
		type: 'text',
	},
	'stable-diffusion-1.5-img2img': {
		matchingModel: '@cf/runwayml/stable-diffusion-v1-5-img2img',
		provider: 'cloudflare',
		type: 'image',
	},
	'stable-diffusion-1.5-inpainting': {
		matchingModel: '@cf/runwayml/stable-diffusion-v1-5-inpainting',
		provider: 'cloudflare',
		type: 'image',
	},
	'stable-diffusion-cl-base-1.0': {
		matchingModel: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
		provider: 'cloudflare',
		type: 'image',
	},
	'stable-diffusion-xl-lightning': {
		matchingModel: '@cf/bytedance/stable-diffusion-xl-lightning',
		provider: 'cloudflare',
		type: 'image',
	},
	whisper: {
		matchingModel: '@cf/openai/whisper-3.5-0106',
		provider: 'cloudflare',
		type: 'speech',
	},
	openchat: {
		matchingModel: '@cf/openchat/openchat-3.5-0106',
		provider: 'cloudflare',
		type: 'text',
	},
	'phi-2': {
		matchingModel: '@cf/microsoft/phi-2',
		provider: 'cloudflare',
		type: 'text',
	},
	sqlcoder: {
		matchingModel: '@cf/defog/sqlcoder-7b-2',
		provider: 'cloudflare',
		type: 'coding',
	},
	tinyllama: {
		matchingModel: '@cf/tinyllama/tinyllama-1.1b-chat-v1.0',
		provider: 'cloudflare',
		type: 'text',
	},
	'una-cybertron-7b-v2': {
		matchingModel: '@cf/fblgit/una-cybertron-7b-v2-bf16',
		provider: 'cloudflare',
		type: 'text',
	},
	'deepseek-coder-6.7b': {
		matchingModel: '@hf/thebloke/deepseek-coder-6.7b-instruct-awq',
		provider: 'cloudflare',
		type: 'coding',
	},
};

export function getModelConfig(model?: Model) {
	return (model && modelConfig[model]) || modelConfig['hermes-2-pro-mistral-7b'];
}

export function getMatchingModel(model?: Model) {
	return model && getModelConfig(model).matchingModel;
}

export function getModelConfigByMatchingModel(matchingModel: string) {
	for (const model in modelConfig) {
		if (modelConfig[model as keyof typeof modelConfig].matchingModel === matchingModel) {
			return modelConfig[model as keyof typeof modelConfig];
		}
	}
	return null;
}

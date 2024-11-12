import type { Model } from '../types';

export function getMatchingModel(model?: Model) {
	switch (model) {
		case 'claude-3-5-sonnet':
			return 'claude-3-5-sonnet-20241022';
		case 'claude-3.5-haiku':
			return 'claude-3.5-haiku-20241022';
		case 'claude-3.5-opus':
			return 'claude-3.5-opus-20240229';
		case 'llama-3.2-3b-instruct':
			return '@cf/meta/llama-3.2-3b-instruct';
		case 'llama-3.1-70b-instruct':
			return '@cf/meta/llama-3.1-70b-instruct';
		case 'hermes-2-pro-mistral-7b':
			return '@hf/nousresearch/hermes-2-pro-mistral-7b';
		case 'grok':
			return 'grok-beta';
		case 'mistral-nemo':
			return 'mistralai/Mistral-Nemo-Instruct-2407';
		case 'smollm2-1.7b-instruct':
			return 'HuggingFaceTB/SmolLM2-1.7B-Instruct';
		case 'llama-3.1-sonar-small-128k-online':
			return 'llama-3.1-sonar-small-128k-online';
		case 'llama-3.1-sonar-large-128k-online':
			return 'llama-3.1-sonar-large-128k-online';
		case 'llama-3.1-sonar-huge-128k-online':
			return 'llama-3.1-sonar-huge-128k-online';
		case 'flux':
			return 'black-forest-labs/flux-1.1-pro-ultra';
		default:
			return '@hf/nousresearch/hermes-2-pro-mistral-7b';
	}
}

export function getProviderFromModel(model: string) {
	switch (model) {
		case 'claude-3-5-sonnet-20241022':
			return 'anthropic';
		case 'claude-3.5-haiku-20241022':
			return 'anthropic';
		case 'claude-3.5-opus-20240229':
			return 'anthropic';
		case 'grok-beta':
			return 'grok';
		case 'mistralai/Mistral-Nemo-Instruct-2407':
			return 'huggingface';
		case 'HuggingFaceTB/SmolLM2-1.7B-Instruct':
			return 'huggingface';
		case 'llama-3.1-sonar-small-128k-online':
			return 'perplexity-ai';
		case 'llama-3.1-sonar-large-128k-online':
			return 'perplexity-ai';
		case 'llama-3.1-sonar-huge-128k-online':
			return 'perplexity-ai';
		case 'black-forest-labs/flux-1.1-pro-ultra':
			return 'replicate';
		default:
			return 'cloudflare';
	}
}

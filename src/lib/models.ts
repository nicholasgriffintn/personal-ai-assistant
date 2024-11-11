import type { Model } from '../types';

export function getMatchingModel(model?: Model) {
	switch (model) {
		case 'claude-3-5-sonnet':
			return 'claude-3-5-sonnet-20241022';
		case 'claude-3.5-haiku':
			return 'claude-3.5-haiku';
		case 'claude-3.5-opus':
			return 'claude-3.5-opus';
		case 'llama-3.2-3b-instruct':
			return '@cf/meta/llama-3.2-3b-instruct';
		case 'llama-3.1-70b-instruct':
			return '@cf/meta/llama-3.1-70b-instruct';
		case 'hermes-2-pro-mistral-7b':
			return '@hf/nousresearch/hermes-2-pro-mistral-7b';
		default:
			return '@hf/nousresearch/hermes-2-pro-mistral-7b';
	}
}

export function getProviderFromModel(model: string) {
	switch (model) {
		case 'claude-3-5-sonnet-20241022':
			return 'anthropic';
		case 'claude-3.5-haiku':
			return 'anthropic';
		case 'claude-3.5-opus':
			return 'anthropic';
		default:
			return 'cloudflare';
	}
}

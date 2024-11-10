type Model = 'llama-3.1-70b-instruct' | 'llama-3.2-3b-instruct' | 'hermes-2-pro-mistral-7b';

export function getMatchingModel(model?: Model) {
	switch (model) {
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

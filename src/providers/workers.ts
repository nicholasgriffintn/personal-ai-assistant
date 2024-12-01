import { AIProvider } from './base';
import { getModelConfigByMatchingModel } from '../lib/models';
import { availableFunctions } from '../services/functions';
import { gatewayId } from '../lib/chat';
import type { AIResponseParams } from '../lib/chat';
import type { Message } from '../types';

export class WorkersProvider implements AIProvider {
	name = 'workers';

	async getResponse({ model, messages, message, env, user }: AIResponseParams) {
		if (!model) {
			throw new Error('Missing model');
		}

		const modelConfig = getModelConfigByMatchingModel(model);
		const type = modelConfig?.type || 'text';
		const supportsFunctions = model === '@hf/nousresearch/hermes-2-pro-mistral-7b';

		// Prepare parameters based on model type
		const params: {
			tools?: Record<string, any>[];
			messages?: Message[];
			prompt?: string;
		} = {};

		if (type === 'image') {
			params['prompt'] = message;
		} else {
			params['messages'] = messages;
		}

		if (supportsFunctions) {
			params['tools'] = availableFunctions;
		}

		// Call AI service
		const modelResponse = await env.AI.run(model, params, {
			gateway: {
				id: gatewayId,
				skipCache: false,
				cacheTtl: 3360,
				authorization: env.AI_GATEWAY_TOKEN,
				metadata: {
					email: user?.email,
				},
			},
		});

		// Handle image type responses
		if (modelResponse && type === 'image') {
			try {
				const imageId = Math.random().toString(36);
				const imageKey = `${model}/${imageId}.png`;

				const reader = modelResponse.getReader();
				const chunks = [];
				let done, value;
				while ((({ done, value } = await reader.read()), !done)) {
					chunks.push(value);
				}
				const arrayBuffer = new Uint8Array(chunks.reduce((acc, chunk) => acc.concat(Array.from(chunk)), [])).buffer;
				const length = arrayBuffer.byteLength;

				await env.ASSETS_BUCKET.put(imageKey, arrayBuffer, {
					contentType: 'image/png',
					contentLength: length,
				});

				return {
					response: `Image Generated: [${imageId}](https://assistant-assets.nickgriffin.uk/${imageKey})`,
				};
			} catch (error) {
				console.error(error);
				return '';
			}
		}

		return modelResponse;
	}
}

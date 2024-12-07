import { AIProvider } from './base';
import { getModelConfigByMatchingModel } from '../lib/models';
import { availableFunctions } from '../services/functions';
import { gatewayId } from '../lib/chat';
import type { AIResponseParams } from '../types';
import type { Message } from '../types';

export class WorkersProvider implements AIProvider {
	name = 'workers';

	async getResponse({ model, messages, message, env, user, temperature, max_tokens, top_p }: AIResponseParams) {
		if (!model) {
			throw new Error('Missing model');
		}

		const modelConfig = getModelConfigByMatchingModel(model);
		const type = modelConfig?.type || 'text';
		const supportsFunctions = model === '@hf/nousresearch/hermes-2-pro-mistral-7b';

		let params: {
			tools?: Record<string, any>[];
			messages?: Message[];
			prompt?: string;
			temperature?: number;
			max_tokens?: number;
			top_p?: number;
		};

		if (type === 'image') {
			params = {
				prompt: message,
				temperature,
				max_tokens,
				top_p,
			};
		} else {
			params = {
				messages,
				temperature,
				max_tokens,
				top_p,
			};
		}

		console.log(JSON.stringify(params, null, 2));

		if (supportsFunctions) {
			params.tools = availableFunctions;
		}

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

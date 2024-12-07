import { AIProvider } from './base';
import { getModelConfigByMatchingModel } from '../lib/models';
import { availableFunctions } from '../services/functions';
import { gatewayId } from '../lib/chat';
import type { AIResponseParams } from '../types';
import type { Message } from '../types';
import { uploadImageFromChat } from '../lib/upload';

export class WorkersProvider implements AIProvider {
	name = 'workers';

	async getResponse({ model, messages, message, env, user, temperature, max_tokens, top_p }: AIResponseParams) {
		if (!model) {
			throw new Error('Missing model');
		}

		const modelConfig = getModelConfigByMatchingModel(model);
		const type = modelConfig?.type || 'text';
		const supportsFunctions = modelConfig?.supportsFunctions || false;

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

		const isImageType = type === 'text-to=image' || type === 'image-to-image';
		if (modelResponse && isImageType) {
			try {
				const imageId = Math.random().toString(36);
				const imageKey = `${model}/${imageId}.png`;

				await uploadImageFromChat(modelResponse, env, imageKey);

				return {
					response: `Image Generated: [${imageId}](https://assistant-assets.nickgriffin.uk/${imageKey})`,
				};
			} catch (error) {
				console.error(error);
				return {
					response: 'Could not generate image',
				};
			}
		}

		return modelResponse;
	}
}

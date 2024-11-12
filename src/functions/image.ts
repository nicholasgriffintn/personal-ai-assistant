import { IFunction, IRequest } from '../types';
import { getReplicateAIResponse } from '../lib/chat';

export const create_image: IFunction = {
	name: 'create_image',
	description: 'Generate an image from a prompt using Replicate',
	parameters: {
		type: 'object',
		properties: {
			prompt: {
				type: 'string',
				description: 'the exact prompt passed in',
			},
			negative_prompt: {
				type: 'string',
				description: 'the negative prompt that should be passed in to the LLM',
			},
			width: {
				type: 'integer',
				description: 'The width of the image if defined in the prompt. Defaults to 1024, must be less than or equal to 1280.',
			},
			height: {
				type: 'integer',
				description: 'The height of the image if defined in the prompt. Defaults to 1024, must be less than or equal to 1280.',
			},
			num_outputs: {
				type: 'integer',
				description: 'The number of images to generate. Defaults to 1.',
			},
			guidance_scale: {
				type: 'integer',
				description:
					'This is the requested guidance scale for the image in a numeric value. Default to 0 if none is defined in the prompt, must be be greater than or equal to 1.',
			},
		},
		required: ['prompt'],
	},
	function: async (chatId: string, args: any, req: IRequest, appUrl?: string) => {
		const { prompt } = args;

		if (!prompt) {
			return {
				status: 'error',
				name: 'create_image',
				content: 'Missing prompt',
				data: {},
			};
		}

		const imageData = await getReplicateAIResponse({
			chatId,
			appUrl,
			version: '5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637',
			messages: [
				{
					role: 'user',
					content: {
						...args,
					},
				},
			],
			env: req.env,
		});

		const data = {
			status: 'success',
			name: 'create_image',
			content: 'Image generated successfully',
			data: imageData,
		};

		return data;
	},
};

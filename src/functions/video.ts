import { IFunction, IRequest } from '../types';
import { getReplicateAIResponse } from '../lib/chat';

export const create_video: IFunction = {
	name: 'create_video',
	description: 'Generate a video from a prompt using Replicate',
	parameters: {
		type: 'object',
		properties: {
			prompt: {
				type: 'string',
				description: 'the main prompt that should be passed in to the LLM',
			},
			negative_prompt: {
				type: 'string',
				description: 'the negative prompt that should be passed in to the LLM',
			},
			init_video: {
				type: 'string',
				description: 'the initial video that should be passed in to the LLM',
			},
			init_weight: {
				type: 'number',
				description: 'the strength of init_video, defaults to 0.5',
			},
			guidance_scale: {
				type: 'integer',
				description:
					'This is the requested guidance scale for the video in a numeric value. Default to 17.5 if none is defined in the prompt, must be be greater than or equal to 1.',
			},
			num_frames: {
				type: 'integer',
				description: 'The number of frames if defined in the prompt, defaults to 24',
			},
			height: {
				type: 'integer',
				description:
					'The height of the video if defined in the prompt. Not affected by resolution. Defaults to 320, must be less than or equal to 1280.',
			},
			width: {
				type: 'integer',
				description:
					'The width of the video if defined in the prompt. Not affected by resolution. Defaults to 576, must be less than or equal to 1280.',
			},
		},
		required: ['prompt', 'guidance_scale'],
	},
	function: async (args: any, req: IRequest) => {
		const { prompt } = args;

		if (!prompt) {
			return {
				status: 'error',
				name: 'create_video',
				content: 'Missing prompt',
				data: {},
			};
		}

		const videoData = await getReplicateAIResponse({
			version: '9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351',
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
			name: 'create_video',
			content: videoData.output,
			data: videoData,
		};

		return data;
	},
};

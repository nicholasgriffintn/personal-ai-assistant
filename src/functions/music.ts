import { IFunction, IRequest } from '../types';
import { getReplicateAIResponse } from '../lib/chat';

export const create_music: IFunction = {
	name: 'create_music',
	description: 'Generate a song from a prompt using Replicate',
	parameters: {
		type: 'object',
		properties: {
			prompt: {
				type: 'string',
				description: 'the exact prompt passed in',
			},
			input_audio: {
				type: 'string',
				description:
					"An audio file that will influence the generated music. If `continuation` is `True`, the generated music will be a continuation of the audio file. Otherwise, the generated music will mimic the audio file's melody.",
			},
			duration: {
				type: 'number',
				description: 'The duration of the generated music in seconds. Defaults to 8 seconds.',
			},
		},
		required: ['prompt'],
	},
	function: async (args: any, req: IRequest) => {
		const { prompt } = args;

		if (!prompt) {
			return {
				status: 'error',
				name: 'create_music',
				content: 'Missing prompt',
				data: {},
			};
		}

		const musicData = await getReplicateAIResponse({
			version: '671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb',
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
			name: 'create_music',
			content: musicData.output,
			data: musicData,
		};

		return data;
	},
};

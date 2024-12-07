import { IFunction, IRequest } from '../../types';
import { AIProviderFactory } from '../../providers/factory';
import { getModelConfigByMatchingModel } from '../../lib/models';

const REPLICATE_MODEL_VERSION = '671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb';
const DEFAULT_DURATION = 8;

interface MusicGenerationParams {
	prompt: string;
	input_audio?: string;
	duration?: number;
}

interface MusicResponse {
	status: 'success' | 'error';
	name: string;
	content: string;
	data: any;
}

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
				description: `The duration of the generated music in seconds. Defaults to ${DEFAULT_DURATION} seconds.`,
				default: DEFAULT_DURATION,
			},
		},
		required: ['prompt'],
	},
	function: async (chatId: string, args: MusicGenerationParams, req: IRequest, appUrl?: string): Promise<MusicResponse> => {
		if (!args.prompt) {
			return {
				status: 'error',
				name: 'create_music',
				content: 'Missing prompt',
				data: {},
			};
		}

		try {
			const provider = AIProviderFactory.getProvider('replicate');

			const musicData = await provider.getResponse({
				chatId,
				appUrl,
				model: REPLICATE_MODEL_VERSION,
				messages: [
					{
						role: 'user',
						// @ts-ignore
						content: {
							...args,
						},
					},
				],
				env: req.env,
			});

			return {
				status: 'success',
				name: 'create_music',
				content: 'Music generated successfully',
				data: musicData,
			};
		} catch (error) {
			return {
				status: 'error',
				name: 'create_music',
				content: error instanceof Error ? error.message : 'Failed to generate music',
				data: {},
			};
		}
	},
};

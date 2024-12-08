import { IFunction, IRequest } from '../../types';
import { AIProviderFactory } from '../../providers/factory';
import { getModelConfigByMatchingModel } from '../../lib/models';

const REPLICATE_MODEL_VERSION = '9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351';
const DEFAULT_HEIGHT = 320;
const DEFAULT_WIDTH = 576;
const MAX_DIMENSION = 1280;
const DEFAULT_FRAMES = 24;
const DEFAULT_GUIDANCE_SCALE = 17.5;
const MIN_GUIDANCE_SCALE = 1;

interface VideoGenerationParams {
	prompt: string;
	negative_prompt?: string;
	init_video?: string;
	init_weight?: number;
	guidance_scale?: number;
	num_frames?: number;
	height?: number;
	width?: number;
}

interface VideoResponse {
	status: 'success' | 'error';
	name: string;
	content: string;
	data: any;
}

export const create_video: IFunction = {
	name: 'create_video',
	description: 'Generate a video from a prompt using Replicate, only use this if the user has explicitly asked to create a video',
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
				default: 0.5,
			},
			guidance_scale: {
				type: 'integer',
				description: `Scale for classifier-free guidance. Must be greater than or equal to ${MIN_GUIDANCE_SCALE}. Defaults to ${DEFAULT_GUIDANCE_SCALE}.`,
				default: DEFAULT_GUIDANCE_SCALE,
				minimum: MIN_GUIDANCE_SCALE,
			},
			num_frames: {
				type: 'integer',
				description: `The number of frames to generate. Defaults to ${DEFAULT_FRAMES}.`,
				default: DEFAULT_FRAMES,
			},
			height: {
				type: 'integer',
				description: `The height of the video. Defaults to ${DEFAULT_HEIGHT}, must be less than or equal to ${MAX_DIMENSION}.`,
				default: DEFAULT_HEIGHT,
				maximum: MAX_DIMENSION,
			},
			width: {
				type: 'integer',
				description: `The width of the video. Defaults to ${DEFAULT_WIDTH}, must be less than or equal to ${MAX_DIMENSION}.`,
				default: DEFAULT_WIDTH,
				maximum: MAX_DIMENSION,
			},
		},
		required: ['prompt'],
	},
	function: async (chatId: string, args: VideoGenerationParams, req: IRequest, appUrl?: string): Promise<VideoResponse> => {
		if (!args.prompt) {
			return {
				status: 'error',
				name: 'create_video',
				content: 'Missing prompt',
				data: {},
			};
		}

		try {
			const provider = AIProviderFactory.getProvider('replicate');

			const videoData = await provider.getResponse({
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
				name: 'create_video',
				content: 'Video generated successfully',
				data: videoData,
			};
		} catch (error) {
			return {
				status: 'error',
				name: 'create_video',
				content: error instanceof Error ? error.message : 'Failed to generate video',
				data: {},
			};
		}
	},
};

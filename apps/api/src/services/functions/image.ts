import type { IFunction, IRequest } from "../../types";
import {
	type ImageGenerationParams,
	type ImageResponse,
	generateImage,
} from "../apps/generate/image";

const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 1024;
const MAX_DIMENSION = 1280;
const MIN_GUIDANCE_SCALE = 1;

export const create_image: IFunction = {
	name: "create_image",
	description:
		"Generate an image from a prompt using Replicate, only use this if the user has explicitly asked to create an image or drawing",
	parameters: {
		type: "object",
		properties: {
			prompt: {
				type: "string",
				description: "the exact prompt passed in",
			},
			negative_prompt: {
				type: "string",
				description: "the negative prompt that should be passed in to the LLM",
			},
			width: {
				type: "integer",
				description: `The width of the image. Defaults to ${DEFAULT_WIDTH}, must be less than or equal to ${MAX_DIMENSION}.`,
				default: DEFAULT_WIDTH,
				maximum: MAX_DIMENSION,
			},
			height: {
				type: "integer",
				description: `The height of the image. Defaults to ${DEFAULT_HEIGHT}, must be less than or equal to ${MAX_DIMENSION}.`,
				default: DEFAULT_HEIGHT,
				maximum: MAX_DIMENSION,
			},
			num_outputs: {
				type: "integer",
				description: "The number of images to generate.",
				default: 1,
			},
			guidance_scale: {
				type: "integer",
				description: `Scale for classifier-free guidance. Must be greater than or equal to ${MIN_GUIDANCE_SCALE}.`,
				default: 7,
				minimum: MIN_GUIDANCE_SCALE,
			},
		},
		required: ["prompt"],
	},
	function: async (
		completion_id: string,
		args: ImageGenerationParams,
		req: IRequest,
		appUrl?: string,
	): Promise<ImageResponse> => {
		const response = await generateImage({
			completion_id,
			appUrl,
			env: req.env,
			args,
		});

		return response;
	},
};

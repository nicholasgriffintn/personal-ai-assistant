import { getModelConfigByMatchingModel } from "../../lib/models";
import { AIProviderFactory } from "../../providers/factory";
import type { IFunction, IRequest } from "../../types";

const REPLICATE_MODEL_VERSION =
	"5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637";
const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 1024;
const MAX_DIMENSION = 1280;
const MIN_GUIDANCE_SCALE = 1;

interface ImageGenerationParams {
	prompt: string;
	negative_prompt?: string;
	width?: number;
	height?: number;
	num_outputs?: number;
	guidance_scale?: number;
}

interface ImageResponse {
	status: "success" | "error";
	name: string;
	content: string;
	data: any;
}

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
		chatId: string,
		args: ImageGenerationParams,
		req: IRequest,
		appUrl?: string,
	): Promise<ImageResponse> => {
		if (!args.prompt) {
			return {
				status: "error",
				name: "create_image",
				content: "Missing prompt",
				data: {},
			};
		}

		try {
			const provider = AIProviderFactory.getProvider("replicate");

			const imageData = await provider.getResponse({
				chatId,
				appUrl,
				model: REPLICATE_MODEL_VERSION,
				messages: [
					{
						role: "user",
						// @ts-ignore
						content: {
							...args,
						},
					},
				],
				env: req.env,
			});

			return {
				status: "success",
				name: "create_image",
				content: "Image generated successfully",
				data: imageData,
			};
		} catch (error) {
			return {
				status: "error",
				name: "create_image",
				content:
					error instanceof Error ? error.message : "Failed to generate image",
				data: {},
			};
		}
	},
};

import { imagePrompts } from "../../lib/prompts";
import type { IFunction, IRequest } from "../../types";
import {
	type ImageGenerationParams,
	type ImageResponse,
	generateImage,
} from "../apps/generate/image";

export const create_image: IFunction = {
	name: "create_image",
	description:
		"Generate an image from a prompt, only use this if the user has explicitly asked to create an image or drawing",
	parameters: {
		type: "object",
		properties: {
			prompt: {
				type: "string",
				description: "the exact prompt passed in",
			},
			image_style: {
				type: "string",
				description: "The style of the image to generate",
				enum: Object.keys(imagePrompts),
			},
			steps: {
				type: "integer",
				description: "The number of diffusion steps to use",
				minimum: 1,
				maximum: 8,
			},
		},
		required: ["prompt"],
	},
	function: async (
		completion_id: string,
		args: ImageGenerationParams,
		req: IRequest,
		app_url?: string,
	): Promise<ImageResponse> => {
		const response = await generateImage({
			completion_id,
			app_url,
			env: req.env,
			args,
		});

		return response;
	},
};

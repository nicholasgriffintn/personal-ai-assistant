import { imagePrompts } from "../../lib/prompts";
import type { IFunction, IRequest } from "../../types";
import {
	type SpeechGenerationParams,
	type SpeechResponse,
	generateSpeech,
} from "../apps/generate/speech";

export const create_speech: IFunction = {
	name: "create_speech",
	description:
		"Generate a speech from a prompt, only use this if the user has explicitly asked to create text to speech.",
	parameters: {
		type: "object",
		properties: {
			prompt: {
				type: "string",
				description: "the exact prompt passed in",
			},
			lang: {
				type: "string",
				description: "The language to use for the speech",
				enum: Object.keys(imagePrompts),
			},
		},
		required: ["prompt"],
	},
	function: async (
		completion_id: string,
		args: SpeechGenerationParams,
		req: IRequest,
		app_url?: string,
	): Promise<SpeechResponse> => {
		const response = await generateSpeech({
			completion_id,
			app_url,
			env: req.env,
			args,
		});

		return response;
	},
};

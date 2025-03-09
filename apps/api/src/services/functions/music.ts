import type { IFunction, IRequest } from "../../types";
import {
	generateMusic,
	type MusicGenerationParams,
	type MusicResponse,
} from "../apps/generate-music";

const DEFAULT_DURATION = 8;

export const create_music: IFunction = {
	name: "create_music",
	description:
		"Generate a song from a prompt using Replicate, only use this if the user has explicitly asked to create a song or music",
	parameters: {
		type: "object",
		properties: {
			prompt: {
				type: "string",
				description: "the exact prompt passed in",
			},
			input_audio: {
				type: "string",
				description:
					"An audio file that will influence the generated music. If `continuation` is `True`, the generated music will be a continuation of the audio file. Otherwise, the generated music will mimic the audio file's melody.",
			},
			duration: {
				type: "number",
				description: `The duration of the generated music in seconds. Defaults to ${DEFAULT_DURATION} seconds.`,
				default: DEFAULT_DURATION,
			},
		},
		required: ["prompt"],
	},
	function: async (
		completion_id: string,
		args: MusicGenerationParams,
		req: IRequest,
		appUrl?: string,
	): Promise<MusicResponse> => {
		const response = await generateMusic({
			completion_id,
			appUrl,
			env: req.env,
			args,
		});

		return response;
	},
};

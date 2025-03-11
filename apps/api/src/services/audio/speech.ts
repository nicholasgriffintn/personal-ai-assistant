import { CartesiaService } from "../../lib/audio/cartesia";
import { ElevenLabsService } from "../../lib/audio/elevenlabs";
import { PollyService } from "../../lib/audio/polly";
import { StorageService } from "../../lib/storage";
import type { IEnv, IFunctionResponse } from "../../types";
import { AssistantError, ErrorType } from "../../utils/errors";

type TextToSpeechRequest = {
	env: IEnv;
	input: string;
	user: { email: string };
	provider?: "polly" | "cartesia" | "elevenlabs";
};

export const handleTextToSpeech = async (
	req: TextToSpeechRequest,
): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { input, env, user, provider = "polly" } = req;

	if (!input) {
		throw new AssistantError("Missing input", ErrorType.PARAMS_ERROR);
	}

	if (input.length > 4096) {
		throw new AssistantError("Input is too long", ErrorType.PARAMS_ERROR);
	}

	const storage = new StorageService(env.ASSETS_BUCKET);
	const slug = `tts/${encodeURIComponent(user?.email || "unknown").replace(/[^a-zA-Z0-9]/g, "-")}-${Math.random().toString(36).substring(2, 15)}`;

	let response: string;

	if (provider === "elevenlabs") {
		if (!env.ELEVENLABS_API_KEY) {
			throw new AssistantError(
				"Missing ELEVENLABS_API_KEY",
				ErrorType.PARAMS_ERROR,
			);
		}

		const elevenlabs = new ElevenLabsService(env);
		response = await elevenlabs.synthesizeSpeech(input, storage, slug);
	} else if (provider === "cartesia") {
		if (!env.AI_GATEWAY_TOKEN) {
			throw new AssistantError(
				"Missing AI_GATEWAY_TOKEN for Cartesia",
				ErrorType.PARAMS_ERROR,
			);
		}

		const cartesia = new CartesiaService(env);
		response = await cartesia.synthesizeSpeech(input, storage, slug);
	} else {
		if (!env.POLLY_ACCESS_KEY_ID || !env.POLLY_SECRET_ACCESS_KEY) {
			throw new AssistantError(
				"Missing Polly credentials",
				ErrorType.PARAMS_ERROR,
			);
		}

		const polly = new PollyService({
			accessKeyId: env.POLLY_ACCESS_KEY_ID,
			secretAccessKey: env.POLLY_SECRET_ACCESS_KEY,
			region: env.AWS_REGION || "us-east-1",
		});

		response = await polly.synthesizeSpeech(input, storage, slug);
	}

	if (!response) {
		throw new AssistantError("No response from the text-to-speech service");
	}

	return {
		status: "success",
		content: response,
		data: {
			audioKey: response,
			audioUrl: `https://assistant-assets.nickgriffin.uk/${response}`,
			provider,
		},
	};
};

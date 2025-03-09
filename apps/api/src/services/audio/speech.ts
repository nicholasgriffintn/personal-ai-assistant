import type { IEnv, IFunctionResponse } from "../../types";
import { AssistantError, ErrorType } from "../../utils/errors";
import { PollyService } from "../../lib/polly";
import { StorageService } from "../../lib/storage";

type TextToSpeechRequest = {
	env: IEnv;
	input: string;
	user: { email: string };
};

export const handleTextToSpeech = async (
	req: TextToSpeechRequest,
): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { input, env, user } = req;

	// TODO: Add https://developers.cloudflare.com/ai-gateway/providers/cartesia/?
	// TODO: Add https://developers.cloudflare.com/ai-gateway/providers/elevenlabs/?

	if (!env.POLLY_ACCESS_KEY_ID || !env.POLLY_SECRET_ACCESS_KEY) {
		throw new AssistantError(
			"Missing Polly credentials",
			ErrorType.PARAMS_ERROR,
		);
	}

	if (!input) {
		throw new AssistantError("Missing input", ErrorType.PARAMS_ERROR);
	}

	if (input.length > 4096) {
		throw new AssistantError("Input is too long", ErrorType.PARAMS_ERROR);
	}

	const polly = new PollyService({
		accessKeyId: env.POLLY_ACCESS_KEY_ID,
		secretAccessKey: env.POLLY_SECRET_ACCESS_KEY,
		region: env.AWS_REGION || "us-east-1",
	});
	const storage = new StorageService(env.ASSETS_BUCKET);
	const slug = `polly/${encodeURIComponent(user?.email || "unknown").replace(/[^a-zA-Z0-9]/g, "-")}-${Math.random().toString(36).substring(2, 15)}`;

	const response = await polly.synthesizeSpeech(input, storage, slug);

	if (!response) {
		throw new AssistantError("No response from the Polly service");
	}

	return {
		status: "success",
		content: response,
		data: response,
	};
};

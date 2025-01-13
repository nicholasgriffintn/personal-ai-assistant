import type { IEnv, IFunctionResponse } from "../../types";
import { AssistantError, ErrorType } from "../../utils/errors";
import { PollyService } from "../../lib/polly";
import { StorageService } from "../../lib/storage";

type TextToSpeechRequest = {
	env: IEnv;
	content: string;
	user: { email: string };
};

export const handleTextToSpeech = async (
	req: TextToSpeechRequest,
): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { content, env, user } = req;

	if (!env.POLLY_ACCESS_KEY_ID || !env.POLLY_SECRET_ACCESS_KEY) {
		throw new AssistantError("Missing Polly credentials", ErrorType.PARAMS_ERROR);
	}

	if (!content) {
		throw new AssistantError("Missing content", ErrorType.PARAMS_ERROR);
	}

	const polly = new PollyService({
		accessKeyId: env.POLLY_ACCESS_KEY_ID,
		secretAccessKey: env.POLLY_SECRET_ACCESS_KEY,
		region: env.AWS_REGION || "us-east-1",
	});
	const storage = new StorageService(env.ASSETS_BUCKET);
	const slug = `polly/${encodeURIComponent(user.email).replace(/[^a-zA-Z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 15)}`;

	const response = await polly.synthesizeSpeech(content, storage, slug);

	if (!response) {
		throw new AssistantError("No response from the Polly service");
	}

	return {
		status: "success",
		content: response,
		data: response,
	};
};

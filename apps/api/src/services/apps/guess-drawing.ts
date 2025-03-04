import { gatewayId } from "../../constants/app";
import type { IEnv, IFunctionResponse } from "../../types";
import { AssistantError, ErrorType } from "../../utils/errors";

export type ImageFromDrawingRequest = {
	env: IEnv;
	request: {
		drawing?: Blob;
	};
	user: { email: string };
};

interface ImageFromDrawingResponse extends IFunctionResponse {
	chatId?: string;
}

const usedGuesses = new Set<string>();

export const guessDrawingFromImage = async (
	req: ImageFromDrawingRequest,
): Promise<ImageFromDrawingResponse> => {
	const { env, request, user } = req;

	if (!request.drawing) {
		throw new AssistantError("Missing drawing", ErrorType.PARAMS_ERROR);
	}

	const arrayBuffer = await request.drawing.arrayBuffer();

	const guessRequest = await env.AI.run(
		"@cf/llava-hf/llava-1.5-7b-hf",
		{
			prompt: `You will be provided with a description of an image. Your task is to guess what the image depicts using only one word. Follow these steps:

1. Carefully review the image provided.

2. Based on the image, think about the most likely object, animal, place, food, activity, or concept that the image represents.

3. Choose a single word that best describes or identifies the main subject of the image.

4. Provide your guess as a single word response. Do not include any explanations, punctuation, or additional text.

IMPORTANT: Do not use any of these previously guessed words: ${Array.from(usedGuesses).join(", ")}

Your response should contain only one word, which represents your best guess for the image described. Ensure that your answer is concise and accurately reflects the main subject of the image.`,
			image: [...new Uint8Array(arrayBuffer)],
		},
		{
			gateway: {
				id: gatewayId,
				skipCache: false,
				cacheTtl: 3360,
				metadata: {
					email: user?.email,
				},
			},
		},
	);

	if (!guessRequest.description) {
		throw new AssistantError("Failed to generate description");
	}

	usedGuesses.add(guessRequest.description.trim().toLowerCase());

	return {
		content: guessRequest.description,
	};
};

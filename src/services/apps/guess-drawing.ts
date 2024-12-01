import type { IEnv, IFunctionResponse } from '../../types';
import { gatewayId } from '../../lib/chat';
import { AppError } from '../../utils/errors';

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

export const guessDrawingFromImage = async (req: ImageFromDrawingRequest): Promise<ImageFromDrawingResponse> => {
	const { env, request, user } = req;

	if (!request.drawing) {
		throw new AppError('Missing drawing', 400);
	}

	const arrayBuffer = await request.drawing.arrayBuffer();

	const guessRequest = await env.AI.run(
		'@cf/llava-hf/llava-1.5-7b-hf',
		{
			prompt: `You will be provided with a description of an image. Your task is to guess what the image depicts using only one word. Follow these steps:

1. Carefully review the image provided.

2. Based on the image, think about the most likely object, animal, place, food, activity, or concept that the image represents.

3. Choose a single word that best describes or identifies the main subject of the image.

4. Provide your guess as a single word response. Do not include any explanations, punctuation, or additional text.

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
		}
	);

	if (!guessRequest.description) {
		throw new AppError('Failed to generate description', 500);
	}

	return {
		content: guessRequest.description,
	};
};

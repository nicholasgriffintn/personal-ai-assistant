import type { IFunctionResponse, IEnv } from '../../types';
import { gatewayId } from '../../lib/chat';
import { AppError } from '../../utils/errors';

type TranscribeRequest = {
	env: IEnv;
	audio: Blob;
	user: { email: string };
};

export const handleTranscribe = async (req: TranscribeRequest): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { audio, env, user } = req;

	if (!env.AI) {
		throw new AppError('Missing AI binding', 400);
	}

	if (!audio) {
		throw new AppError('Missing audio', 400);
	}

	const arrayBuffer = await audio.arrayBuffer();

	const response = await env.AI.run(
		'@cf/openai/whisper',
		{
			audio: [...new Uint8Array(arrayBuffer)],
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

	if (!response.text) {
		throw new AppError('No response from the model', 400);
	}

	return {
		status: 'success',
		content: response.text,
		data: response,
	};
};

import type { IFunctionResponse, IEnv } from '../../types';
import { gatewayId } from '../../lib/chat';

type TranscribeRequest = {
	env: IEnv;
	audio: Blob;
	user: { email: string };
};

export const handleTranscribe = async (req: TranscribeRequest): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { audio, env, user } = req;

	if (!env.AI) {
		console.log('Missing AI binding');
		return {
			status: 'error',
			content: 'Missing AI binding',
		};
	}

	if (!audio) {
		console.warn('Missing audio');
		return {
			status: 'error',
			content: 'Missing audio',
		};
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
		console.error('No response from the model', response);
		return {
			status: 'error',
			content: 'No response from the model',
		};
	}

	return {
		status: 'success',
		content: response.text,
		data: response,
	};
};

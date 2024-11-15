import type { IFunctionResponse, IEnv } from '../../../types';
import { ChatHistory } from '../../../lib/history';

type TranscribeRequest = {
	env: IEnv;
	audio: Blob;
	user: { email: string };
};

interface IPodcastUploadResponse extends IFunctionResponse {
	chatId?: string;
}

export const handlePodcastUpload = async (req: TranscribeRequest): Promise<IPodcastUploadResponse> => {
	const { audio, env, user } = req;

	if (!env.CHAT_HISTORY) {
		return {
			status: 'error',
			content: 'Missing chat history',
		};
	}

	if (!audio) {
		return {
			status: 'error',
			content: 'Missing audio',
		};
	}

	const podcastId = Math.random().toString(36);

	const arrayBuffer = await audio.arrayBuffer();

	const length = arrayBuffer.byteLength;

	const imageKey = `podcasts/${podcastId}/recording.mp3`;

	const data = await env.ASSETS_BUCKET.put(imageKey, arrayBuffer, {
		contentType: 'audio/mp3',
		contentLength: length,
	});

	if (!data) {
		return {
			status: 'error',
			content: 'Failed to upload podcast',
		};
	}

	const chatHistory = ChatHistory.getInstance(env.CHAT_HISTORY);
	await chatHistory.add(podcastId, {
		role: 'user',
		content: 'Generate a podcast from this audio',
		app: 'podcasts',
	});

	const message = {
		role: 'assistant',
		content: `Podcast Uploaded: [${podcastId}](https://assistant-assets.nickgriffin.uk/${imageKey})`,
		name: 'podcast_upload',
		data,
	};
	const response = await chatHistory.add(podcastId, message);

	return {
		...response,
		chatId: podcastId,
	};
};

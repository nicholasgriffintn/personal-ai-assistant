import { AwsClient } from 'aws4fetch';

const r2 = new AwsClient({
	accessKeyId: '',
	secretAccessKey: '',
});

import type { IFunctionResponse, IEnv } from '../../../types';
import { ChatHistory } from '../../../lib/history';

type TranscribeRequest = {
	env: IEnv;
	user: { email: string };
};

interface IPodcastUploadResponse extends IFunctionResponse {
	chatId?: string;
}

export const handlePodcastUpload = async (req: TranscribeRequest): Promise<IPodcastUploadResponse> => {
	const { env, user } = req;

	if (!env.CHAT_HISTORY) {
		return {
			status: 'error',
			content: 'Missing chat history',
		};
	}

	const podcastId = Math.random().toString(36);

	const imageKey = `podcasts/${podcastId}/recording.mp3`;

	const bucketName = 'assistant-assets';
	const accountId = env.ACCOUNT_ID;

	const url = new URL(`https://${bucketName}.${accountId}.r2.cloudflarestorage.com`);
	url.pathname = imageKey;
	url.searchParams.set('X-Amz-Expires', '3600');

	const signed = await r2.sign(
		new Request(url, {
			method: 'PUT',
		}),
		{
			aws: { signQuery: true },
		}
	);

	if (!signed) {
		return {
			status: 'error',
			content: 'Failed to sign request',
		};
	}

	const chatHistory = ChatHistory.getInstance(env.CHAT_HISTORY);
	await chatHistory.add(podcastId, {
		role: 'user',
		content: 'Generate a podcast record with a transcription',
		app: 'podcasts',
	});

	const message = {
		role: 'assistant',
		content: `Podcast Uploaded: [${podcastId}](https://assistant-assets.nickgriffin.uk/${imageKey})`,
		name: 'podcast_upload',
		data: {
			imageKey,
			url,
			signedUrl: signed.url,
		},
	};
	const response = await chatHistory.add(podcastId, message);

	return {
		...response,
		chatId: podcastId,
	};
};

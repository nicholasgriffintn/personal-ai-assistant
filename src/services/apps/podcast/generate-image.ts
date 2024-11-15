import type { IFunctionResponse, IEnv } from '../../../types';
import { gatewayId } from '../../../lib/chat';
import { ChatHistory } from '../../../lib/history';

export interface IPodcastGenerateImageBody {
	podcastId: string;
}

type GenerateImageRequest = {
	env: IEnv;
	request: IPodcastGenerateImageBody;
	user: { email: string };
	appUrl?: string;
};

export const handlePodcastGenerateImage = async (req: GenerateImageRequest): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { request, env, user } = req;

	if (!request.podcastId) {
		return {
			status: 'error',
			content: 'Missing podcast id',
		};
	}

	const chatHistory = ChatHistory.getInstance(env.CHAT_HISTORY);
	const chat = await chatHistory.get(request.podcastId);

	if (!chat?.length) {
		return {
			status: 'error',
			content: 'Podcast not found',
		};
	}

	const summaryData = chat.find((message) => message.name === 'podcast_summarise');

	if (!summaryData?.content) {
		return {
			status: 'error',
			content: 'Podcast summary not found',
		};
	}

	const summary = `I need a featured image for my latest podcast episode, this is the summary: ${summaryData.content}`;

	const data = await env.AI.run(
		'@cf/bytedance/stable-diffusion-xl-lightning',
		{
			prompt: summary,
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

	if (!data) {
		return {
			status: 'error',
			content: 'Image not generated',
		};
	}

	const itemId = Math.random().toString(36);
	const imageKey = `podcasts/${itemId}/featured.png`;

	const reader = data.getReader();
	const chunks = [];
	let done, value;
	while ((({ done, value } = await reader.read()), !done)) {
		chunks.push(value);
	}
	const arrayBuffer = new Uint8Array(chunks.reduce((acc, chunk) => acc.concat(Array.from(chunk)), [])).buffer;
	const length = arrayBuffer.byteLength;

	await env.ASSETS_BUCKET.put(imageKey, arrayBuffer, {
		contentType: 'image/png',
		contentLength: length,
	});

	const message = {
		role: 'assistant',
		name: 'podcast_generate_image',
		content: `Podcast Featured Image Uploaded: [${itemId}](https://assistant-assets.nickgriffin.uk/${imageKey})`,
		data,
	};
	const response = await chatHistory.add(request.podcastId, message);

	return response;
};

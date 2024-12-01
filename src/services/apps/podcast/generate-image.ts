import type { IFunctionResponse, IEnv } from '../../../types';
import { gatewayId } from '../../../lib/chat';
import { ChatHistory } from '../../../lib/history';
import { AppError } from '../../../utils/errors';

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
		throw new AppError('Missing podcast id', 400);
	}

	const chatHistory = ChatHistory.getInstance(env.CHAT_HISTORY);
	const chat = await chatHistory.get(request.podcastId);

	if (!chat?.length) {
		throw new AppError('Podcast not found', 400);
	}

	const summaryData = chat.find((message) => message.name === 'podcast_summarise');

	if (!summaryData?.content) {
		throw new AppError('Podcast summary not found', 400);
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
		throw new AppError('Image not generated', 400);
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

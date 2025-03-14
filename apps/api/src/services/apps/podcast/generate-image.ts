import { gatewayId } from "../../../constants/app";
import { ChatHistory } from "../../../lib/history";
import { StorageService } from "../../../lib/storage";
import type { ChatRole, IEnv, IFunctionResponse } from "../../../types";
import { AssistantError, ErrorType } from "../../../utils/errors";

export interface IPodcastGenerateImageBody {
	podcastId: string;
}

type GenerateImageRequest = {
	env: IEnv;
	request: IPodcastGenerateImageBody;
	user: { email: string };
	app_url?: string;
};

export const handlePodcastGenerateImage = async (
	req: GenerateImageRequest,
): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { request, env, user } = req;

	if (!request.podcastId) {
		throw new AssistantError("Missing podcast id", ErrorType.PARAMS_ERROR);
	}

	const chatHistory = ChatHistory.getInstance({
		history: env.CHAT_HISTORY,
		store: true,
	});
	const chat = await chatHistory.get(request.podcastId);

	if (!chat?.length) {
		throw new AssistantError("Podcast not found", ErrorType.PARAMS_ERROR);
	}

	const summaryData = chat.find(
		(message) => message.name === "podcast_summarise",
	);

	if (!summaryData?.content) {
		throw new AssistantError("Podcast summary not found");
	}

	const summary = `I need a featured image for my latest podcast episode, this is the summary: ${summaryData.content}`;

	const data = await env.AI.run(
		"@cf/bytedance/stable-diffusion-xl-lightning",
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
		},
	);

	if (!data) {
		throw new AssistantError("Image not generated");
	}

	const itemId = Math.random().toString(36);
	const imageKey = `podcasts/${itemId}/featured.png`;

	const reader = data.getReader();
	const chunks = [];
	const done = false;
	while (!done) {
		const { done, value } = await reader.read();
		if (value) {
			chunks.push(value);
		}
	}
	const arrayBuffer = new Uint8Array(
		chunks.reduce(
			(acc: number[], chunk) => acc.concat(Array.from(chunk)),
			[] as number[],
		),
	).buffer;
	const length = arrayBuffer.byteLength;

	const storageService = new StorageService(env.ASSETS_BUCKET);
	await storageService.uploadObject(imageKey, arrayBuffer, {
		contentType: "image/png",
		contentLength: length,
	});

	const message = {
		role: "assistant" as ChatRole,
		name: "podcast_generate_image",
		content: `Podcast Featured Image Uploaded: [${itemId}](https://assistant-assets.nickgriffin.uk/${imageKey})`,
		data,
	};
	const response = await chatHistory.add(request.podcastId, message);

	return response;
};

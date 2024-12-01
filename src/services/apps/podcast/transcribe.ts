import type { IFunctionResponse, IEnv } from '../../../types';
import { AIProviderFactory } from '../../../providers/factory';
import { getModelConfigByMatchingModel } from '../../../lib/models';
import { ChatHistory } from '../../../lib/history';
import { AppError } from '../../../utils/errors';

const REPLICATE_MODEL_VERSION = 'cbd15da9f839c5f932742f86ce7def3a03c22e2b4171d42823e83e314547003f';

export interface IPodcastTranscribeBody {
	podcastId: string;
	numberOfSpeakers: number;
	prompt: string;
}

interface TranscribeRequest {
	env: IEnv;
	request: IPodcastTranscribeBody;
	user: { email: string };
	appUrl?: string;
}

export const handlePodcastTranscribe = async (req: TranscribeRequest): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { request, env, user, appUrl } = req;

	// Validate required fields
	if (!request.podcastId || !request.prompt || !request.numberOfSpeakers) {
		throw new AppError('Missing podcast id or prompt or number of speakers', 400);
	}

	try {
		// Get chat history
		const chatHistory = ChatHistory.getInstance(env.CHAT_HISTORY);
		const chat = await chatHistory.get(request.podcastId);

		if (!chat?.length) {
			throw new AppError('Podcast not found', 400);
		}

		// Get upload data
		const uploadData = chat.find((message) => message.name === 'podcast_upload');
		if (!uploadData?.data?.url) {
			throw new AppError('Podcast not found', 400);
		}

		// Get provider and process transcription
		const modelConfig = getModelConfigByMatchingModel(REPLICATE_MODEL_VERSION);
		const provider = AIProviderFactory.getProvider(modelConfig?.provider || 'replicate');

		const baseWebhookUrl = appUrl || 'https://assistant.nicholasgriffin.workers.dev';
		const webhookUrl = `${baseWebhookUrl}/webhooks/replicate?chatId=${request.podcastId}&token=${env.WEBHOOK_SECRET}`;

		const transcriptionData = await provider.getResponse({
			chatId: request.podcastId,
			appUrl,
			version: REPLICATE_MODEL_VERSION,
			messages: [
				{
					role: 'user',
					content: {
						file: uploadData.data.url,
						prompt: request.prompt,
						language: 'en',
						num_speakers: request.numberOfSpeakers,
						transcript_output_format: 'segments_only',
						group_segments: true,
						translate: false,
						offset_seconds: 0,
					},
				},
			],
			env,
			user,
			webhookUrl,
			webhookEvents: ['output', 'completed'],
		});

		// Store result in chat history
		const message = {
			role: 'assistant',
			name: 'podcast_transcribe',
			content: `Podcast Transcribed: ${transcriptionData.id}`,
			data: transcriptionData,
		};

		await chatHistory.add(request.podcastId, message);
		return {
			status: 'success',
			content: `Podcast Transcribed: ${transcriptionData.id}`,
		};
	} catch (error) {
		throw new AppError('Failed to transcribe podcast', 400);
	}
};

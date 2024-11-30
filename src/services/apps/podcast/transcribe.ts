import type { IFunctionResponse, IEnv } from '../../../types';
import { AIProviderFactory } from '../../../providers/factory';
import { getModelConfigByMatchingModel } from '../../../lib/models';
import { ChatHistory } from '../../../lib/history';

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
		console.warn('Missing podcast id or prompt or number of speakers');
		return {
			status: 'error',
			content: 'Missing podcast id or prompt or number of speakers',
		};
	}

	try {
		// Get chat history
		const chatHistory = ChatHistory.getInstance(env.CHAT_HISTORY);
		const chat = await chatHistory.get(request.podcastId);

		if (!chat?.length) {
			console.warn('Podcast not found');
			return {
				status: 'error',
				content: 'Podcast not found',
			};
		}

		// Get upload data
		const uploadData = chat.find((message) => message.name === 'podcast_upload');
		if (!uploadData?.data?.url) {
			console.warn('Audio not found');
			return {
				status: 'error',
				content: 'Audio not found',
			};
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
		console.error('Error in handlePodcastTranscribe:', error);
		return {
			status: 'error',
			content: error instanceof Error ? error.message : 'Failed to transcribe podcast',
		};
	}
};

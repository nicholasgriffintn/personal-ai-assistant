import type { IFunctionResponse, IEnv } from '../../../types';
import { fetchAIResponse, getGatewayExternalProviderUrl } from '../../../lib/chat';
import { ChatHistory } from '../../../lib/history';

export interface IPodcastTranscribeBody {
	podcastId: string;
	numberOfSpeakers: number;
	prompt: string;
}

type TranscribeRequest = {
	env: IEnv;
	request: IPodcastTranscribeBody;
	user: { email: string };
	appUrl?: string;
};

export const handlePodcastTranscribe = async (req: TranscribeRequest): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { request, env, user, appUrl } = req;

	if (!env.REPLICATE_API_TOKEN) {
		throw new Error('Missing REPLICATE_API_TOKEN');
	}

	if (!request.podcastId || !request.prompt || !request.numberOfSpeakers) {
		return {
			status: 'error',
			content: 'Missing podcast id or prompt or number of speakers',
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

	const uploadData = chat.find((message) => message.name === 'podcast_upload');

	if (!uploadData?.data?.url) {
		return {
			status: 'error',
			content: 'Audio not found',
		};
	}

	const baseUrl = getGatewayExternalProviderUrl(env, 'replicate');
	const url = `${baseUrl}/predictions`;

	const headers = {
		Authorization: `Bearer ${env.REPLICATE_API_TOKEN}`,
		'Content-Type': 'application/json',
		Prefer: 'wait=2',
		'cf-aig-metadata': JSON.stringify({
			email: user?.email,
		}),
	};

	const baseWebhookUrl = appUrl || 'https:///assistant.nicholasgriffin.workers.dev';
	const webhookUrl = `${baseWebhookUrl}/webhooks/replicate?chatId=${request.podcastId}&token=${env.WEBHOOK_SECRET}`;

	const body = {
		version: 'cbd15da9f839c5f932742f86ce7def3a03c22e2b4171d42823e83e314547003f',
		input: {
			file: uploadData.data.url,
			prompt: request.prompt,
			language: 'en',
			num_speakers: request.numberOfSpeakers,
			transcript_output_format: 'segments_only',
			group_segments: true,
			translate: false,
			offset_seconds: 0,
		},
		webhook: webhookUrl,
		webhook_events_filter: ['output', 'completed'],
	};

	const data: any = await fetchAIResponse('replicate', url, headers, body);

	const message = {
		role: 'assistant',
		name: 'podcast_transcribe',
		content: `Podcast Transcribed: ${data.id}`,
		data,
	};
	const response = await chatHistory.add(request.podcastId, message);

	return response;
};

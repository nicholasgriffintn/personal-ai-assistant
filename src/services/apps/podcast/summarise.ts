import type { IFunctionResponse, IEnv } from '../../../types';
import { gatewayId } from '../../../lib/chat';
import { ChatHistory } from '../../../lib/history';

function generateFullTranscription(
	transcription: {
		segments: { speaker: any; text: any }[];
	},
	speakers: {
		[name: string]: string;
	}
) {
	const fullTranscription = transcription.segments
		.map((segment: any) => {
			const speaker = speakers[segment.speaker];
			return `${speaker}: ${segment.text}`;
		})
		.join('\n');

	return fullTranscription;
}

export interface IPodcastSummariseBody {
	podcastId: string;
	speakers: { [name: string]: string };
}

type SummariseRequest = {
	env: IEnv;
	request: IPodcastSummariseBody;
	user: { email: string };
	appUrl?: string;
};

export const handlePodcastSummarise = async (req: SummariseRequest): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { request, env, user } = req;

	if (!request.podcastId || !request.speakers) {
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

	const transcriptionData = chat.find((message) => message.name === 'podcast_transcribe');

	if (!transcriptionData?.data?.output) {
		return {
			status: 'error',
			content: 'Transcription not found',
		};
	}

	const transcription = transcriptionData.data.output;
	const fullTranscription = generateFullTranscription(transcription, request.speakers);

	const data = await env.AI.run(
		'@cf/facebook/bart-large-cnn',
		{
			input_text: fullTranscription,
			max_length: 52,
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

	if (!data.summary) {
		return {
			status: 'error',
			content: 'No response from the model',
		};
	}

	const message = {
		role: 'assistant',
		name: 'podcast_summarise',
		content: data.summary,
		data: {
			full: fullTranscription,
			summary: data.summary,
			speakers: request.speakers,
		},
	};
	const response = await chatHistory.add(request.podcastId, message);

	return response;
};

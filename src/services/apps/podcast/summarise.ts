import { gatewayId } from "../../../lib/chat";
import { ChatHistory } from "../../../lib/history";
import type { ChatRole, IEnv, IFunctionResponse } from "../../../types";
import { AppError } from "../../../utils/errors";

function generateFullTranscription(
	transcription: {
		segments: { speaker: any; text: any }[];
	},
	speakers: {
		[name: string]: string;
	},
) {
	const fullTranscription = transcription.segments
		.map((segment: any) => {
			const speaker = speakers[segment.speaker];
			return `${speaker}: ${segment.text}`;
		})
		.join("\n");

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

export const handlePodcastSummarise = async (
	req: SummariseRequest,
): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { request, env, user } = req;

	if (!request.podcastId || !request.speakers) {
		throw new AppError("Missing podcast id or speakers", 400);
	}

	const chatHistory = ChatHistory.getInstance({
		history: env.CHAT_HISTORY,
		shouldSave: true,
	});
	const chat = await chatHistory.get(request.podcastId);

	if (!chat?.length) {
		throw new AppError("Podcast not found", 400);
	}

	const transcriptionData = chat.find(
		(message) => message.name === "podcast_transcribe",
	);

	if (!transcriptionData?.data?.output) {
		throw new AppError("Transcription not found", 400);
	}

	const transcription = transcriptionData.data.output;
	const fullTranscription = generateFullTranscription(
		transcription,
		request.speakers,
	);

	const data = await env.AI.run(
		"@cf/facebook/bart-large-cnn",
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
		},
	);

	if (!data.summary) {
		throw new AppError("No response from the model", 400);
	}

	const message = {
		role: "assistant" as ChatRole,
		name: "podcast_summarise",
		content: data.summary,
		data: {
			summary: data.summary,
			speakers: request.speakers,
		},
	};
	const response = await chatHistory.add(request.podcastId, message);

	return response;
};

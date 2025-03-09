import { ChatHistory } from "../../lib/history";
import type { IRequest } from "../../types";
import { AssistantError, ErrorType } from "../../utils/errors";

export const handleGetChatCompletion = async (
	req: IRequest,
	completion_id: string,
): Promise<Record<string, any>[]> => {
	const { env } = req;

	if (!env.CHAT_HISTORY) {
		throw new AssistantError(
			"Missing CHAT_HISTORY binding",
			ErrorType.PARAMS_ERROR,
		);
	}

	const chatHistory = ChatHistory.getInstance({
		history: env.CHAT_HISTORY,
		store: true,
	});
	const item = await chatHistory.get(completion_id);

	return item;
};

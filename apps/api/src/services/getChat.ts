import { ChatHistory } from "../lib/history";
import type { IRequest } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";

export const handleGetChat = async (
	req: IRequest,
	id: string,
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
		shouldSave: true,
	});
	const item = await chatHistory.get(id);

	return item;
};

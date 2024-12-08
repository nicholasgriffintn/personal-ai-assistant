import { ChatHistory } from "../lib/history";
import type { IRequest } from "../types";
import { AppError } from "../utils/errors";

export const handleGetChat = async (
	req: IRequest,
	id: string,
): Promise<{}[]> => {
	const { env } = req;

	if (!env.CHAT_HISTORY) {
		throw new AppError("Missing CHAT_HISTORY binding", 400);
	}

	const chatHistory = ChatHistory.getInstance({
		history: env.CHAT_HISTORY,
		shouldSave: true,
	});
	const item = await chatHistory.get(id);

	return item;
};

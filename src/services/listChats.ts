import type { KVNamespaceListResult } from "@cloudflare/workers-types";

import { ChatHistory } from "../lib/history";
import type { IRequest } from "../types";
import { AppError } from "../utils/errors";

export const handleListChats = async (
	req: IRequest,
): Promise<KVNamespaceListResult<unknown, string>> => {
	const { env } = req;

	if (!env.CHAT_HISTORY) {
		throw new AppError("Missing CHAT_HISTORY binding", 400);
	}

	const chatHistory = ChatHistory.getInstance({
		history: env.CHAT_HISTORY,
		shouldSave: true,
	});
	const list = await chatHistory.list();

	return list;
};

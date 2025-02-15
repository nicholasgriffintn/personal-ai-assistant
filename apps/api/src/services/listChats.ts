import type { KVNamespaceListResult } from "@cloudflare/workers-types";

import { ChatHistory } from "../lib/history";
import type { IRequest } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";

export const handleListChats = async (
	req: IRequest,
): Promise<KVNamespaceListResult<unknown, string>> => {
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
	const list = await chatHistory.list();

	return list;
};

import { ChatHistory } from "../../lib/history";
import type { IEnv } from "../../types";

interface UpdateChatCompletionParams {
	env: IEnv;
	completion_id: string;
	title: string;
}

// TODO: Change storage of completions and then change this to pass metadata.
export async function handleUpdateChatCompletion({
	env,
	completion_id,
	title,
}: UpdateChatCompletionParams): Promise<{ title: string }> {
	if (!env.AI) {
		throw new Error("AI binding is not available");
	}

	const history = ChatHistory.getInstance({
		history: env.CHAT_HISTORY,
	});

	let newTitle = title.trim();

	if (
		(title.startsWith('"') && title.endsWith('"')) ||
		(title.startsWith("'") && title.endsWith("'"))
	) {
		newTitle = title.slice(1, -1);
	}

	if (newTitle.length > 50) {
		newTitle = newTitle.substring(0, 47) + "...";
	}

	if (!newTitle) {
		newTitle = "New Conversation";
	}

	const existingMessages = await history.get(completion_id);

	if (existingMessages.length > 0) {
		existingMessages[0].data = {
			...(existingMessages[0].data || {}),
			title: newTitle,
		};

		await history.update(completion_id, existingMessages);
	}

	return { title: newTitle };
}

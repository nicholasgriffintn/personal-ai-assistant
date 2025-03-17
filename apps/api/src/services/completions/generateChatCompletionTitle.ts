import { ChatHistory } from "../../lib/history";
import type { IEnv, Message } from "../../types";
import { ErrorType } from "../../utils/errors";
import { AssistantError } from "../../utils/errors";

interface GenerateChatCompletionTitleParams {
	env: IEnv;
	completion_id: string;
	messages?: Message[];
}

// TODO: Provide store:false to stop storing the completion in the history.
// TODO: Storage of completions needs to be changed and this needs to store the title in the metadata
export async function handleGenerateChatCompletionTitle({
	env,
	completion_id,
	messages: providedMessages,
}: GenerateChatCompletionTitleParams): Promise<{ title: string }> {
	if (!env.AI) {
		throw new Error("AI binding is not available");
	}

	if (!env.CHAT_HISTORY) {
		throw new AssistantError("Missing chat history", ErrorType.PARAMS_ERROR);
	}

	const history = ChatHistory.getInstance({
		history: env.CHAT_HISTORY,
	});

	let messagesToUse: Message[] = [];

	if (providedMessages && providedMessages.length > 0) {
		messagesToUse = providedMessages.slice(
			0,
			Math.min(3, providedMessages.length),
		);
	} else {
		const existingMessages = await history.get(completion_id);
		messagesToUse = existingMessages.slice(
			0,
			Math.min(3, existingMessages.length),
		);

		if (existingMessages.length === 0) {
			return { title: "New Conversation" };
		}
	}

	const prompt = `
    You are a title generator. Your only job is to create a short, concise title (maximum 5 words) for a conversation.
    Do not include any explanations, prefixes, or quotes in your response.
    Output only the title itself.
    
    Conversation:
    ${messagesToUse
			.map(
				(msg) =>
					`${msg.role.toUpperCase()}: ${typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)}`,
			)
			.join("\n")}
  `;

	const response = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
		prompt,
		max_tokens: 10,
	});

	// @ts-expect-error
	let title = response.response.trim();

	if (
		(title.startsWith('"') && title.endsWith('"')) ||
		(title.startsWith("'") && title.endsWith("'"))
	) {
		title = title.slice(1, -1);
	}

	if (title.length > 50) {
		title = `${title.substring(0, 47)}...`;
	}

	if (!title) {
		title = "New Conversation";
	}

	const existingMessages = await history.get(completion_id);

	if (existingMessages.length > 0) {
		existingMessages[0].data = {
			...(existingMessages[0].data || {}),
			title,
		};

		await history.update(completion_id, existingMessages);
	}

	return { title };
}

import type { ChatInput, ChatMode, IBody, Message } from "../../types";
import type { ConversationManager } from "../conversationManager";

export const processPromptCoachMode = async (
	request: IBody,
	conversationManager: ConversationManager,
): Promise<{
	userMessage: ChatInput;
	currentMode: ChatMode;
	additionalMessages: Message[];
}> => {
	if (!request || !conversationManager) {
		throw new Error(
			"Invalid input: request and conversationManager are required",
		);
	}

	const modeWithFallback = request.mode || "normal";

	const isNoSystemMode = modeWithFallback === "no_system";
	const isNotPromptCoachMode =
		modeWithFallback !== "prompt_coach" ||
		(typeof request.input === "string" &&
			request.input.toLowerCase() !== "use this prompt");

	if (isNoSystemMode || isNotPromptCoachMode) {
		return {
			userMessage: request.input,
			currentMode: modeWithFallback,
			additionalMessages: [],
		};
	}

	const messageHistory = await conversationManager.get(request.completion_id);
	const lastAssistantMessage = messageHistory
		.slice()
		.reverse()
		.find((msg) => msg.role === "assistant")?.content;

	if (!lastAssistantMessage || typeof lastAssistantMessage !== "string") {
		return {
			userMessage: request.input,
			currentMode: modeWithFallback,
			additionalMessages: [],
		};
	}

	const promptRegex =
		/<revised_prompt>([\s\S]*?)(?=<\/revised_prompt>|suggestions|questions)/i;
	const match = promptRegex.exec(lastAssistantMessage);

	if (!match) {
		return {
			userMessage: request.input,
			currentMode: modeWithFallback,
			additionalMessages: [],
		};
	}

	const userMessage = match[1].trim();
	await conversationManager.add(request.completion_id, {
		role: "user",
		content: userMessage,
		mode: "normal",
	});

	return {
		userMessage,
		currentMode: "normal",
		additionalMessages: [{ role: "assistant", content: userMessage }],
	};
};

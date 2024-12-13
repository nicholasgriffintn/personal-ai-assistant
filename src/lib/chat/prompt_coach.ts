import type { Message, IBody, ChatInput, ChatMode } from '../../types';
import type { ChatHistory } from '../history';

export const processPromptCoachMode = async (
	request: IBody,
	chatHistory: ChatHistory
): Promise<{
	userMessage: ChatInput;
	currentMode: ChatMode;
	additionalMessages: Message[];
}> => {
	const modeWithFallback = request.mode || 'normal';

	if (modeWithFallback === 'no_system') {
		return {
			userMessage: request.input,
			currentMode: modeWithFallback,
			additionalMessages: [],
		};
	}

	if (modeWithFallback !== 'prompt_coach' || (typeof request.input === 'string' && request.input.toLowerCase() !== 'use this prompt')) {
		return {
			userMessage: request.input,
			currentMode: modeWithFallback,
			additionalMessages: [],
		};
	}

	const messageHistory = await chatHistory.get(request.chat_id);
	const lastAssistantMessage = messageHistory.reverse().find((msg) => msg.role === 'assistant')?.content;

	if (!lastAssistantMessage || typeof lastAssistantMessage !== 'string') {
		return {
			userMessage: request.input,
			currentMode: modeWithFallback,
			additionalMessages: [],
		};
	}

	const match = /<revised_prompt>([\s\S]*?)(?=<\/revised_prompt>|suggestions|questions)/i.exec(lastAssistantMessage);
	if (!match) {
		return {
			userMessage: request.input,
			currentMode: modeWithFallback,
			additionalMessages: [],
		};
	}

	const userMessage = match[1].trim();
	await chatHistory.add(request.chat_id, {
		role: 'user',
		content: userMessage,
		mode: 'normal',
	});

	return {
		userMessage,
		currentMode: 'normal',
		additionalMessages: [{ role: 'assistant', content: userMessage }],
	};
};

import type { IRequest, IFunctionResponse } from '../types';
import { ChatHistory } from '../lib/history';
import { getSystemPrompt, returnCoachingPrompt } from '../lib/prompts';
import { getMatchingModel } from '../lib/models';
import { getAIResponse, handleToolCalls, processPromptCoachMode } from '../lib/chat';

export const handleCreateChat = async (req: IRequest): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { appUrl, request, env, user } = req;

	if (!request?.chat_id || !request?.input || !env.CHAT_HISTORY) {
		return {
			status: 'error',
			content: !request ? 'Missing request' : !request.chat_id || !request.input ? 'Missing chat_id or input' : 'Missing chat history',
		};
	}

	const platform = request.platform || 'api';
	const model = getMatchingModel(request.model);

	if (!model) {
		return { status: 'error', content: 'No matching model found' };
	}

	const chatHistory = ChatHistory.getInstance(env.CHAT_HISTORY, model, platform);

	if (request.mode === 'local') {
		const message = await chatHistory.add(request.chat_id, {
			role: request.role,
			content: request.input,
		});
		return [message];
	}

	await chatHistory.add(request.chat_id, {
		role: 'user',
		content: request.input,
		mode: request.mode,
	});

	const messageHistory = await chatHistory.get(request.chat_id);
	if (!messageHistory.length) {
		return { status: 'error', content: 'No messages found' };
	}

	const { userMessage, currentMode, additionalMessages } = await processPromptCoachMode(request, chatHistory);

	console.log('currentMode', currentMode);

	const systemPrompt = currentMode === 'prompt_coach' ? await returnCoachingPrompt() : getSystemPrompt(request, model, user);
	const messages = [...additionalMessages, ...messageHistory];

	const modelResponse = await getAIResponse({
		chatId: request.chat_id,
		appUrl,
		model,
		systemPrompt,
		messages,
		message: userMessage || request.input,
		env,
		user,
		mode: currentMode,
	});

	if (modelResponse.tool_calls) {
		return await handleToolCalls(request.chat_id, modelResponse, chatHistory, req);
	}

	if (!modelResponse.response) {
		return { status: 'error', content: 'No response from the model' };
	}

	const message = await chatHistory.add(request.chat_id, {
		role: 'assistant',
		content: modelResponse.response,
		citations: modelResponse.citations || [],
		logId: env.AI.aiGatewayLogId,
		mode: currentMode,
	});

	return [message];
};

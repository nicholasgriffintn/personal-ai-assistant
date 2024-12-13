import type { Message, IRequest } from '../../types';
import type { ChatHistory } from '../history';
import { handleFunctions } from '../../services/functions';

interface ToolCallError extends Error {
	functionName?: string;
}

export const handleToolCalls = async (chatId: string, modelResponse: any, chatHistory: ChatHistory, req: IRequest): Promise<Message[]> => {
	const functionResults: Message[] = [];
	const modelResponseLogId = req.env.AI.aiGatewayLogId;

	const toolCalls = modelResponse.tool_calls || [];

	const toolMessage = await chatHistory.add(chatId, {
		role: 'assistant',
		name: 'External Functions',
		tool_calls: toolCalls,
		logId: modelResponseLogId || '',
		content: '',
	});
	functionResults.push(toolMessage);

	for (const toolCall of toolCalls) {
		try {
			const functionName = toolCall.name || toolCall.function?.name;
			if (!functionName) {
				throw new Error('Invalid tool call: missing function name');
			}

			const rawArgs = toolCall.arguments || toolCall.function?.arguments;
			const functionArgs = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;

			const result = await handleFunctions(chatId, req.appUrl, functionName, functionArgs, req);

			const message = await chatHistory.add(chatId, {
				role: 'tool',
				name: functionName,
				content: result.content || '',
				status: result.status,
				data: result.data,
				logId: modelResponseLogId || '',
			});

			functionResults.push(message);
		} catch (error) {
			const functionError = error as ToolCallError;
			console.error(`Tool call error for ${functionError.functionName}:`, error);

			functionResults.push({
				role: 'tool',
				name: toolCall.name,
				content: `Error: ${functionError.message}`,
				status: 'error',
				logId: modelResponseLogId || '',
			});
		}
	}

	return functionResults;
};

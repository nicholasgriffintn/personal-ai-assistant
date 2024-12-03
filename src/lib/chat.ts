import { getModelConfigByMatchingModel } from './models';
import type { Message, IEnv, IUser, RequireAtLeastOne, IRequest, IBody } from '../types';
import { AIProviderFactory } from '../providers/factory';
import { formatMessages } from '../utils/messages';
import { ChatHistory } from './history';
import { handleFunctions } from '../services/functions';

export const gatewayId = 'llm-assistant';

interface AIResponseParamsBase {
	chatId?: string;
	appUrl?: string;
	systemPrompt?: string;
	messages: Message[];
	message?: string;
	env: IEnv;
	model?: string;
	version?: string;
	user?: IUser;
	webhookUrl?: string;
	webhookEvents?: string[];
	temperature?: number;
	max_tokens?: number;
	top_p?: number;
}

export type AIResponseParams = RequireAtLeastOne<AIResponseParamsBase, 'model' | 'version'>;

export function getGatewayBaseUrl(env: IEnv): string {
	return `https://gateway.ai.cloudflare.com/v1/${env.ACCOUNT_ID}/${gatewayId}`;
}

export function getGatewayExternalProviderUrl(env: IEnv, provider: string): string {
	const supportedProviders = ['anthropic', 'grok', 'huggingface', 'perplexity-ai', 'replicate', 'mistral', 'openrouter'];

	if (!supportedProviders.includes(provider)) {
		throw new Error(`The provider ${provider} is not supported`);
	}

	return `${getGatewayBaseUrl(env)}/${provider}`;
}

export async function getAIResponse({
	chatId,
	appUrl,
	model,
	systemPrompt,
	messages,
	message,
	env,
	user,
	mode = 'normal',
	temperature = 1,
	max_tokens = 1024,
	top_p = 1,
}: {
	appUrl?: string;
	chatId?: string;
	model: string;
	systemPrompt: string;
	messages: Message[];
	message: string;
	env: IEnv;
	user?: IUser;
	mode?: 'normal' | 'prompt_coach';
	temperature?: number;
	max_tokens?: number;
	top_p?: number;
}) {
	const modelConfig = getModelConfigByMatchingModel(model);
	const provider = AIProviderFactory.getProvider(modelConfig?.provider || 'workers');

	const filteredMessages = mode === 'normal' ? messages.filter((msg) => !msg.mode || msg.mode === 'normal') : messages;

	const formattedMessages = formatMessages(provider.name, systemPrompt, filteredMessages);

	return provider.getResponse({
		chatId,
		appUrl,
		model,
		systemPrompt,
		messages: formattedMessages,
		message,
		env,
		user,
		temperature,
		max_tokens,
		top_p,
	});
}

export const processPromptCoachMode = async (request: IBody, chatHistory: ChatHistory) => {
	if (request.mode !== 'prompt_coach' || request.input.toLowerCase() !== 'use this prompt') {
		return { userMessage: request.input, currentMode: request.mode, additionalMessages: [] };
	}

	const messageHistory = await chatHistory.get(request.chat_id);
	const lastAssistantMessage = messageHistory.reverse().find((msg) => msg.role === 'assistant')?.content;

	if (!lastAssistantMessage || typeof lastAssistantMessage !== 'string') {
		return { userMessage: request.input, currentMode: request.mode, additionalMessages: [] };
	}

	const match = /<revised_prompt>([\s\S]*?)(?=<\/revised_prompt>|suggestions|questions)/i.exec(lastAssistantMessage);
	if (!match) {
		return { userMessage: request.input, currentMode: request.mode, additionalMessages: [] };
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

export const handleToolCalls = async (chatId: string, modelResponse: any, chatHistory: ChatHistory, req: IRequest) => {
	const functionResults = [];
	const modelResponseLogId = req.env.AI.aiGatewayLogId;

	const toolMessage = await chatHistory.add(chatId, {
		role: 'assistant',
		name: 'External Functions',
		tool_calls: modelResponse.tool_calls,
		logId: modelResponseLogId,
		content: '',
	});
	functionResults.push(toolMessage);

	for (const toolCall of modelResponse.tool_calls) {
		try {
			const result = await handleFunctions(chatId, req.appUrl, toolCall.name, toolCall.arguments, req);
			const message = await chatHistory.add(chatId, {
				role: 'assistant',
				name: toolCall.name,
				content: result.content,
				status: result.status,
				data: result.data,
				logId: modelResponseLogId,
			});
			functionResults.push(message);
		} catch (e) {
			functionResults.push({
				role: 'assistant',
				name: toolCall.name,
				content: 'Error',
				status: 'error',
				logId: modelResponseLogId,
			});
		}
	}

	return functionResults;
};

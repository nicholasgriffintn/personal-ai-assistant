import { useState, useRef, useEffect } from 'react';

import type { Message, Conversation, ChatMode, ChatSettings } from '../types';
import { apiBaseUrl } from '../constants';
import { WebLLMService } from '../lib/web-llm';
import { modelsOptions } from '../lib/models';
import { apiKeyService } from '../lib/api-key';
import { useError } from '../contexts/ErrorContext';
import { useLoading } from '../contexts/LoadingContext';
import { useChatStore } from '../stores/chatStore';

interface StreamState {
	streamStarted: boolean;
}

interface StreamError extends Error {
	status?: number;
	code?: string;
}

interface UseStreamResponseProps {
	conversationId?: number;
	scrollToBottom: () => void;
	mode: ChatMode;
	model: string;
	chatSettings: ChatSettings;
}

class ApiError extends Error {
	constructor(public status: number, message: string) {
		super(message);
		this.name = 'ApiError';
	}
}

export const useStreamResponse = ({
	conversationId,
	scrollToBottom,
	mode,
	model,
	chatSettings,
}: UseStreamResponseProps) => {
	const { setConversations } = useChatStore();

	const [state, setState] = useState<StreamState>({
		streamStarted: false
	});

	const { addError } = useError();
	const { startLoading, updateLoading, stopLoading } = useLoading();
	const [controller, setController] = useState(() => new AbortController());
	const webLLMService = useRef<WebLLMService>(WebLLMService.getInstance());
	const aiResponseRef = useRef<string>('');
	const aiReasoningRef = useRef<string>('');

	const matchingModel = modelsOptions.find((modelOption) => model === modelOption.id);

	useEffect(() => {
		const initializeLocalModel = async () => {
			if (mode === 'local' && matchingModel?.isLocal) {
				try {
					const loadingId = 'model-init';
					startLoading(loadingId, 'Initializing local model...');
					await webLLMService.current.init(model, (progress) => {
						const progressPercent = Math.round(progress.progress * 100);
						updateLoading(loadingId, progressPercent, progress.text);
					});
				} catch (error) {
					console.error('Failed to initialize WebLLM:', error);
					addError('Failed to initialize local model. Please try again.');
				} finally {
					stopLoading('model-init');
				}
			}
		};

		initializeLocalModel();
	}, [mode, model, matchingModel?.isLocal, startLoading, updateLoading, stopLoading, addError]);

	const updateConversation = (content: string, reasoning?: string, message?: Message) => {
		setConversations((prevConversations) => {
			const updatedConversations = JSON.parse(JSON.stringify(prevConversations));
			
			const conversationIndex = updatedConversations.findIndex((c: Conversation) => c.id === conversationId);
			
			if (conversationIndex !== -1) {
				const conversation = updatedConversations[conversationIndex];
				const lastMessageIndex = conversation.messages.length - 1;
				
				if (lastMessageIndex === -1 || conversation.messages[lastMessageIndex].role !== 'assistant') {
					conversation.messages.push({
						role: 'assistant',
						content: '',
						id: crypto.randomUUID(),
						created: Date.now(),
						model: model
					});
				}
				
				const lastMessage = conversation.messages[conversation.messages.length - 1];
				
				if (message) {
					conversation.messages[conversation.messages.length - 1] = {
						...message,
						role: 'assistant',
						content: content,
						reasoning: reasoning ? {
							collapsed: false,
							content: reasoning,
						} : undefined
					};
				} else {
					lastMessage.content = content;
					
					if (reasoning) {
						lastMessage.reasoning = {
							collapsed: false,
							content: reasoning,
						};
					}
				}
			}
			
			return updatedConversations;
		});
		
		scrollToBottom();
	};

	const generateResponse = async (
		messages: Message[],
		generateFn: (messages: Message[], handleProgress: (text: string) => void) => Promise<string>
	): Promise<string> => {
		let response = '';

		const handleProgress = (text: string) => {
			response += text;
			aiResponseRef.current = response;
			updateConversation(response);
		};

		return await generateFn(messages, handleProgress);
	};

	const handleLocalGeneration = async (messages: Message[]): Promise<string> => {
		return generateResponse(messages, async (messages, handleProgress) => {
			const lastMessage = messages[messages.length - 1];
			return await webLLMService.current.generate(
				String(conversationId),
				lastMessage.content,
				async (_chatId, content, _model, _mode, role) => {
					if (role !== 'user') {
						updateConversation(content);
					}
					return [];
				},
				handleProgress
			);
		});
	};

	const handleRemoteGeneration = async (messages: Message[]): Promise<string> => {
		return generateResponse(messages, async (messages) => {
			const formattedMessages = messages.map((msg) => ({
				role: msg.role,
				content: [{ type: 'text', text: msg.content }],
			}));

			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
				'x-user-email': 'anonymous@undefined.computer',
			};

			const apiKey = await apiKeyService.getApiKey();
			if (apiKey) {
				headers.Authorization = `Bearer ${apiKey}`;
			}

			const response = await fetch(`${apiBaseUrl}/chat/completions`, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					chat_id: String(conversationId),
					model,
					mode,
					messages: formattedMessages,
					shouldSave: false,
					platform: 'web',
					responseMode: chatSettings.responseMode || 'normal',
					...chatSettings,
				}),
				signal: controller.signal,
			});

			if (!response.ok) {
				const error = await response.json();
				throw new ApiError(response.status, error.error || 'Failed to generate response');
			}

			const data = await response.json();
			aiResponseRef.current = '';
			aiReasoningRef.current = '';

			for (const choice of data.choices) {
				if (choice.message.role === 'assistant' && choice.message.content) {
					const content = choice.message.content;
					const analysisMatch = content.match(/<analysis>(.*?)<\/analysis>/s);
					if (analysisMatch) {
						aiReasoningRef.current += analysisMatch[1].trim();
					}

					const cleanedContent = content
						.replace(/<analysis>.*?<\/analysis>/gs, '')
						.replace(/<answer>.*?(<\/answer>)?/gs, '')
						.replace(/<answer>/g, '')
						.replace(/<\/answer>/g, '')
						.trim();

					aiResponseRef.current += cleanedContent;
				} else if (choice.message.role === 'tool') {
					aiResponseRef.current += choice.message.content;
				}

				updateConversation(aiResponseRef.current, aiReasoningRef.current, {
					id: data.id,
					created: data.created,
					model: data.model,
					role: 'assistant',
					content: aiResponseRef.current,
					citations: choice.message.citations,
					usage: data.usage,
					logId: data.logId
				});
			}

			return aiResponseRef.current;
		});
	};

	const streamResponse = async (messages: Message[]) => {
		if (!messages.length) {
			addError('No messages provided');
			throw new Error('No messages provided');
		}

		const loadingId = 'stream-response';
		startLoading(loadingId, 'Generating response...');
		setState((prev) => ({ ...prev, streamStarted: true }));

		try {
			const response = mode === 'local' ? await handleLocalGeneration(messages) : await handleRemoteGeneration(messages);
			return response;
		} catch (error) {
			if (controller.signal.aborted) {
				addError('Request aborted', 'info');
			} else {
				const streamError = error as StreamError;
				console.error('Error generating response:', streamError);
				addError(streamError.message || 'Failed to generate response');
				throw streamError;
			}
		} finally {
			setState((prev) => ({ ...prev, streamStarted: false }));
			stopLoading(loadingId);
			setController(new AbortController());
		}
	};

	return {
		...state,
		controller,
		streamResponse,
		aiResponseRef,
		aiReasoningRef,
	};
};

import { useState, useRef, useEffect } from "react";

import type { Message, Conversation, ChatMode, ChatSettings } from "../types";
import { WebLLMService } from "../lib/web-llm";
import { modelsOptions } from "../lib/models";
import { useError } from "../contexts/ErrorContext";
import { useLoading } from "../contexts/LoadingContext";
import { useChatStore } from "../stores/chatStore";
import { apiService } from "../lib/api-service";

interface StreamState {
	streamStarted: boolean;
}

interface StreamError extends Error {
	status?: number;
	code?: string;
}

interface UseStreamResponseProps {
	conversationId?: string;
	scrollToBottom: () => void;
	mode: ChatMode;
	model: string;
	chatSettings: ChatSettings;
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
		streamStarted: false,
	});

	const { addError } = useError();
	const { startLoading, updateLoading, stopLoading } = useLoading();
	const [controller, setController] = useState(() => new AbortController());
	const webLLMService = useRef<WebLLMService>(WebLLMService.getInstance());
	const aiResponseRef = useRef<string>("");
	const aiReasoningRef = useRef<string>("");

	const matchingModel = modelsOptions.find(
		(modelOption) => model === modelOption.id,
	);

	useEffect(() => {
		const initializeLocalModel = async () => {
			if (mode === "local" && matchingModel?.isLocal) {
				try {
					const loadingId = "model-init";
					startLoading(loadingId, "Initializing local model...");
					await webLLMService.current.init(model, (progress) => {
						const progressPercent = Math.round(progress.progress * 100);
						updateLoading(loadingId, progressPercent, progress.text);
					});
				} catch (error) {
					console.error("Failed to initialize WebLLM:", error);
					addError("Failed to initialize local model. Please try again.");
				} finally {
					stopLoading("model-init");
				}
			}
		};

		initializeLocalModel();
	}, [
		mode,
		model,
		matchingModel?.isLocal,
		startLoading,
		updateLoading,
		stopLoading,
		addError,
	]);

	const updateConversation = (
		content: string,
		reasoning?: string,
		message?: Message,
	) => {
		setConversations((prevConversations) => {
			const updatedConversations = JSON.parse(
				JSON.stringify(prevConversations),
			);

			const conversationIndex = updatedConversations.findIndex(
				(c: Conversation) => c.id === conversationId,
			);

			if (conversationIndex !== -1) {
				const conversation = updatedConversations[conversationIndex];
				const lastMessageIndex = conversation.messages.length - 1;

				if (
					lastMessageIndex === -1 ||
					conversation.messages[lastMessageIndex].role !== "assistant"
				) {
					conversation.messages.push({
						role: "assistant",
						content: "",
						id: crypto.randomUUID(),
						created: Date.now(),
						model: model,
					});
				}

				const lastMessage =
					conversation.messages[conversation.messages.length - 1];

				if (message) {
					conversation.messages[conversation.messages.length - 1] = {
						...message,
						role: "assistant",
						content: content,
						reasoning: reasoning
							? {
									collapsed: true,
									content: reasoning,
								}
							: undefined,
					};
				} else {
					lastMessage.content = content;

					if (reasoning) {
						lastMessage.reasoning = {
							collapsed: true,
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
		generateFn: (
			messages: Message[],
			handleProgress: (text: string) => void,
		) => Promise<string>,
	): Promise<string> => {
		let response = "";

		const handleProgress = (text: string) => {
			response += text;
			aiResponseRef.current = response;
			updateConversation(response);
		};

		return await generateFn(messages, handleProgress);
	};

	const handleLocalGeneration = async (
		messages: Message[],
	): Promise<string> => {
		return generateResponse(messages, async (messages, handleProgress) => {
			const lastMessage = messages[messages.length - 1];
			return await webLLMService.current.generate(
				String(conversationId),
				lastMessage.content,
				async (_chatId, content, _model, _mode, role) => {
					if (role !== "user") {
						updateConversation(content);
					}
					return [];
				},
				handleProgress,
			);
		});
	};

	const handleRemoteGeneration = async (
		messages: Message[],
	): Promise<string> => {
		return generateResponse(messages, async (messages) => {
			if (!conversationId) {
				throw new Error("No conversation ID provided");
			}

			try {
				const assistantMessage = await apiService.streamChatCompletions(
					conversationId,
					messages,
					model,
					mode,
					chatSettings,
					controller.signal,
					(text) => {
						aiResponseRef.current = text;
						updateConversation(text);
					}
				);

				if (assistantMessage.reasoning) {
					aiReasoningRef.current = assistantMessage.reasoning.content;
				}

				updateConversation(
					assistantMessage.content,
					assistantMessage.reasoning?.content,
					{
						id: assistantMessage.id,
						created: assistantMessage.created,
						model: assistantMessage.model,
						role: "assistant",
						content: assistantMessage.content,
						citations: assistantMessage.citations,
						usage: assistantMessage.usage,
						logId: assistantMessage.logId,
					}
				);

				if (messages.length <= 2) {
					try {
						const title = await apiService.generateTitle(
							conversationId,
							[...messages, assistantMessage]
						);
						
						setConversations((prevConversations) => {
							return prevConversations.map((conv) => {
								if (conv.id === conversationId) {
									return { ...conv, title };
								}
								return conv;
							});
						});
					} catch (error) {
						console.error("Failed to generate title:", error);
					}
				}

				return assistantMessage.content;
			} catch (error) {
				if (controller.signal.aborted) {
					throw new Error("Request aborted");
				}
				throw error;
			}
		});
	};

	const streamResponse = async (messages: Message[]) => {
		if (!messages.length) {
			addError("No messages provided");
			throw new Error("No messages provided");
		}

		const loadingId = "stream-response";
		startLoading(loadingId, "Generating response...");
		setState((prev) => ({ ...prev, streamStarted: true }));

		try {
			const response =
				mode === "local"
					? await handleLocalGeneration(messages)
					: await handleRemoteGeneration(messages);
			return response;
		} catch (error) {
			if (controller.signal.aborted) {
				addError("Request aborted", "info");
			} else {
				const streamError = error as StreamError;
				console.error("Error generating response:", streamError);
				addError(streamError.message || "Failed to generate response");
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
